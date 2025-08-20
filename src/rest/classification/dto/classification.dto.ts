import {
  IsString,
  IsUrl,
  IsOptional,
  IsEthereumAddress,
  IsEnum,
  MaxLength,
  IsNotEmpty,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum WasteCategoryEnum {
  RECYCLABLE = 'recyclable', // 可回收垃圾
  HAZARDOUS = 'hazardous', // 有害垃圾
  KITCHEN = 'kitchen', // 厨余垃圾
  OTHER = 'other', // 其他垃圾
}

export class CreateClassificationDto {
  @ApiProperty({
    description: '垃圾图片URL',
    example: 'https://example.com/waste-image.jpg',
  })
  @IsUrl({}, { message: '请提供有效的图片URL' })
  @IsNotEmpty({ message: '图片URL不能为空' })
  readonly imageUrl: string;

  @ApiProperty({
    description: '用户期望的垃圾分类',
    enum: WasteCategoryEnum,
    example: WasteCategoryEnum.RECYCLABLE,
  })
  @IsEnum(WasteCategoryEnum, { message: '请选择有效的垃圾分类' })
  readonly expectedCategory: WasteCategoryEnum;

  @ApiProperty({
    description: '用户钱包地址',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsEthereumAddress({ message: '请提供有效的以太坊钱包地址' })
  readonly walletAddress: string;

  @ApiPropertyOptional({
    description: '用户位置信息',
    example: '北京市朝阳区',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '位置信息不能超过100个字符' })
  readonly userLocation?: string;

  @ApiPropertyOptional({
    description: '设备信息',
    example: 'iPhone 14 Pro',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '设备信息不能超过200个字符' })
  readonly deviceInfo?: string;
}

export class ClassificationQueryDto {
  @ApiProperty({
    description: '钱包地址',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsEthereumAddress({ message: '请提供有效的以太坊钱包地址' })
  readonly walletAddress: string;

  @ApiPropertyOptional({
    description: '页码',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码必须大于0' })
  readonly page?: number = 1;

  @ApiPropertyOptional({
    description: '每页数量',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量必须大于0' })
  @Max(100, { message: '每页数量不能超过100' })
  readonly limit?: number = 10;
}

export class ClassificationStatsDto {
  @ApiProperty({
    description: '钱包地址',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsEthereumAddress({ message: '请提供有效的以太坊钱包地址' })
  readonly walletAddress: string;
}

// 响应DTO接口
export interface ClassificationResponseDto {
  readonly id: number;
  readonly imageUrl: string;
  readonly expectedCategory: string;
  readonly aiDetectedCategory: string;
  readonly isCorrect: boolean;
  readonly score: number;
  readonly confidence: number;
  readonly aiDescription: string;
  readonly characteristics: string[];
  readonly materialType: string;
  readonly disposalInstructions: string;
  readonly detailedAnalysis: string;
  readonly learningPoints: string[];
  readonly suggestions: string[];
  readonly improvementTips: string[];
  readonly walletAddress: string;
  readonly userLocation?: string;
  readonly deviceInfo?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// 分类分布统计接口
export interface CategoryStatsItem {
  readonly total: number;
  readonly correct: number;
  readonly accuracy: number;
}

export interface CategoryBreakdownDto {
  readonly [WasteCategoryEnum.RECYCLABLE]: CategoryStatsItem;
  readonly [WasteCategoryEnum.HAZARDOUS]: CategoryStatsItem;
  readonly [WasteCategoryEnum.KITCHEN]: CategoryStatsItem;
  readonly [WasteCategoryEnum.OTHER]: CategoryStatsItem;
}

// 可获得成就接口
export interface AvailableAchievementDto {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly progress: number;
  readonly target: number;
}

// 成就信息接口
export interface AchievementsDto {
  readonly canEarn: AvailableAchievementDto[];
}

// 分页历史记录响应接口
export interface ClassificationHistoryResponseDto {
  readonly data: ClassificationResponseDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

// 统计数据响应接口
export interface ClassificationStatsResponseDto {
  readonly totalClassifications: number;
  readonly correctClassifications: number;
  readonly accuracyRate: number;
  readonly totalScore: number;
  readonly averageScore: number;
  readonly categoryBreakdown: CategoryBreakdownDto;
  readonly recentClassifications: ClassificationResponseDto[];
  readonly achievements: AchievementsDto;
}

// 垃圾分类标准接口
export interface WasteCategoryInfoDto {
  readonly value: WasteCategoryEnum;
  readonly label: string;
  readonly description: string;
  readonly examples: string[];
  readonly color: string;
}

export interface CategoriesResponseDto {
  readonly categories: WasteCategoryInfoDto[];
}

// 健康检查响应接口
export interface HealthCheckResponseDto {
  readonly status: string;
  readonly timestamp: string;
  readonly uptime: number;
  readonly mastraStatus: string;
  readonly version: string;
}
