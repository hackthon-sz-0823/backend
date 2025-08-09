import { InputType, Field, Float } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';

@InputType()
export class CreateProductInput {
  @Field()
  @IsNotEmpty({ message: '产品名称不能为空' })
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => Float)
  @IsNumber({}, { message: '价格必须是数字' })
  @Min(0, { message: '价格不能为负数' })
  price: number;

  @Field()
  @IsNotEmpty({ message: '分类不能为空' })
  category: string;

  @Field({ defaultValue: true })
  @IsBoolean({ message: '库存状态必须是布尔值' })
  inStock: boolean;
}
