import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsDateString,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsWalletAddress } from '@src/common/validators/wallet.validator';

// 成就分类枚举
export enum AchievementCategory {
  MILESTONE = 'milestone',
  STREAK = 'streak',
  ACCURACY = 'accuracy',
  SOCIAL = 'social',
  SEASONAL = 'seasonal',
  SPECIAL = 'special',
}

// 成就等级枚举
export enum AchievementTier {
  BRONZE = 1,
  SILVER = 2,
  GOLD = 3,
  PLATINUM = 4,
  DIAMOND = 5,
}

// 钱包地址查询DTO
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

// 成就要求接口
export interface AchievementRequirements {
  min_score?: number;
  min_accuracy?: number;
  min_classifications?: number;
  consecutive_days?: number;
  specific_categories?: string[];
  time_window?: number;
}

// 创建成就DTO
export class CreateAchievementDto {
  @ApiProperty({ description: '成就代码', example: 'first_classification' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ description: '成就名称', example: '初次尝试' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: '成就描述', example: '完成第一次垃圾分类' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: '奖励积分', example: 20 })
  @IsNumber()
  @Min(0)
  scoreReward: number;

  @ApiPropertyOptional({ description: '成就图标URL' })
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiProperty({
    description: '成就分类',
    enum: AchievementCategory,
    example: AchievementCategory.MILESTONE,
  })
  @IsEnum(AchievementCategory)
  category: AchievementCategory;

  @ApiProperty({
    description: '成就等级 1-5',
    enum: AchievementTier,
    example: AchievementTier.BRONZE,
  })
  @IsEnum(AchievementTier)
  tier: AchievementTier;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: '成就要求JSON',
    example: { min_score: 100, min_classifications: 10 },
  })
  @IsOptional()
  requirements?: AchievementRequirements;

  @ApiPropertyOptional({ description: '最大领取次数，null为无限制' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxClaims?: number;

  @ApiPropertyOptional({ description: '有效期开始时间' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: '有效期结束时间' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ description: '排序权重', default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

// 更新成就DTO
export class UpdateAchievementDto {
  @ApiPropertyOptional({ description: '成就名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '成就描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '奖励积分' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  scoreReward?: number;

  @ApiPropertyOptional({ description: '成就图标URL' })
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '成就要求JSON' })
  @IsOptional()
  requirements?: AchievementRequirements;

  @ApiPropertyOptional({ description: '最大领取次数' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxClaims?: number;

  @ApiPropertyOptional({ description: '有效期开始时间' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: '有效期结束时间' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ description: '排序权重' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

// 领取成就DTO
export class ClaimAchievementDto extends WalletQueryDto {
  @ApiProperty({ description: '成就ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  achievementId: number;
}

// 更新成就进度DTO（管理员功能）
export class UpdateProgressDto extends WalletQueryDto {
  @ApiProperty({ description: '成就ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  achievementId: number;

  @ApiProperty({ description: '进度百分比 0-100', example: 50 })
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  @ApiPropertyOptional({ description: '是否强制完成', default: false })
  @IsOptional()
  @IsBoolean()
  forceComplete?: boolean;
}

// 分页查询DTO
export class PaginationDto {
  @ApiPropertyOptional({ description: '页码', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '每页数量',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: '排序字段', default: 'created_at' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @ApiPropertyOptional({
    description: '排序方向',
    default: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// 成就查询DTO
export class AchievementQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '成就分类筛选',
    enum: AchievementCategory,
  })
  @IsOptional()
  @IsEnum(AchievementCategory)
  category?: AchievementCategory;

  @ApiPropertyOptional({
    description: '成就等级筛选',
    enum: AchievementTier,
  })
  @IsOptional()
  @IsEnum(AchievementTier)
  tier?: AchievementTier;

  @ApiPropertyOptional({ description: '是否只显示启用的成就', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean = true;

  @ApiPropertyOptional({ description: '搜索关键词（名称或描述）' })
  @IsOptional()
  @IsString()
  search?: string;
}

// 用户成就查询DTO
export class UserAchievementQueryDto extends WalletQueryDto {
  @ApiPropertyOptional({
    description: '成就分类筛选',
    enum: AchievementCategory,
  })
  @IsOptional()
  @IsEnum(AchievementCategory)
  category?: AchievementCategory;

  @ApiPropertyOptional({ description: '是否只显示已完成的成就' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  completedOnly?: boolean;

  @ApiPropertyOptional({ description: '是否只显示可领取的成就' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  claimableOnly?: boolean;

  @ApiPropertyOptional({ description: '是否只显示已领取的成就' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  claimedOnly?: boolean;
}

// 批量创建成就DTO
export class BatchCreateAchievementsDto {
  @ApiProperty({
    description: '成就列表',
    type: [CreateAchievementDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAchievementDto)
  achievements: CreateAchievementDto[];
}
