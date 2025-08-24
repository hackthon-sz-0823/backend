const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugScoreTransactions() {
  try {
    console.log('=== 查询所有积分交易记录 ===');
    
    const transactions = await prisma.scoreTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    console.log('前20条积分交易记录：');
    transactions.forEach((tx, index) => {
      console.log(`${index + 1}. [${tx.createdAt}] ${tx.walletAddress} +${tx.amount} (${tx.type}) - ${tx.description}`);
    });
    
    console.log('\n=== 按钱包地址分组统计 ===');
    const groupedScores = await prisma.scoreTransaction.groupBy({
      by: ['walletAddress'],
      where: { isValid: true },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } }
    });
    
    groupedScores.forEach((group, index) => {
      console.log(`${index + 1}. ${group.walletAddress}: ${group._sum.amount}分 (${group._count.id}笔交易)`);
    });
    
    console.log('\n=== 查询第一名用户的详细记录 ===');
    const topUser = groupedScores[0];
    if (topUser) {
      const userTransactions = await prisma.scoreTransaction.findMany({
        where: {
          walletAddress: topUser.walletAddress,
          isValid: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log(`用户 ${topUser.walletAddress} 的积分交易明细：`);
      userTransactions.forEach((tx, index) => {
        console.log(`  ${index + 1}. [${tx.createdAt}] +${tx.amount} (${tx.type}) - ${tx.description}`);
      });
    }
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugScoreTransactions();