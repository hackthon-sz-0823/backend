import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class ProductStatistics {
  @Field(() => Int, { nullable: false }) // 明确标记为不可空
  totalProducts: number;

  @Field(() => Int, { nullable: false }) // 明确标记为不可空
  inStockCount: number;

  @Field(() => [String], { nullable: false }) // 明确标记为不可空
  categories: string[];
}
