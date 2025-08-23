// src/rest/classification/classification.service.ts
import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateClassificationDto,
  ClassificationQueryDto,
  ClassificationStatsDto,
  ClassificationResponseDto,
  ClassificationStatsResponseDto,
  WasteCategoryEnum,
} from './dto/classification.dto';
import {
  ClassificationRecord,
  MastraAgentInput,
  MastraAgentResponse,
  CategoryBreakdown,
  CategoryStatsItem,
  AvailableAchievement,
} from './classification.types';

@Injectable()
export class ClassificationService {
  private readonly logger = new Logger(ClassificationService.name);
  private readonly mastraBaseUrl =
    process.env.MASTRA_API_URL || 'http://localhost:4111/api/agents/wasteClassifier/generate';
  private readonly mastraTimeout = parseInt(
    process.env.MASTRA_TIMEOUT_MS || '30000',
    10,
  );
  private readonly retryCount = parseInt(
    process.env.MASTRA_RETRY_COUNT || '3',
    10,
  );

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建新的垃圾分类记录
   */
  async createClassification(
    dto: CreateClassificationDto,
  ): Promise<ClassificationResponseDto> {
    const startTime = Date.now();

    try {
      // TODO: 实现用户限流逻辑
      // await this.checkRateLimit(dto.walletAddress);

      // 1. 调用Mastra AI服务进行图像分析和评分
      this.logger.log(`开始分析图片: ${dto.imageUrl}`);
      const aiResult = await this.callMastraAgent({
        imageUrl: dto.imageUrl,
        expectedCategory: dto.expectedCategory,
        userLocation: dto.userLocation || '中国',
      });

      // 2. 保存分类记录到数据库 - 使用简化的响应格式
      const aiResponseJson: {
        match?: boolean;
        score?: number;
        reasoning?: string;
        suggestions?: string[];
        improvementTips?: string[];
        detailedAnalysis?: string;
        learningPoints?: string[];
      } = aiResult;

      const classificationData: Prisma.ClassificationCreateInput = {
        imageUrl: dto.imageUrl,
        expectedCategory: dto.expectedCategory,
        aiDetectedCategory: aiResult.ai_detected_category,
        aiConfidence: new Prisma.Decimal(aiResult.ai_confidence),
        isCorrect: aiResult.is_correct,
        score: aiResult.score,
        aiAnalysis: aiResult.ai_analysis,
        aiResponse: aiResponseJson,
        walletAddress: dto.walletAddress,
        userLocation: dto.userLocation,
        deviceInfo: dto.deviceInfo,
        processingTimeMs: aiResult.processing_time_ms,
      };

      const classification =
        await this.prisma.prismaClient.classification.create({
          data: classificationData,
        });

      // 3. 记录积分交易
      if (aiResult.score > 0) {
        const scoreData: Prisma.ScoreTransactionCreateInput = {
          walletAddress: dto.walletAddress,
          amount: aiResult.score,
          type: 'classification',
          referenceId: classification.id,
          referenceType: 'classification',
          description: `垃圾分类奖励 - ${aiResult.is_correct ? '正确' : '参与'}分类`,
          isValid: true,
        };

        await this.prisma.prismaClient.scoreTransaction.create({
          data: scoreData,
        });
      }

      this.logger.log(
        `分类完成: ID=${classification.id}, 得分=${aiResult.score}, 用时=${Date.now() - startTime}ms`,
      );

      return this.mapToResponseDto(classification);
    } catch (error) {
      this.logger.error(
        `分类失败: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('分类处理失败，请稍后重试');
    }
  }

  /**
   * 获取用户分类历史
   */
  async getUserClassifications(query: ClassificationQueryDto): Promise<{
    data: ClassificationResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { walletAddress, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [classifications, total] = await Promise.all([
      this.prisma.prismaClient.classification.findMany({
        where: { walletAddress },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.prismaClient.classification.count({
        where: { walletAddress },
      }),
    ]);

    return {
      data: classifications.map((classification) =>
        this.mapToResponseDto(classification),
      ),
      total,
      page,
      limit,
    };
  }

  /**
   * 获取用户统计数据
   */
  async getUserStats(
    dto: ClassificationStatsDto,
  ): Promise<ClassificationStatsResponseDto> {
    const { walletAddress } = dto;

    // 基础统计
    const [
      totalClassifications,
      correctClassifications,
      totalScore,
      categoryStats,
      recentClassifications,
    ] = await Promise.all([
      this.prisma.prismaClient.classification.count({
        where: { walletAddress },
      }),
      this.prisma.prismaClient.classification.count({
        where: { walletAddress, isCorrect: true },
      }),
      this.prisma.prismaClient.scoreTransaction.aggregate({
        where: { walletAddress, isValid: true },
        _sum: { amount: true },
      }),
      this.getCategoryBreakdown(walletAddress),
      this.prisma.prismaClient.classification.findMany({
        where: { walletAddress },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const accuracyRate =
      totalClassifications > 0
        ? Math.round((correctClassifications / totalClassifications) * 100)
        : 0;

    const averageScore =
      totalClassifications > 0
        ? Math.round((totalScore._sum.amount || 0) / totalClassifications)
        : 0;

    // 查询可获得的成就
    const achievements = await this.getAvailableAchievements(walletAddress);

    return {
      totalClassifications,
      correctClassifications,
      accuracyRate,
      totalScore: totalScore._sum.amount || 0,
      averageScore,
      categoryBreakdown: categoryStats,
      recentClassifications: recentClassifications.map((classification) =>
        this.mapToResponseDto(classification),
      ),
      achievements: {
        canEarn: achievements,
      },
    };
  }

  /**
   * 调用Mastra分类Agent
   */
  private async callMastraAgent(
    input: MastraAgentInput,
  ): Promise<MastraAgentResponse> {
    try {
      this.logger.log(`Mastra API调用开始`);

      const agentEndpoint = this.mastraBaseUrl;
      console.log('调用 Agent:', agentEndpoint);

      const response = await fetch(agentEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `imageUrl=${input.imageUrl}, expectedCategory=${input.expectedCategory}, userLocation=${input.userLocation || '中国'}`,
            },
          ],
        }),
        signal: AbortSignal.timeout(this.mastraTimeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Mastra API调用失败: ${response.status} - ${errorText}`;
        this.logger.error(errorMessage);

        if (response.status >= 400 && response.status < 500) {
          throw new BadRequestException(`图像分析失败: ${response.statusText}`);
        }

        throw new Error(errorMessage);
      }

      const rawResult = (await response.json()) as { text: string };

      // 🔧 清理 JSON 字符串
      let jsonStr = rawResult.text;

      jsonStr = jsonStr
        .replace(/'\s*\+\s*\n\s*'/g, '') // 移除 ' + \n '
        .replace(/\\\n/g, '') // 移除 \n
        .replace(/\\"/g, '"') // 处理转义引号
        .trim();

      // 找到完整的 JSON 对象
      const startIndex = jsonStr.indexOf('{');
      const endIndex = jsonStr.lastIndexOf('}');

      if (startIndex !== -1 && endIndex !== -1) {
        const cleanJson = jsonStr.substring(startIndex, endIndex + 1);

        // 根据新的响应格式解析数据
        const agentData = JSON.parse(cleanJson) as {
          imageUrl?: string;
          expectedCategory?: string;
          userLocation?: string;
          aiDetectedCategory?: string;
          aiConfidence?: number;
          isCorrect?: boolean;
          score?: number;
          aiAnalysis?: string;
          aiResponse?: {
            match?: boolean;
            score?: number;
            reasoning?: string;
            suggestions?: string[];
            improvementTips?: string[];
            detailedAnalysis?: string;
            learningPoints?: string[];
          };
          processingTimeMs?: number;
        };

        // 构造标准化的响应
        const standardizedResponse: MastraAgentResponse = {
          ai_detected_category: agentData.aiDetectedCategory || '未知',
          ai_confidence: agentData.aiConfidence || 0,
          is_correct: agentData.isCorrect || false,
          score: agentData.isCorrect ? agentData.score || 0 : 0,
          ai_analysis:
            agentData.aiAnalysis ||
            agentData.aiResponse?.detailedAnalysis ||
            '分析失败',
          ai_response: agentData.aiResponse || {},
          processing_time_ms: agentData.processingTimeMs || 0,
        };

        this.logger.log(
          `Mastra API调用成功，处理时间: ${agentData.processingTimeMs}ms`,
        );
        return standardizedResponse;
      } else {
        throw new Error('无法找到有效的JSON数据');
      }
    } catch (error) {
      this.logger.error(
        `Mastra API调用失败: ${error instanceof Error ? error.message : String(error)}`,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('AI服务暂时不可用，请稍后重试');
    }
  }

  /**
   * 获取分类统计分布
   */
  private async getCategoryBreakdown(
    walletAddress: string,
  ): Promise<CategoryBreakdown> {
    const categories = Object.values(WasteCategoryEnum);
    const breakdown: Partial<CategoryBreakdown> = {};

    for (const category of categories) {
      const [total, correct] = await Promise.all([
        this.prisma.prismaClient.classification.count({
          where: { walletAddress, expectedCategory: category },
        }),
        this.prisma.prismaClient.classification.count({
          where: { walletAddress, expectedCategory: category, isCorrect: true },
        }),
      ]);

      const statsItem: CategoryStatsItem = {
        total,
        correct,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      };

      breakdown[category] = statsItem;
    }

    return breakdown as CategoryBreakdown;
  }

  /**
   * 获取可获得的成就
   */
  private async getAvailableAchievements(
    walletAddress: string,
  ): Promise<AvailableAchievement[]> {
    try {
      // 简单查询活跃成就
      const achievements = await this.prisma.prismaClient.achievement.findMany({
        where: { isActive: true },
        take: 5,
        orderBy: { tier: 'asc' },
      });

      // 简单计数查询
      const userClassificationCount =
        await this.prisma.prismaClient.classification.count({
          where: { walletAddress },
        });

      // 简化的映射逻辑
      return achievements.map((achievement) => ({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        progress: Math.min(userClassificationCount, 100), // 简化进度
        target: 100, // 固定目标值
      }));
    } catch (error) {
      this.logger.error('获取可用成就失败:', error);
      return []; // 优雅降级
    }
  }

  /**
   * 安全地获取对象属性值
   */
  private safeGet(
    obj: unknown,
    path: string,
    defaultValue: unknown = '',
  ): unknown {
    if (!obj || typeof obj !== 'object') {
      return defaultValue;
    }

    const keys = path.split('.');
    let current = obj as Record<string, unknown>;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key] as Record<string, unknown>;
      } else {
        return defaultValue;
      }
    }

