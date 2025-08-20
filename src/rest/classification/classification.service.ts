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
  MastraWorkflowInput,
  MastraWorkflowResponse,
  CategoryBreakdown,
  CategoryStatsItem,
  AvailableAchievement,
} from './classification.types';

@Injectable()
export class ClassificationService {
  private readonly logger = new Logger(ClassificationService.name);
  private readonly mastraBaseUrl =
    process.env.MASTRA_API_URL || 'http://localhost:4111';

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
      const aiResult = await this.callMastraClassificationWorkflow({
        imageUrl: dto.imageUrl,
        expectedCategory: dto.expectedCategory,
        userLocation: dto.userLocation || '中国',
      });

      // 2. 保存分类记录到数据库 - 根据实际的 classifications 表结构，类型安全处理
      const aiResponseJson: Prisma.InputJsonValue = {
        score: aiResult.score,
        match: aiResult.match,
        reasoning: aiResult.reasoning,
        suggestions: aiResult.suggestions,
        improvementTips: aiResult.improvementTips,
        detailedAnalysis: aiResult.detailedAnalysis,
        learningPoints: aiResult.learningPoints,
        analysisData: {
          detectedCategory: aiResult.analysisData.detectedCategory,
          confidence: aiResult.analysisData.confidence,
          description: aiResult.analysisData.description,
          characteristics: aiResult.analysisData.characteristics,
          materialType: aiResult.analysisData.materialType,
          disposalInstructions: aiResult.analysisData.disposalInstructions,
        },
      };

      const classificationData: Prisma.ClassificationCreateInput = {
        imageUrl: dto.imageUrl,
        expectedCategory: dto.expectedCategory,
        aiDetectedCategory: aiResult.analysisData.detectedCategory,
        aiConfidence: new Prisma.Decimal(aiResult.analysisData.confidence),
        isCorrect: aiResult.match,
        score: aiResult.score,
        aiAnalysis: aiResult.detailedAnalysis, // 存储详细分析文本
        aiResponse: aiResponseJson, // 类型安全的JSON存储
        walletAddress: dto.walletAddress,
        userLocation: dto.userLocation,
        deviceInfo: dto.deviceInfo,
        processingTimeMs: Date.now() - startTime,
      };

      const classification =
        await this.prisma.prismaClient.classification.create({
          data: classificationData,
        });

      // 3. 记录积分交易 - 根据实际的 score_transactions 表结构
      if (aiResult.score > 0) {
        const scoreData: Prisma.ScoreTransactionCreateInput = {
          walletAddress: dto.walletAddress,
          amount: aiResult.score,
          type: 'classification', // 交易类型
          referenceId: classification.id,
          referenceType: 'classification',
          description: `垃圾分类奖励 - ${aiResult.match ? '正确' : '参与'}分类`,
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
   * 调用Mastra分类工作流
   */
  private async callMastraClassificationWorkflow(
    input: MastraWorkflowInput,
  ): Promise<MastraWorkflowResponse> {
    try {
      const response = await fetch(
        `${this.mastraBaseUrl}/workflows/classificationWorkflow/run`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
          // 增加超时时间，因为AI处理需要时间
          signal: AbortSignal.timeout(30000), // 30秒超时
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Mastra API调用失败: ${response.status} - ${errorText}`,
        );
        throw new BadRequestException(`图像分析失败: ${response.statusText}`);
      }

      const result: unknown = await response.json();

      // 类型守卫：验证返回结果结构
      if (!this.isMastraWorkflowResponse(result)) {
        this.logger.error('Mastra返回数据格式异常:', result);
        throw new InternalServerErrorException('AI分析结果格式异常');
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Mastra API调用异常: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('AI服务暂时不可用，请稍后重试');
    }
  }

  /**
   * 类型守卫：验证Mastra响应格式
   */
  private isMastraWorkflowResponse(
    obj: unknown,
  ): obj is MastraWorkflowResponse {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    const response = obj as Record<string, unknown>;

    return (
      typeof response.score === 'number' &&
      typeof response.match === 'boolean' &&
      typeof response.reasoning === 'string' &&
      Array.isArray(response.suggestions) &&
      Array.isArray(response.improvementTips) &&
      typeof response.detailedAnalysis === 'string' &&
      Array.isArray(response.learningPoints) &&
      typeof response.analysisData === 'object' &&
      response.analysisData !== null &&
      this.isAnalysisData(response.analysisData)
    );
  }

  /**
   * 类型守卫：验证分析数据格式
   */
  private isAnalysisData(
    obj: unknown,
  ): obj is MastraWorkflowResponse['analysisData'] {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    const data = obj as Record<string, unknown>;

    return (
      typeof data.detectedCategory === 'string' &&
      typeof data.confidence === 'number' &&
      typeof data.description === 'string' &&
      Array.isArray(data.characteristics) &&
      typeof data.materialType === 'string' &&
      typeof data.disposalInstructions === 'string'
    );
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

    // 使用辅助方法安全地提取数据
    const aiDescription = this.safeGet(
      aiResponse,
      'analysisData.description',
      classification.aiAnalysis || '',
    ) as string;

    const characteristics = this.safeGetArray(
      aiResponse,
      'analysisData.characteristics',
    ) as string[];
    const materialType = this.safeGet(
      aiResponse,
      'analysisData.materialType',
      '',
    ) as string;
    const disposalInstructions = this.safeGet(
      aiResponse,
      'analysisData.disposalInstructions',
      '',
    ) as string;
    const detailedAnalysis = this.safeGet(
      aiResponse,
      'detailedAnalysis',
      classification.aiAnalysis || '',
    ) as string;
    const learningPoints = this.safeGetArray(
      aiResponse,
      'learningPoints',
    ) as string[];
    const suggestions = this.safeGetArray(
      aiResponse,
      'suggestions',
    ) as string[];
    const improvementTips = this.safeGetArray(
      aiResponse,
      'improvementTips',
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
