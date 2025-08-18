// src/shared/blockchain/blockchain.service.ts - NFT枚举定义

/**
 * NFT类别枚举
 * 用于区分不同类型的NFT，影响NFT的获取条件和展示方式
 */
export enum NFTCategory {
  /**
   * 通用类别 (0)
   * - 适用于：基础NFT、测试NFT
   * - 获取难度：简单
   * - 示例：新手礼包NFT、签到奖励NFT
   */
  GENERAL = 0,

  /**
   * 成就类别 (1)
   * - 适用于：完成特定成就后获得的NFT
   * - 获取难度：中等
   * - 示例：分类达人、环保战士、准确率专家
   */
  ACHIEVEMENT = 1,

  /**
   * 特殊类别 (2)
   * - 适用于：特殊活动、节日庆典NFT
   * - 获取难度：中等-困难
   * - 示例：地球日特别版、世界环境日纪念版
   */
  SPECIAL = 2,

  /**
   * 限量类别 (3)
   * - 适用于：限时限量发行的稀有NFT
   * - 获取难度：困难
   * - 示例：创世纪NFT、周年庆典版、社区贡献者专属
   */
  LIMITED = 3,
}

/**
 * NFT稀有度枚举
 * 定义NFT的稀有程度，影响获取难度、展示效果和收藏价值
 * 数值越高稀有度越高，获取条件越严格
 */
export enum NFTRarity {
  /**
   * 普通 (0) - 对应用户输入的稀有度 1
   * - 获取条件：积分 ≥ 10，分类次数 ≥ 5
   * - 发行比例：60%
   * - 视觉效果：白色边框，无特效
   * - 示例：环保新手、分类入门者
   */
  COMMON = 0,

  /**
   * 罕见 (1) - 对应用户输入的稀有度 2
   * - 获取条件：积分 ≥ 50，分类次数 ≥ 25
   * - 发行比例：25%
   * - 视觉效果：绿色边框，轻微发光
   * - 示例：环保达人、分类能手
   */
  UNCOMMON = 1,

  /**
   * 稀有 (2) - 对应用户输入的稀有度 3
   * - 获取条件：积分 ≥ 100，分类次数 ≥ 50，准确率 ≥ 85%
   * - 发行比例：10%
   * - 视觉效果：蓝色边框，明显光效
   * - 示例：环保战士、分类专家
   */
  RARE = 2,

  /**
   * 史诗 (3) - 对应用户输入的稀有度 4
   * - 获取条件：积分 ≥ 500，分类次数 ≥ 200，准确率 ≥ 95%
   * - 发行比例：4%
   * - 视觉效果：紫色边框，炫酷动画
   * - 示例：环保大师、分类传说
   */
  EPIC = 3,

  /**
   * 传奇 (4) - 对应用户输入的稀有度 5
   * - 获取条件：积分 ≥ 1000，分类次数 ≥ 500，准确率 ≥ 99%
   * - 发行比例：1%
   * - 视觉效果：金色边框，华丽特效，粒子动画
   * - 示例：环保传奇、分类之神、生态守护者
   */
  LEGENDARY = 4,
}

/**
 * 稀有度显示名称映射
 * 用于前端展示和用户界面
 */
export const RARITY_NAMES: { [key in NFTRarity]: string } = {
  [NFTRarity.COMMON]: '普通',
  [NFTRarity.UNCOMMON]: '罕见',
  [NFTRarity.RARE]: '稀有',
  [NFTRarity.EPIC]: '史诗',
  [NFTRarity.LEGENDARY]: '传奇',
};

/**
 * 类别显示名称映射
 * 用于前端展示和用户界面
 */
export const CATEGORY_NAMES: { [key in NFTCategory]: string } = {
  [NFTCategory.GENERAL]: '通用',
  [NFTCategory.ACHIEVEMENT]: '成就',
  [NFTCategory.SPECIAL]: '特殊',
  [NFTCategory.LIMITED]: '限量',
};

/**
 * 稀有度颜色映射
 * 用于前端UI显示不同稀有度的颜色主题
 */
export const RARITY_COLORS: {
  [key in NFTRarity]: { border: string; glow: string; text: string };
} = {
  [NFTRarity.COMMON]: {
    border: '#9CA3AF', // 灰色
    glow: '#F3F4F6', // 浅灰色光晕
    text: '#6B7280', // 灰色文字
  },
  [NFTRarity.UNCOMMON]: {
    border: '#10B981', // 绿色
    glow: '#D1FAE5', // 浅绿色光晕
    text: '#059669', // 绿色文字
  },
  [NFTRarity.RARE]: {
    border: '#3B82F6', // 蓝色
    glow: '#DBEAFE', // 浅蓝色光晕
    text: '#2563EB', // 蓝色文字
  },
  [NFTRarity.EPIC]: {
    border: '#8B5CF6', // 紫色
    glow: '#EDE9FE', // 浅紫色光晕
    text: '#7C3AED', // 紫色文字
  },
  [NFTRarity.LEGENDARY]: {
    border: '#F59E0B', // 金色
    glow: '#FEF3C7', // 浅金色光晕
    text: '#D97706', // 金色文字
  },
};

/**
 * 获取稀有度的最低要求
 * @param rarity 稀有度枚举值
 * @returns 包含积分、分类次数、准确率要求的对象
 */
export function getRarityRequirements(rarity: NFTRarity): {
  minScore: number;
  minClassifications: number;
  minAccuracy: number;
} {
  const requirements = {
    [NFTRarity.COMMON]: { minScore: 10, minClassifications: 5, minAccuracy: 0 },
    [NFTRarity.UNCOMMON]: {
      minScore: 50,
      minClassifications: 25,
      minAccuracy: 75,
    },
    [NFTRarity.RARE]: {
      minScore: 100,
      minClassifications: 50,
      minAccuracy: 85,
    },
    [NFTRarity.EPIC]: {
      minScore: 500,
      minClassifications: 200,
      minAccuracy: 95,
    },
    [NFTRarity.LEGENDARY]: {
      minScore: 1000,
      minClassifications: 500,
      minAccuracy: 99,
    },
  };

  return requirements[rarity];
}
