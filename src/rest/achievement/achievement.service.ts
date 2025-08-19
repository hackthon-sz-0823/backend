import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { WalletService } from '@src/shared/wallet/wallet.service';
import { Achievement, WalletAchievement } from '@prisma/client';
import {
  CreateAchievementDto,
  UpdateAchievementDto,
  ClaimAchievementDto,
  UpdateProgressDto,
  AchievementQueryDto,
  UserAchievementQueryDto,
  BatchCreateAchievementsDto,
  AchievementRequirements,
} from './dto/achievement.dto';

// 用户统计数据接口
export interface UserStats {
  netScore: number;
  classificationAccuracy: number;
  totalClassifications: number;
  scoreEarned: number;
  scoreSpent: number;
  averageScorePerDay: number;
  activeDays: number;
}

export interface AchievementWithProgress {
  id: number;
  code: string;
  name: string;
  description: string;
  scoreReward: number;
  iconUrl?: string;
  category: string;
  tier: number;
  requirements?: AchievementRequirements;
  progress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  completedAt?: Date;
  claimedAt?: Date;
  canClaim: boolean;
  missingRequirements?: string[];
}

export interface AchievementStats {
  totalAchievements: number;
  completedAchievements: number;
  claimedAchievements: number;
  unclaimedRewards: number;
  completionRate: number;
  totalScoreEarned: number;
  averageProgress: number;
  byCategory: Array<{
    category: string;
    total: number;
    completed: number;
    claimed: number;
  }>;
  byTier: Array<{
    tier: number;
    total: number;
    completed: number;
    claimed: number;
  }>;
}

@Injectable()
export class AchievementService {
  private readonly logger = new Logger(AchievementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  // ==========================================
  // 管理员功能
  // ==========================================

  /**
   * 创建新成就
   */
  async createAchievement(dto: CreateAchievementDto): Promise<Achievement> {
    try {
      // 检查成就代码是否已存在
      const existingAchievement =
        await this.prisma.prismaClient.achievement.findUnique({
          where: { code: dto.code },
        });

      if (existingAchievement) {
        throw new ConflictException(`成就代码 "${dto.code}" 已存在`);
      }

      const achievement = await this.prisma.prismaClient.achievement.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          scoreReward: dto.scoreReward,
          iconUrl: dto.iconUrl,
          category: dto.category,
          tier: dto.tier,
          isActive: dto.isActive ?? true,
          requirements: dto.requirements
            ? JSON.stringify(dto.requirements)
            : undefined,
          maxClaims: dto.maxClaims,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          sortOrder: dto.sortOrder ?? 0,
        },
      });

