import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import {
  Classification,
  ScoreTransaction,
  WalletAchievement,
  Achievement,
} from '@prisma/client';
import { WalletUtil } from '@src/common/utils/wallet.util';

export interface WalletProfile {
  walletAddress: string;
  totalScore: number;
  totalClassifications: number;
  completedAchievements: number;
  ownedNfts: number;
  accuracy: number;
  firstActivityAt: Date | null;
  lastActivityAt: Date | null;
  formattedAddress: string;
}

export interface WalletActivity {
  recentClassifications: Pick<
    Classification,
    'id' | 'expectedCategory' | 'isCorrect' | 'score' | 'createdAt'
  >[];
  recentScores: Pick<
    ScoreTransaction,
    'id' | 'amount' | 'type' | 'description' | 'createdAt'
  >[];
  recentAchievements: (WalletAchievement & {
    achievement: Pick<Achievement, 'name' | 'description' | 'scoreReward'>;
  })[];
}

export interface WalletStats {
  totalTransactions: number;
  scoreEarned: number;
  scoreSpent: number;
  netScore: number;
  averageScorePerDay: number;
  classificationAccuracy: number;
  activeDays: number;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 验证钱包地址并标准化
   */
  validateAndNormalize(address: string): string {
    if (!address || typeof address !== 'string') {
      throw new BadRequestException('钱包地址不能为空');
    }

    if (!WalletUtil.validateAddress(address)) {
      throw new BadRequestException(`无效的钱包地址格式: ${address}`);
    }

    return WalletUtil.normalizeAddress(address);
  }

