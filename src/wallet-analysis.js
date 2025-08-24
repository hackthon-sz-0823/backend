const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function analyzeWallet(walletAddress) {
  try {
    const normalizedAddress = walletAddress.toLowerCase();
    
    console.log(`=== 钱包地址分析: ${walletAddress} ===`);
    console.log(`标准化地址: ${normalizedAddress}\n`);
    
    // 1. 查询所有积分交易
    console.log('1. 积分交易明细:');
    const scoreTransactions = await prisma.scoreTransaction.findMany({
      where: {
        walletAddress: normalizedAddress,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (scoreTransactions.length === 0) {
      console.log('  ❌ 没有找到积分交易记录');
    } else {
      console.log(`  ✅ 找到 ${scoreTransactions.length} 条积分交易:`);
      scoreTransactions.forEach((tx, index) => {
        console.log(`    ${index + 1}. [${tx.createdAt}] ${tx.amount > 0 ? '+' : ''}${tx.amount}分`);
        console.log(`       类型: ${tx.type} | 有效: ${tx.isValid} | 描述: ${tx.description}`);
        if (tx.referenceType && tx.referenceId) {
          console.log(`       关联: ${tx.referenceType}#${tx.referenceId}`);
        }
        console.log('');
      });
    }
    
    // 2. 计算总积分
    const totalScore = await prisma.scoreTransaction.aggregate({
      where: {
        walletAddress: normalizedAddress,
        isValid: true,
      },
      _sum: { amount: true },
      _count: { id: true }
    });
    
    console.log('2. 积分统计:');
    console.log(`   总积分: ${totalScore._sum.amount || 0}分`);
    console.log(`   交易数: ${totalScore._count}笔\n`);
    
    // 3. 查询分类记录
    console.log('3. 分类记录:');
    const classifications = await prisma.classification.findMany({
      where: {
        walletAddress: normalizedAddress,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (classifications.length === 0) {
      console.log('  ❌ 没有找到分类记录');
    } else {
      console.log(`  ✅ 找到 ${classifications.length} 条分类记录:`);
      classifications.forEach((cls, index) => {
        console.log(`    ${index + 1}. [${cls.createdAt}] ${cls.expectedCategory} ${cls.isCorrect ? '✅' : '❌'} +${cls.score}分`);
      });
    }
    
    console.log('');
    
    // 4. 查询成就记录
    console.log('4. 成就记录:');
    const walletAchievements = await prisma.walletAchievement.findMany({
      where: {
        walletAddress: normalizedAddress,
      },
      include: {
        achievement: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (walletAchievements.length === 0) {
      console.log('  ❌ 没有找到成就记录');
    } else {
      console.log(`  ✅ 找到 ${walletAchievements.length} 条成就记录:`);
      walletAchievements.forEach((wa, index) => {
        const status = wa.isClaimed ? '🏆已领取' : (wa.isCompleted ? '✅已完成' : '🔄进行中');
        console.log(`    ${index + 1}. [${wa.createdAt}] ${wa.achievement.name} - ${wa.achievement.scoreReward}分 ${status}`);
        console.log(`       进度: ${wa.progress}% | 完成时间: ${wa.completedAt || 'N/A'} | 领取时间: ${wa.claimedAt || 'N/A'}`);
      });
    }
    
    console.log('');
    
    // 5. 交叉验证 - 检查积分交易与成就的对应关系
    console.log('5. 交叉验证:');
    const achievementTransactions = scoreTransactions.filter(tx => tx.type === 'achievement');
    const claimedAchievements = walletAchievements.filter(wa => wa.isClaimed);
    
    console.log(`   成就类型积分交易: ${achievementTransactions.length}笔`);
    console.log(`   已领取成就数量: ${claimedAchievements.length}个`);
    
    if (achievementTransactions.length !== claimedAchievements.length) {
      console.log('   ⚠️  数据不一致！成就积分交易数与已领取成就数不匹配');
      
      // 详细分析不匹配的原因
      console.log('\n   详细对比:');
      console.log('   成就积分交易:');
      achievementTransactions.forEach((tx, index) => {
        console.log(`     ${index + 1}. ${tx.description} +${tx.amount}分 [${tx.createdAt}]`);
      });
      
      console.log('   已领取成就:');
      claimedAchievements.forEach((wa, index) => {
        console.log(`     ${index + 1}. ${wa.achievement.name} +${wa.achievement.scoreReward}分 [${wa.claimedAt}]`);
      });
    } else {
      console.log('   ✅ 数据一致');
    }
    
    // 6. 查询排行榜中的数据
    console.log('\n6. 排行榜验证:');
    const leaderboardData = await prisma.scoreTransaction.groupBy({
      by: ['walletAddress'],
      where: {
        walletAddress: normalizedAddress,
        isValid: true,
      },
      _sum: { amount: true },
      _max: { createdAt: true }
    });
    
    if (leaderboardData.length > 0) {
      console.log(`   排行榜积分: ${leaderboardData[0]._sum.amount}分`);
      console.log(`   最后更新: ${leaderboardData[0]._max.createdAt}`);
    } else {
      console.log('   ❌ 在排行榜查询中未找到该地址');
    }
    
  } catch (error) {
    console.error('分析失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 分析指定钱包
const walletToAnalyze = process.argv[2] || '0xAC6781bd852A728943d8B7d875D1F47Ff95389d0';
analyzeWallet(walletToAnalyze);