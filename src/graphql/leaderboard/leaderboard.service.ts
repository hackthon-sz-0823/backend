import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { WalletService } from '../../shared/wallet/wallet.service';
import { GetLeaderboardInput } from './dto/leaderboard.input';
import {
  LeaderboardResponse,
  LeaderboardEntry,
  UserRanking,
} from './entities/leaderboard.entity';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async getLeaderboard(
    input: GetLeaderboardInput,
  ): Promise<LeaderboardResponse> {
    try {
      const { limit = 10, offset = 0 } = input;

      // 使用 groupBy 聚合积分数据
      const scoreGroups =
        await this.prisma.prismaClient.scoreTransaction.groupBy({
          by: ['walletAddress'],
          where: {
            isValid: true,
          },
          _sum: { amount: true },
          _max: { createdAt: true },
          orderBy: { _sum: { amount: 'desc' } },
          take: limit,
          skip: offset,
        });

      // 获取总用户数
      const totalUsers =
        await this.prisma.prismaClient.scoreTransaction.groupBy({
          by: ['walletAddress'],
          where: {
            isValid: true,
          },
        });

      const entries: LeaderboardEntry[] = scoreGroups.map((group, index) => ({
        rank: offset + index + 1,
        walletAddress: group.walletAddress,
        score: group._sum.amount || 0,
        lastUpdated: group._max.createdAt || new Date(),
      }));

      return {
        entries,
        total: totalUsers.length,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error getting leaderboard: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getUserRanking(walletAddress: string): Promise<UserRanking> {
    try {
      // 标准化钱包地址
      const normalizedAddress = this.walletService.validateAndNormalize(walletAddress);
      
      // 获取用户总积分
      const userScore =
        await this.prisma.prismaClient.scoreTransaction.aggregate({
          where: {
            walletAddress: normalizedAddress,
            isValid: true,
          },
          _sum: { amount: true },
        });

      const totalScore = userScore._sum.amount || 0;

      if (totalScore <= 0) {
        return {
          walletAddress: normalizedAddress,
          score: 0,
          rank: undefined,
          timestamp: new Date(),
        };
      }

      // 获取所有用户积分并排序
      const allUserScores =
        await this.prisma.prismaClient.scoreTransaction.groupBy({
          by: ['walletAddress'],
          where: {
            isValid: true,
          },
          _sum: { amount: true },
          orderBy: { _sum: { amount: 'desc' } },
        });

      // 找到用户排名
      const rank =
        allUserScores.findIndex(
          (group) => group.walletAddress === normalizedAddress,
        ) + 1;

      return {
        walletAddress: normalizedAddress,
        score: totalScore,
        rank: rank > 0 ? rank : undefined,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error getting user ranking: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