  /**
   * 检查钱包是否在系统中有活动记录
   */
  async walletExists(address: string): Promise<boolean> {
    try {
      const normalizedAddress = this.validateAndNormalize(address);

      const [classificationCount, achievementCount, scoreCount, nftCount] =
        await Promise.all([
          this.prisma.prismaClient.classification.count({
            where: { walletAddress: normalizedAddress },
          }),
          this.prisma.prismaClient.walletAchievement.count({
            where: { walletAddress: normalizedAddress },
          }),
          this.prisma.prismaClient.scoreTransaction.count({
            where: { walletAddress: normalizedAddress },
          }),
          this.prisma.prismaClient.nftClaim.count({
            where: { walletAddress: normalizedAddress },
          }),
        ]);

      const hasActivity =
        classificationCount + achievementCount + scoreCount + nftCount > 0;

      this.logger.log(
        `Wallet ${WalletUtil.formatAddress(address)} exists: ${hasActivity}`,
      );
      return hasActivity;
    } catch (error) {
      this.logger.error(
        `Error checking wallet existence: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 获取钱包完整档案
   */
  async getWalletProfile(address: string): Promise<WalletProfile> {
    try {
      const normalizedAddress = this.validateAndNormalize(address);

      const [
        classificationStats,
        correctClassifications,
        scoreTotal,
        achievementCount,
        nftCount,
        firstActivity,
        lastActivity,
      ] = await Promise.all([
        // 分类统计
        this.prisma.prismaClient.classification.aggregate({
          where: { walletAddress: normalizedAddress },
          _count: { _all: true },
          _sum: { score: true },
        }),

        // 正确分类数量
        this.prisma.prismaClient.classification.count({
          where: {
            walletAddress: normalizedAddress,
            isCorrect: true,
          },
        }),

        // 积分总计
        this.prisma.prismaClient.scoreTransaction.aggregate({
          where: {
            walletAddress: normalizedAddress,
            isValid: true,
          },
          _sum: { amount: true },
        }),

        // 已完成成就数量
        this.prisma.prismaClient.walletAchievement.count({
          where: {
            walletAddress: normalizedAddress,
            isCompleted: true,
          },
        }),

        // NFT数量
        this.prisma.prismaClient.nftClaim.count({
          where: {
            walletAddress: normalizedAddress,
            status: 'CONFIRMED',
          },
        }),

        // 第一次活动时间
        this.prisma.prismaClient.classification.findFirst({
          where: { walletAddress: normalizedAddress },
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        }),

        // 最后活动时间
        this.prisma.prismaClient.classification.findFirst({
          where: { walletAddress: normalizedAddress },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);

      const totalClassifications = classificationStats._count._all || 0;
      const accuracy =
        totalClassifications > 0
          ? Math.round((correctClassifications / totalClassifications) * 100)
          : 0;

      const profile: WalletProfile = {
        walletAddress: normalizedAddress,
        totalScore: scoreTotal._sum.amount || 0,
        totalClassifications,
        completedAchievements: achievementCount,
        ownedNfts: nftCount,
        accuracy,
        firstActivityAt: firstActivity?.createdAt || null,
        lastActivityAt: lastActivity?.createdAt || null,
        formattedAddress: WalletUtil.formatAddress(normalizedAddress),
      };

      this.logger.log(
        `Retrieved profile for wallet ${profile.formattedAddress}`,
      );
      return profile;
    } catch (error) {
      this.logger.error(
        `Error getting wallet profile: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 获取钱包最近活动
   */
  async getWalletRecentActivity(
    address: string,
    limit = 10,
  ): Promise<WalletActivity> {
    try {
      const normalizedAddress = this.validateAndNormalize(address);

      const [recentClassifications, recentScores, recentAchievements] =
        await Promise.all([
          // 最近分类
          this.prisma.prismaClient.classification.findMany({
            where: { walletAddress: normalizedAddress },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
              id: true,
              expectedCategory: true,
              isCorrect: true,
              score: true,
              createdAt: true,
            },
          }),

          // 最近积分变动
          this.prisma.prismaClient.scoreTransaction.findMany({
            where: { walletAddress: normalizedAddress },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
              id: true,
              amount: true,
              type: true,
              description: true,
              createdAt: true,
            },
          }),

          // 最近完成的成就
          this.prisma.prismaClient.walletAchievement.findMany({
            where: {
              walletAddress: normalizedAddress,
              isCompleted: true,
            },
            orderBy: { completedAt: 'desc' },
            take: limit,
            include: {
              achievement: {
                select: {
                  name: true,
                  description: true,
                  scoreReward: true,
                },
              },
            },
          }),
        ]);

      this.logger.log(
        `Retrieved recent activity for wallet ${WalletUtil.formatAddress(address)}`,
      );

      return {
        recentClassifications,
        recentScores,
        recentAchievements,
      };
    } catch (error) {
      this.logger.error(
        `Error getting wallet activity: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 获取钱包详细统计
   */
  async getWalletStats(address: string): Promise<WalletStats> {
    try {
      const normalizedAddress = this.validateAndNormalize(address);

      const [
        allTransactions,
        classificationStats,
        correctClassifications,
        profile,
      ] = await Promise.all([
        // 所有积分交易
        this.prisma.prismaClient.scoreTransaction.findMany({
          where: {
            walletAddress: normalizedAddress,
            isValid: true,
          },
          select: {
            amount: true,
            createdAt: true,
          },
        }),

        // 分类统计
        this.prisma.prismaClient.classification.aggregate({
          where: { walletAddress: normalizedAddress },
          _count: { _all: true },
        }),

        // 正确分类数量
        this.prisma.prismaClient.classification.count({
          where: {
            walletAddress: normalizedAddress,
            isCorrect: true,
          },
        }),

        // 用户档案
        this.getWalletProfile(normalizedAddress),
      ]);

      // 计算统计数据
      const scoreEarned = allTransactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      const scoreSpent = allTransactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const netScore = scoreEarned - scoreSpent;

      // 计算活跃天数
      const uniqueDays = new Set(
        allTransactions.map((t) => t.createdAt.toDateString()),
      ).size;

      // 计算日均积分
      const daysSinceFirstActivity = profile.firstActivityAt
        ? Math.max(
            1,
            Math.ceil(
              (Date.now() - profile.firstActivityAt.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          )
        : 1;

      const averageScorePerDay = Math.round(
        scoreEarned / daysSinceFirstActivity,
      );

      // 分类准确率
      const totalClassifications = classificationStats._count._all || 0;
      const classificationAccuracy =
        totalClassifications > 0
          ? Math.round((correctClassifications / totalClassifications) * 100)
          : 0;

      const stats: WalletStats = {
        totalTransactions: allTransactions.length,
        scoreEarned,
        scoreSpent,
        netScore,
        averageScorePerDay,
        classificationAccuracy,
        activeDays: uniqueDays,
      };

      this.logger.log(
        `Retrieved stats for wallet ${WalletUtil.formatAddress(address)}`,
      );
      return stats;
    } catch (error) {
      this.logger.error(
        `Error getting wallet stats: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 检查钱包权限
   */
  async checkWalletPermission(
    address: string,
    operation: string,
  ): Promise<boolean> {
    try {
      const normalizedAddress = this.validateAndNormalize(address);

      switch (operation) {
        case 'classify':
          // 检查是否达到每日分类限制
          return this.checkDailyClassificationLimit(normalizedAddress);

        case 'claim_achievement':
          // 所有钱包都可以领取成就
          return true;

        case 'claim_nft':
          // 检查是否有足够积分领取NFT
          return this.checkNftClaimEligibility(normalizedAddress);

        case 'admin':
          // 管理员权限检查
          return this.checkAdminPermission(normalizedAddress);

        default:
          this.logger.warn(`Unknown operation: ${operation}`);
          return false;
      }
    } catch (error) {
      this.logger.error(
        `Error checking wallet permission: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * 检查每日分类限制
   */
  private async checkDailyClassificationLimit(
    address: string,
  ): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayClassifications =
      await this.prisma.prismaClient.classification.count({
        where: {
          walletAddress: address,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

    const dailyLimit = 50; // 每日最多50次分类
    return todayClassifications < dailyLimit;
  }

  /**
   * 检查NFT领取资格
   */
  private async checkNftClaimEligibility(address: string): Promise<boolean> {
    const profile = await this.getWalletProfile(address);

    // 需要至少1000积分和10次分类才能领取NFT
    return profile.totalScore >= 1000 && profile.totalClassifications >= 10;
  }

  /**
   * 检查管理员权限
   */
  private checkAdminPermission(address: string) {
    // 这里可以从数据库或配置文件中读取管理员列表
    const adminWallets = [
      '0x742d35cc647c5e4b3f6b50b3e1f0b7e8b8d0f6f4',
      '0x1234567890abcdef1234567890abcdef12345678', // demo 管理员
    ];

    return adminWallets.includes(address);
  }
}