      this.logger.log(
        `Created achievement: ${achievement.name} (${achievement.code})`,
      );
      return achievement;
    } catch (error) {
      this.logger.error(
        `Error creating achievement: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 更新成就信息
   */
  async updateAchievement(
    id: number,
    dto: UpdateAchievementDto,
  ): Promise<Achievement> {
    try {
      const existingAchievement =
        await this.prisma.prismaClient.achievement.findUnique({
          where: { id },
        });

      if (!existingAchievement) {
        throw new NotFoundException(`成就 ID ${id} 不存在`);
      }

      const achievement = await this.prisma.prismaClient.achievement.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          scoreReward: dto.scoreReward,
          iconUrl: dto.iconUrl,
          isActive: dto.isActive,
          requirements: dto.requirements
            ? JSON.stringify(dto.requirements)
            : undefined,
          maxClaims: dto.maxClaims,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
          sortOrder: dto.sortOrder,
        },
      });

      this.logger.log(`Updated achievement: ${achievement.name} (ID: ${id})`);
      return achievement;
    } catch (error) {
      this.logger.error(
        `Error updating achievement: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 删除成就
   */
  async deleteAchievement(id: number): Promise<void> {
    try {
      const achievement = await this.prisma.prismaClient.achievement.findUnique(
        {
          where: { id },
        },
      );

      if (!achievement) {
        throw new NotFoundException(`成就 ID ${id} 不存在`);
      }

      await this.prisma.prismaClient.achievement.delete({
        where: { id },
      });

      this.logger.log(`Deleted achievement: ${achievement.name} (ID: ${id})`);
    } catch (error) {
      this.logger.error(
        `Error deleting achievement: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 获取所有成就（管理员视图）
   */
  async getAchievements(query: AchievementQueryDto): Promise<{
    achievements: Achievement[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = query;
      const skip = (page - 1) * limit;

      // 构建查询条件
      const where: {
        category?: string;
        tier?: number;
        isActive?: boolean;
        OR?: Array<{
          name?: { contains: string; mode: 'insensitive' };
          description?: { contains: string; mode: 'insensitive' };
          code?: { contains: string; mode: 'insensitive' };
        }>;
      } = {};

      if (query.category) {
        where.category = query.category;
      }

      if (query.tier) {
        where.tier = query.tier;
      }

      if (query.isActive !== undefined) {
        where.isActive = query.isActive;
      }

      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { code: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      // 获取总数和数据
      const [total, achievements] = await Promise.all([
        this.prisma.prismaClient.achievement.count({ where }),
        this.prisma.prismaClient.achievement.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
      ]);

      return {
        achievements,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(
        `Error getting achievements: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 批量创建成就
   */
  async batchCreateAchievements(
    dto: BatchCreateAchievementsDto,
  ): Promise<Achievement[]> {
    try {
      const results: Achievement[] = [];

      for (const achievementData of dto.achievements) {
        try {
          const achievement = await this.createAchievement(achievementData);
          results.push(achievement);
        } catch (error) {
          this.logger.warn(
            `Failed to create achievement ${achievementData.code}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      this.logger.log(
        `Batch created ${results.length}/${dto.achievements.length} achievements`,
      );
      return results;
    } catch (error) {
      this.logger.error(
        `Error in batch create achievements: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 手动更新用户成就进度（管理员功能）
   */
  async updateUserProgress(dto: UpdateProgressDto): Promise<WalletAchievement> {
    try {
      const normalizedAddress = this.walletService.validateAndNormalize(
        dto.walletAddress,
      );

      // 检查成就是否存在
      const achievement = await this.prisma.prismaClient.achievement.findUnique(
        {
          where: { id: dto.achievementId },
        },
      );

      if (!achievement) {
        throw new NotFoundException(`成就 ID ${dto.achievementId} 不存在`);
      }

      // 获取或创建用户成就记录
      let walletAchievement =
        await this.prisma.prismaClient.walletAchievement.findUnique({
          where: {
            unique_wallet_achievement: {
              walletAddress: normalizedAddress,
              achievementId: dto.achievementId,
            },
          },
        });

      const isCompleted = !!(dto.progress >= 100 || dto.forceComplete);
      const updateData: {
        progress: number;
        isCompleted: boolean;
        completedAt?: Date;
      } = {
        progress: dto.progress,
        isCompleted,
        completedAt:
          isCompleted && !walletAchievement?.isCompleted
            ? new Date()
            : undefined,
      };

      if (walletAchievement) {
        walletAchievement =
          await this.prisma.prismaClient.walletAchievement.update({
            where: { id: walletAchievement.id },
            data: updateData,
          });
      } else {
        walletAchievement =
          await this.prisma.prismaClient.walletAchievement.create({
            data: {
              walletAddress: normalizedAddress,
              achievementId: dto.achievementId,
              ...updateData,
            },
          });
      }

      this.logger.log(
        `Updated progress for ${normalizedAddress}: ${achievement.name} -> ${dto.progress}%`,
      );
      return walletAchievement;
    } catch (error) {
      this.logger.error(
        `Error updating user progress: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // ==========================================
  // 用户功能
  // ==========================================

  /**
   * 获取用户成就列表
   */
  async getUserAchievements(
    query: UserAchievementQueryDto,
  ): Promise<AchievementWithProgress[]> {
    try {
      const normalizedAddress = this.walletService.validateAndNormalize(
        query.walletAddress,
      );

      // 构建查询条件
      const achievementWhere: {
        isActive: boolean;
        category?: string;
      } = { isActive: true };

      if (query.category) {
        achievementWhere.category = query.category;
      }

      // 获取所有符合条件的成就
      const achievements = await this.prisma.prismaClient.achievement.findMany({
        where: achievementWhere,
        orderBy: [{ tier: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
      // 获取用户的成就记录
      const userAchievements =
        await this.prisma.prismaClient.walletAchievement.findMany({
          where: {
            walletAddress: normalizedAddress,
            achievementId: { in: achievements.map((a) => a.id) },
          },
        });
      console.log(userAchievements, 'userAchievements');
      // 创建用户成就记录映射
      const userAchievementMap = new Map(
        userAchievements.map((ua) => [ua.achievementId, ua]),
      );

      // 获取用户统计数据（用于检查成就要求）
      const userStats: UserStats =
        await this.walletService.getWalletStats(normalizedAddress);

      // 组合数据
      const results: AchievementWithProgress[] = await Promise.all(
        achievements.map(
          async (achievement): Promise<AchievementWithProgress> => {
            const userAchievement = userAchievementMap.get(achievement.id);
            const requirements = achievement.requirements
              ? (JSON.parse(
                  achievement.requirements as string,
                ) as AchievementRequirements)
              : undefined;

            // 计算实际进度和缺失要求
            const { actualProgress, missingRequirements } =
              await this.calculateProgress(
                requirements,
                userStats,
                normalizedAddress,
              );

            const progress = userAchievement?.progress ?? actualProgress;
            const isCompleted = userAchievement?.isCompleted ?? progress >= 100;
            const isClaimed = userAchievement?.isClaimed ?? false;
            const canClaim = isCompleted && !isClaimed;

            return {
              id: achievement.id,
              code: achievement.code,
              name: achievement.name,
              description: achievement.description,
              scoreReward: achievement.scoreReward,
              iconUrl: achievement.iconUrl || '',
              category: achievement.category,
              tier: achievement.tier,
              requirements,
              progress,
              isCompleted,
              isClaimed,
              completedAt: userAchievement?.completedAt || undefined,
              claimedAt: userAchievement?.claimedAt || undefined,
              canClaim,
              missingRequirements:
                missingRequirements.length > 0
                  ? missingRequirements
                  : undefined,
            };
          },
        ),
      );

      // 应用筛选
      let filteredResults = results;

      if (query.completedOnly) {
        filteredResults = filteredResults.filter((r) => r.isCompleted);
      }

      if (query.claimableOnly) {
        filteredResults = filteredResults.filter((r) => r.canClaim);
      }

      if (query.claimedOnly) {
        filteredResults = filteredResults.filter((r) => r.isClaimed);
      }

      return filteredResults;
    } catch (error) {
      this.logger.error(
        `Error getting user achievements: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 获取用户可领取的成就
   */
  async getClaimableAchievements(
    walletAddress: string,
  ): Promise<AchievementWithProgress[]> {
    const achievements = await this.getUserAchievements({
      walletAddress,
      claimableOnly: true,
    });

    return achievements;
  }

  /**
   * 领取成就奖励
   */
  async claimAchievement(dto: ClaimAchievementDto): Promise<{
    achievement: Achievement;
    scoreAwarded: number;
    transactionId: number;
    message: string;
  }> {
    try {
      const normalizedAddress = this.walletService.validateAndNormalize(
        dto.walletAddress,
      );

      // 检查成就是否存在
      const achievement = await this.prisma.prismaClient.achievement.findUnique(
        {
          where: { id: dto.achievementId },
        },
      );

      if (!achievement) {
        throw new NotFoundException(`成就 ID ${dto.achievementId} 不存在`);
      }

      // 检查用户成就记录
      const walletAchievement =
        await this.prisma.prismaClient.walletAchievement.findUnique({
          where: {
            unique_wallet_achievement: {
              walletAddress: normalizedAddress,
              achievementId: dto.achievementId,
            },
          },
        });

      if (!walletAchievement || !walletAchievement.isCompleted) {
        throw new BadRequestException('成就尚未完成，无法领取奖励');
      }

      if (walletAchievement.isClaimed) {
        throw new BadRequestException('成就奖励已经领取过了');
      }

      // 检查领取次数限制
      if (achievement.maxClaims) {
        const claimCount =
          await this.prisma.prismaClient.walletAchievement.count({
            where: {
              achievementId: dto.achievementId,
              isClaimed: true,
            },
          });

        if (claimCount >= achievement.maxClaims) {
          throw new BadRequestException('成就领取次数已达上限');
        }
      }

      // 检查有效期
      const now = new Date();
      if (achievement.validFrom && now < achievement.validFrom) {
        throw new BadRequestException('成就奖励尚未开始发放');
      }
      if (achievement.validUntil && now > achievement.validUntil) {
        throw new BadRequestException('成就奖励发放已结束');
      }

      // 使用事务处理领取
      const result = await this.prisma.prismaClient.$transaction(async (tx) => {
        // 更新成就领取状态
        await tx.walletAchievement.update({
          where: { id: walletAchievement.id },
          data: {
            isClaimed: true,
            claimedAt: new Date(),
          },
        });

        // 创建积分交易记录
        const scoreTransaction = await tx.scoreTransaction.create({
          data: {
            walletAddress: normalizedAddress,
            amount: achievement.scoreReward,
            type: 'achievement',
            referenceId: achievement.id,
            referenceType: 'achievement',
            description: `领取成就奖励: ${achievement.name}`,
            metadata: {
              achievementCode: achievement.code,
              achievementTier: achievement.tier,
              achievementCategory: achievement.category,
            },
          },
        });

        return scoreTransaction;
      });

      this.logger.log(
        `Achievement claimed: ${normalizedAddress} claimed "${achievement.name}" (+${achievement.scoreReward} points)`,
      );

      return {
        achievement,
        scoreAwarded: achievement.scoreReward,
        transactionId: result.id,
        message: `成功领取成就"${achievement.name}"，获得 ${achievement.scoreReward} 积分！`,
      };
    } catch (error) {
      this.logger.error(
        `Error claiming achievement: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 获取成就详情
   */
  async getAchievementDetail(
    id: number,
    walletAddress?: string,
  ): Promise<AchievementWithProgress> {
    try {
      const achievement = await this.prisma.prismaClient.achievement.findUnique(
        {
          where: { id },
        },
      );

      if (!achievement) {
        throw new NotFoundException(`成就 ID ${id} 不存在`);
      }

      if (!walletAddress) {
        // 没有钱包地址，返回基础信息
        return {
          id: achievement.id,
          code: achievement.code,
          name: achievement.name,
          description: achievement.description,
          scoreReward: achievement.scoreReward,
          iconUrl: achievement.iconUrl || '',
          category: achievement.category,
          tier: achievement.tier,
          requirements: achievement.requirements
            ? (JSON.parse(
                achievement.requirements as string,
              ) as AchievementRequirements)
            : undefined,
          progress: 0,
          isCompleted: false,
          isClaimed: false,
          canClaim: false,
        };
      }

      // 获取用户的成就进度
      const userAchievements = await this.getUserAchievements({
        walletAddress,
      });

      const userAchievement = userAchievements.find((ua) => ua.id === id);
      if (!userAchievement) {
        throw new NotFoundException('用户成就记录不存在');
      }

      return userAchievement;
    } catch (error) {
      this.logger.error(
        `Error getting achievement detail: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 获取用户成就统计
   */
  async getUserAchievementStats(
    walletAddress: string,
  ): Promise<AchievementStats> {
    try {
      const normalizedAddress =
        this.walletService.validateAndNormalize(walletAddress);

      const userAchievements = await this.getUserAchievements({
        walletAddress: normalizedAddress,
      });

      const totalAchievements = userAchievements.length;
      const completedAchievements = userAchievements.filter(
        (a) => a.isCompleted,
      ).length;
      const claimedAchievements = userAchievements.filter(
        (a) => a.isClaimed,
      ).length;
      const unclaimedRewards = userAchievements
        .filter((a) => a.canClaim)
        .reduce((sum, a) => sum + a.scoreReward, 0);

      const totalScoreEarned = userAchievements
        .filter((a) => a.isClaimed)
        .reduce((sum, a) => sum + a.scoreReward, 0);

      const averageProgress =
        totalAchievements > 0
          ? userAchievements.reduce((sum, a) => sum + a.progress, 0) /
            totalAchievements
          : 0;

      // 按分类统计
      const categoryStats = new Map<
        string,
        { total: number; completed: number; claimed: number }
      >();
      // 按等级统计
      const tierStats = new Map<
        number,
        { total: number; completed: number; claimed: number }
      >();

      userAchievements.forEach((achievement) => {
        // 分类统计
        const categoryKey = achievement.category;
        const categoryStat = categoryStats.get(categoryKey) || {
          total: 0,
          completed: 0,
          claimed: 0,
        };
        categoryStat.total++;
        if (achievement.isCompleted) categoryStat.completed++;
        if (achievement.isClaimed) categoryStat.claimed++;
        categoryStats.set(categoryKey, categoryStat);

        // 等级统计
        const tierKey = achievement.tier;
        const tierStat = tierStats.get(tierKey) || {
          total: 0,
          completed: 0,
          claimed: 0,
        };
        tierStat.total++;
        if (achievement.isCompleted) tierStat.completed++;
        if (achievement.isClaimed) tierStat.claimed++;
        tierStats.set(tierKey, tierStat);
      });

      return {
        totalAchievements,
        completedAchievements,
        claimedAchievements,
        unclaimedRewards,
        completionRate:
          totalAchievements > 0
            ? (completedAchievements / totalAchievements) * 100
            : 0,
        totalScoreEarned,
        averageProgress: Math.round(averageProgress),
        byCategory: Array.from(categoryStats.entries()).map(
          ([category, stats]) => ({
            category,
            ...stats,
          }),
        ),
        byTier: Array.from(tierStats.entries()).map(([tier, stats]) => ({
          tier,
          ...stats,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Error getting user achievement stats: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // ==========================================
  // 私有辅助方法
  // ==========================================

  /**
   * 计算成就进度
   */
  private async calculateProgress(
    requirements: AchievementRequirements | undefined,
    userStats: UserStats,
    walletAddress: string,
  ): Promise<{ actualProgress: number; missingRequirements: string[] }> {
    if (!requirements) {
      return { actualProgress: 0, missingRequirements: ['未定义成就要求'] };
    }

    const missingRequirements: string[] = [];
    let totalRequirements = 0;
    let metRequirements = 0;

    // 检查积分要求
    if (requirements.min_score !== undefined) {
      totalRequirements++;
      if (userStats.netScore >= requirements.min_score) {
        metRequirements++;
      } else {
        missingRequirements.push(
          `需要 ${requirements.min_score} 积分，当前 ${userStats.netScore}`,
        );
      }
    }

    // 检查准确率要求
    if (requirements.min_accuracy !== undefined) {
      totalRequirements++;
      if (userStats.classificationAccuracy >= requirements.min_accuracy) {
        metRequirements++;
      } else {
        missingRequirements.push(
          `需要 ${requirements.min_accuracy}% 准确率，当前 ${userStats.classificationAccuracy}%`,
        );
      }
    }

    // 检查分类次数要求
    if (requirements.min_classifications !== undefined) {
      totalRequirements++;
      // 实际查询用户分类次数
      const userClassifications =
        await this.prisma.prismaClient.classification.count({
          where: { walletAddress },
        });

      if (userClassifications >= requirements.min_classifications) {
        metRequirements++;
      } else {
        missingRequirements.push(
          `需要 ${requirements.min_classifications} 次分类，当前 ${userClassifications}`,
        );
      }
    }

    // 计算进度百分比
    const actualProgress =
      totalRequirements > 0
        ? Math.round((metRequirements / totalRequirements) * 100)
        : 0;

    return { actualProgress, missingRequirements };
  }

  /**
   * 获取成就分类统计
   */
  async getAchievementCategories(): Promise<
    Array<{
      category: string;
      categoryName: string;
      total: number;
      avgScoreReward: number;
    }>
  > {
    try {
      const stats = await this.prisma.prismaClient.achievement.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: { _all: true },
        _avg: { scoreReward: true },
      });

      const categoryNames: Record<string, string> = {
        milestone: '里程碑',
        streak: '连击',
        accuracy: '精度',
        social: '社交',
        seasonal: '季节',
        special: '特殊',
      };

      return stats.map((stat) => ({
        category: stat.category,
        categoryName: categoryNames[stat.category] || stat.category,
        total: stat._count._all,
        avgScoreReward: Math.round(stat._avg.scoreReward || 0),
      }));
    } catch (error) {
      this.logger.error(
        `Error getting achievement categories: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
