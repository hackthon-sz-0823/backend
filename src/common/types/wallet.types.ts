export interface WalletAddress {
  address: string;
  isValid: boolean;
}

export interface UserSummary {
  walletAddress: string;
  summary: {
    totalClassifications: number;
    totalScore: number;
    completedAchievements: number;
    ownedNfts: number;
  };
  formattedAddress: string;
}

export interface ClassificationStats {
  totalClassifications: number;
  correctClassifications: number;
  totalScore: number;
  accuracy: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
