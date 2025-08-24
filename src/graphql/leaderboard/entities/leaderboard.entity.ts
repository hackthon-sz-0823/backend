import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class LeaderboardEntry {
  @Field(() => Int, { description: '排名' })
  rank: number;

  @Field({ description: '钱包地址' })
  walletAddress: string;

  @Field(() => Int, { description: '积分' })
  score: number;

  @Field({ description: '最后更新时间' })
  lastUpdated: Date;
}

@ObjectType()
export class LeaderboardResponse {
  @Field(() => [LeaderboardEntry], { description: '排行榜条目' })
  entries: LeaderboardEntry[];

  @Field(() => Int, { description: '总条目数' })
  total: number;

  @Field({ description: '查询时间' })
  timestamp: Date;
}

@ObjectType()
export class UserRanking {
  @Field({ description: '用户钱包地址' })
  walletAddress: string;

  @Field(() => Int, { description: '用户积分' })
  score: number;

  @Field(() => Int, { nullable: true, description: '积分排名' })
  rank?: number;

  @Field({ description: '查询时间' })
  timestamp: Date;
}