    return current ?? defaultValue;
  }

  /**
   * 安全地获取数组值
   */
  private safeGetArray(obj: unknown, path: string): unknown[] {
    const value = this.safeGet(obj, path, []);
    return Array.isArray(value) ? value : [];
  }

  /**
   * 数据转换方法 - 简化且类型安全的版本
   */
  private mapToResponseDto(
    classification: ClassificationRecord,
  ): ClassificationResponseDto {
    // 类型安全地处理 aiResponse
    const aiResponse = classification.aiResponse;

    // 使用辅助方法安全地提取数据 - 更新为新的响应格式
    const aiDescription = this.safeGet(
      aiResponse,
      'analysisResult.description',
      classification.aiAnalysis || '',
    ) as string;

    const characteristics = this.safeGetArray(
      aiResponse,
      'analysisResult.characteristics',
    ) as string[];
    const materialType = this.safeGet(
      aiResponse,
      'analysisResult.materialType',
      '',
    ) as string;
    const disposalInstructions = this.safeGet(
      aiResponse,
      'analysisResult.disposalInstructions',
      '',
    ) as string;
    const detailedAnalysis = this.safeGet(
      aiResponse,
      'scoringResult.detailedAnalysis',
      classification.aiAnalysis || '',
    ) as string;
    const learningPoints = this.safeGetArray(
      aiResponse,
      'scoringResult.learningPoints',
    ) as string[];
    const suggestions = this.safeGetArray(
      aiResponse,
      'scoringResult.suggestions',
    ) as string[];
    const improvementTips = this.safeGetArray(
      aiResponse,
      'scoringResult.improvementTips',
    ) as string[];

    return {
      id: classification.id,
      imageUrl: classification.imageUrl,
      expectedCategory: classification.expectedCategory,
      aiDetectedCategory: classification.aiDetectedCategory || '',
      isCorrect: classification.isCorrect,
      score: classification.score,
      confidence: classification.aiConfidence
        ? Number(classification.aiConfidence)
        : 0,
      aiDescription,
      characteristics,
      materialType,
      disposalInstructions,
      detailedAnalysis,
      learningPoints,
      suggestions,
      improvementTips,
      walletAddress: classification.walletAddress,
      userLocation: classification.userLocation || undefined,
      deviceInfo: classification.deviceInfo || undefined,
      createdAt: classification.createdAt,
      updatedAt: classification.updatedAt,
    };
  }
}
