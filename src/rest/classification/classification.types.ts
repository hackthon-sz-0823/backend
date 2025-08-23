import { Prisma } from '@prisma/client';
import { WasteCategoryEnum } from './dto/classification.dto';

export type ClassificationRecord = Prisma.ClassificationGetPayload<object>;

export type WalletAchievementWithAchievement =
  Prisma.WalletAchievementGetPayload<{
    include: { achievement: true };
  }>;

// Mastra Agent 相关类型 - 简化版本
export interface MastraAgentInput {
  imageUrl: string;
  expectedCategory: string;
  userLocation: string;
}

// Agent 响应的核心数据
export interface MastraAgentResponse {
  ai_detected_category: string;
  ai_confidence: number;
  is_correct: boolean;
  score: number;
  ai_analysis: string;
  ai_response: Record<string, any>;
  processing_time_ms: number;
}

// 业务逻辑相关类型
export interface CategoryStatsItem {
  total: number;
  correct: number;
  accuracy: number;
}

export interface CategoryBreakdown {
  [WasteCategoryEnum.RECYCLABLE]: CategoryStatsItem;
  [WasteCategoryEnum.HAZARDOUS]: CategoryStatsItem;
  [WasteCategoryEnum.KITCHEN]: CategoryStatsItem;
  [WasteCategoryEnum.OTHER]: CategoryStatsItem;
}

export interface AvailableAchievement {
  id: number;
  name: string;
  description: string;
  progress: number;
  target: number;
}
