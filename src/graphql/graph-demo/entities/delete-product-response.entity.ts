import { ObjectType, Field } from '@nestjs/graphql';
import { Product } from './product.entity';

@ObjectType()
export class DeleteProductResponse {
  @Field()
  message: string;

  @Field(() => Product)
  deletedProduct: Product;
}
