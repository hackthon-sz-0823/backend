import { Resolver, Query, Args } from '@nestjs/graphql';
import { LeaderboardService } from './leaderboard.service';
import { GetLeaderboardInput } from './dto/leaderboard.input';
import {
  LeaderboardResponse,
  UserRanking,
} from './entities/leaderboard.entity';

@Resolver()
export class LeaderboardResolver {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Query(() => LeaderboardResponse, {
    description: '获取积分排行榜',
  })
  async leaderboard(
    @Args('input', { nullable: true }) input?: GetLeaderboardInput,
  ): Promise<LeaderboardResponse> {
    console.log('🔍 GraphQL leaderboard query called with input:', input);
    const result = await this.leaderboardService.getLeaderboard(input || {});
    console.log('📊 Returning leaderboard entries:', result.entries.length);
    return result;
  }

  @Query(() => UserRanking, {
    description: '获取用户积分排名',
  })
  async userRanking(
    @Args('walletAddress') walletAddress: string,
  ): Promise<UserRanking> {
    console.log('🔍 GraphQL userRanking query called for:', walletAddress);
    const result = await this.leaderboardService.getUserRanking(walletAddress);
    console.log('📊 User ranking result:', result);
    return result;
  }
}
