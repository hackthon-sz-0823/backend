import {
  CreateAchievementDto,
  AchievementCategory,
  AchievementTier,
} from '../dto/achievement.dto';

/**
 * 预设成就数据
 * 按照等级和分类组织的完整成就体系
 */
export const ACHIEVEMENT_SEEDS: CreateAchievementDto[] = [
  // ==========================================
  // 新手成就（铜牌）- 引导用户入门
  // ==========================================
  {
    code: 'first_classification',
    name: '初次尝试',
    description: '完成第一次垃圾分类，迈出环保第一步！',
    scoreReward: 20,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/first_classification.jpg',
    category: AchievementCategory.MILESTONE,
    tier: AchievementTier.BRONZE,
    requirements: { min_classifications: 1 },
    sortOrder: 1,
  },
  {
    code: 'daily_newcomer',
    name: '新手签到',
    description: '连续使用应用3天，养成环保好习惯！',
    scoreReward: 30,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/daily_newcomer.jpg',
    category: AchievementCategory.STREAK,
    tier: AchievementTier.BRONZE,
    requirements: { consecutive_days: 3 },
    sortOrder: 2,
  },
  {
    code: 'score_beginner',
    name: '积分新手',
    description: '累计获得100积分，证明你的环保决心！',
    scoreReward: 50,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/score_beginner.jpg',
    category: AchievementCategory.MILESTONE,
    tier: AchievementTier.BRONZE,
    requirements: { min_score: 100 },
    sortOrder: 3,
  },
  {
    code: 'accuracy_starter',
    name: '准确起步',
    description: '在前10次分类中达到70%准确率',
    scoreReward: 40,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/accuracy_starter.jpg',
    category: AchievementCategory.ACCURACY,
    tier: AchievementTier.BRONZE,
    requirements: { min_accuracy: 70, min_classifications: 10 },
    sortOrder: 4,
  },

  // ==========================================
  // 进阶成就（银牌）- 培养用户习惯
  // ==========================================
  {
    code: 'classification_enthusiast',
    name: '分类爱好者',
    description: '完成50次垃圾分类，你已经是环保达人了！',
    scoreReward: 100,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/classification_enthusiast.jpg',
    category: AchievementCategory.MILESTONE,
    tier: AchievementTier.SILVER,
    requirements: { min_classifications: 50 },
    sortOrder: 5,
  },
  {
    code: 'accuracy_rookie',
    name: '准确新星',
    description: '在至少20次分类中达到80%准确率',
    scoreReward: 150,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/accuracy_rookie.jpg',
    category: AchievementCategory.ACCURACY,
    tier: AchievementTier.SILVER,
    requirements: { min_accuracy: 80, min_classifications: 20 },
    sortOrder: 6,
  },
  {
    code: 'weekly_warrior',
    name: '周常勇士',
    description: '连续使用应用7天，坚持就是胜利！',
    scoreReward: 80,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/weekly_warrior.jpg',
    category: AchievementCategory.STREAK,
    tier: AchievementTier.SILVER,
    requirements: { consecutive_days: 7 },
    sortOrder: 7,
  },
  {
    code: 'category_explorer',
    name: '分类探索者',
    description: '正确分类所有4种垃圾类型',
    scoreReward: 120,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/category_explorer.jpg',
    category: AchievementCategory.SPECIAL,
    tier: AchievementTier.SILVER,
    requirements: {
      specific_categories: ['可回收垃圾', '有害垃圾', '湿垃圾', '干垃圾'],
      min_classifications: 20,
    },
    sortOrder: 8,
  },

  // ==========================================
  // 高级成就（金牌）- 提升用户技能
  // ==========================================
  {
    code: 'classification_master',
    name: '分类大师',
    description: '完成500次垃圾分类，你是真正的环保专家！',
    scoreReward: 500,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/classification_master.jpg',
    category: AchievementCategory.MILESTONE,
    tier: AchievementTier.GOLD,
    requirements: { min_classifications: 500 },
    sortOrder: 9,
  },
  {
    code: 'accuracy_expert',
    name: '精准专家',
    description: '在至少100次分类中达到95%准确率',
    scoreReward: 800,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/accuracy_expert.jpg',
    category: AchievementCategory.ACCURACY,
    tier: AchievementTier.GOLD,
    requirements: { min_accuracy: 95, min_classifications: 100 },
    sortOrder: 10,
  },
  {
    code: 'score_collector',
    name: '积分收集家',
    description: '累计获得5000积分，财富自由指日可待！',
    scoreReward: 300,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/score_collector.jpg',
    category: AchievementCategory.MILESTONE,
    tier: AchievementTier.GOLD,
    requirements: { min_score: 5000 },
    sortOrder: 11,
  },
  {
    code: 'monthly_champion',
    name: '月度冠军',
    description: '连续使用应用30天，毅力超群！',
    scoreReward: 400,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/monthly_champion.jpg',
    category: AchievementCategory.STREAK,
    tier: AchievementTier.GOLD,
    requirements: { consecutive_days: 30 },
    sortOrder: 12,
  },

  // ==========================================
  // 专家成就（白金）- 挑战高级用户
  // ==========================================
  {
    code: 'classification_guru',
    name: '分类导师',
    description: '完成1000次垃圾分类，可以开班授课了！',
    scoreReward: 1000,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/classification_guru.jpg',
    category: AchievementCategory.MILESTONE,
    tier: AchievementTier.PLATINUM,
    requirements: { min_classifications: 1000 },
    sortOrder: 13,
  },
  {
    code: 'perfect_accuracy',
    name: '完美主义者',
    description: '在至少500次分类中达到99%准确率',
    scoreReward: 1500,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/perfect_accuracy.jpg',
    category: AchievementCategory.ACCURACY,
    tier: AchievementTier.PLATINUM,
    requirements: { min_accuracy: 99, min_classifications: 500 },
    sortOrder: 14,
  },
  {
    code: 'score_millionaire',
    name: '积分富翁',
    description: '累计获得10000积分，真正的积分大亨！',
    scoreReward: 800,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/score_millionaire.jpg',
    category: AchievementCategory.MILESTONE,
    tier: AchievementTier.PLATINUM,
    requirements: { min_score: 10000 },
    sortOrder: 15,
  },
  {
    code: 'rapid_classifier',
    name: '闪电分类师',
    description: '在1小时内完成20次正确分类',
    scoreReward: 600,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/rapid_classifier.jpg',
    category: AchievementCategory.SPECIAL,
    tier: AchievementTier.PLATINUM,
    requirements: {
      min_classifications: 20,
      min_accuracy: 90,
      time_window: 1, // 1小时内
    },
    sortOrder: 16,
  },

  // ==========================================
  // 传奇成就（钻石）- 顶级荣誉
  // ==========================================
  {
    code: 'eco_legend',
    name: '环保传说',
    description: '完成2000次分类且准确率99%+，环保界的传奇人物！',
    scoreReward: 2000,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/eco_legend.jpg',
    category: AchievementCategory.SPECIAL,
    tier: AchievementTier.DIAMOND,
    requirements: {
      min_classifications: 2000,
      min_accuracy: 99,
    },
    sortOrder: 17,
  },
  {
    code: 'ultimate_master',
    name: '终极大师',
    description: '完成5000次分类，您就是垃圾分类的最高权威！',
    scoreReward: 3000,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/ultimate_master.jpg',
    category: AchievementCategory.MILESTONE,
    tier: AchievementTier.DIAMOND,
    requirements: { min_classifications: 5000 },
    sortOrder: 18,
  },
  {
    code: 'loyalty_titan',
    name: '忠诚泰坦',
    description: '连续使用应用365天，一年的坚持令人敬佩！',
    scoreReward: 2500,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/loyalty_titan.jpg',
    category: AchievementCategory.STREAK,
    tier: AchievementTier.DIAMOND,
    requirements: { consecutive_days: 365 },
    sortOrder: 19,
  },

  // ==========================================
  // 季节性成就 - 限时活动
  // ==========================================
  {
    code: 'earth_day_hero',
    name: '地球日英雄',
    description: '在地球日期间完成50次分类',
    scoreReward: 300,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/earth_day_hero.jpg',
    category: AchievementCategory.SEASONAL,
    tier: AchievementTier.GOLD,
    requirements: { min_classifications: 50 },
    validFrom: '2025-04-22T00:00:00Z',
    validUntil: '2025-04-22T23:59:59Z',
    maxClaims: 1000, // 限量1000人
    sortOrder: 20,
  },
  {
    code: 'new_year_resolver',
    name: '新年决心者',
    description: '在新年第一周连续使用应用7天',
    scoreReward: 200,
    iconUrl:
      'https://ivory-personal-goat-759.mypinata.cloud/ipfs/bafybeifg2phddntgvxwh3lxdm3dqk2jsv3ulxhe5k45kje2rtaroz5quyu/new_year_resolver.jpg',
    category: AchievementCategory.SEASONAL,
    tier: AchievementTier.SILVER,
    requirements: { consecutive_days: 7 },
    validFrom: '2025-01-01T00:00:00Z',
    validUntil: '2025-01-07T23:59:59Z',
    maxClaims: 500,
    sortOrder: 21,
  },
];

