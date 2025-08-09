import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class Product {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  price: number;

  @Field()
  category: string;

  @Field()
  inStock: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
