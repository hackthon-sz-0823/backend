import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsWalletAddress } from '@src/common/validators/wallet.validator';

export class WalletQueryDto {
  @ApiProperty({ description: '钱包地址' })
  @IsNotEmpty()
  @IsString()
  @IsWalletAddress()
  @Transform(
    ({ value }) =>
      (typeof value === 'string' ? value.toLowerCase() : value) as string,
  )
  walletAddress: string;
}

export class ReserveNftDto extends WalletQueryDto {
  @ApiProperty({ description: 'NFT池ID' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  nftPoolId: number;
}

export class ClaimNftDto extends WalletQueryDto {
  @ApiProperty({ description: 'NFT池ID' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  nftPoolId: number;
}

export class AddNftToPoolDto {
  @ApiProperty({ description: 'NFT名称' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'NFT描述' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: '图片URL' })
  @IsNotEmpty()
  @IsString()
  imageUrl: string;

  @ApiProperty({ description: '稀有度 1-5' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rarity: number;

  @ApiProperty({ description: '需要的最低积分' })
  @IsNumber()
  @Min(0)
  requiredScore: number;

  @ApiProperty({ description: '需要的最低分类次数' })
  @IsNumber()
  @Min(0)
  requiredClassifications: number;

  @ApiPropertyOptional({ description: 'NFT类别' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'NFT自定义属性' })
  @IsOptional()
  @IsArray()
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

export class BatchAddNftDto {
  @ApiProperty({ description: 'NFT列表', type: [AddNftToPoolDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddNftToPoolDto)
  nfts: AddNftToPoolDto[];
}