/**
 * 获取按分类分组的成就数据
 */
export function getAchievementsByCategory() {
  const grouped = ACHIEVEMENT_SEEDS.reduce(
    (acc, achievement) => {
      const category = achievement.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(achievement);
      return acc;
    },
    {} as Record<AchievementCategory, CreateAchievementDto[]>,
  );

  return grouped;
}

/**
 * 获取按等级分组的成就数据
 */
export function getAchievementsByTier() {
  const grouped = ACHIEVEMENT_SEEDS.reduce(
    (acc, achievement) => {
      const tier = achievement.tier;
      if (!acc[tier]) {
        acc[tier] = [];
      }
      acc[tier].push(achievement);
      return acc;
    },
    {} as Record<AchievementTier, CreateAchievementDto[]>,
  );

  return grouped;
}

/**
 * 成就分类中文名称映射
 */
export const CATEGORY_NAMES = {
  [AchievementCategory.MILESTONE]: '里程碑',
  [AchievementCategory.STREAK]: '连击',
  [AchievementCategory.ACCURACY]: '精度',
  [AchievementCategory.SOCIAL]: '社交',
  [AchievementCategory.SEASONAL]: '季节',
  [AchievementCategory.SPECIAL]: '特殊',
};

/**
 * 成就等级中文名称映射
 */
export const TIER_NAMES = {
  [AchievementTier.BRONZE]: '铜牌',
  [AchievementTier.SILVER]: '银牌',
  [AchievementTier.GOLD]: '金牌',
  [AchievementTier.PLATINUM]: '白金',
  [AchievementTier.DIAMOND]: '钻石',
};

/**
 * 成就等级颜色映射
 */
export const TIER_COLORS = {
  [AchievementTier.BRONZE]: '#CD7F32',
  [AchievementTier.SILVER]: '#C0C0C0',
  [AchievementTier.GOLD]: '#FFD700',
  [AchievementTier.PLATINUM]: '#E5E4E2',
  [AchievementTier.DIAMOND]: '#B9F2FF',
};
