import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

@InputType()
export class GetLeaderboardInput {
  @Field(() => Int, { nullable: true, defaultValue: 10, description: '返回条数' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @Field(() => Int, { nullable: true, defaultValue: 0, description: '跳过条数' })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number = 0;
}