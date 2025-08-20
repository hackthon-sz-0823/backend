import { Prisma } from '@prisma/client';
import { WasteCategoryEnum } from './dto/classification.dto';

export type ClassificationRecord = Prisma.ClassificationGetPayload<object>;

export type WalletAchievementWithAchievement =
  Prisma.WalletAchievementGetPayload<{
    include: { achievement: true };
  }>;

// Mastra工作流相关类型 - 外部API类型定义
export interface MastraWorkflowInput {
  imageUrl: string;
  expectedCategory: string;
  userLocation: string;
}

export interface MastraAnalysisData {
  detectedCategory: string;
  confidence: number;
  description: string;
  characteristics: string[];
  materialType: string;
  disposalInstructions: string;
}

export interface MastraWorkflowResponse {
  score: number;
  match: boolean;
  reasoning: string;
  suggestions: string[];
  improvementTips: string[];
  detailedAnalysis: string;
  learningPoints: string[];
  analysisData: MastraAnalysisData;
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
