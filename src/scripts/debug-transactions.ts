import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugTransactions() {
  try {
    const targetWallet = '0x7878c4617329ad141e3834d23fcf1aa6476a6914';
    const targetWalletUpper = '0x7878C4617329AD141e3834d23FCf1AA6476A6914';
    
    console.log('=== 调试分类和交易记录 ===\n');
    
    // 1. 获取该用户所有得分的分类
    const classifications = await prisma.classification.findMany({
      where: {
        OR: [
          { walletAddress: targetWallet },
          { walletAddress: targetWalletUpper }
        ],
        score: { gt: 0 }
      },
      orderBy: { id: 'asc' }
    });
    
    console.log(`用户得分分类记录 (${classifications.length}条):`);
    
    for (const cls of classifications) {
      console.log(`分类 ${cls.id}: ${cls.score}积分, 钱包: ${cls.walletAddress}`);
      
      // 检查对应的ScoreTransaction
      const transactions = await prisma.scoreTransaction.findMany({
        where: {
          type: 'classification',
          referenceId: cls.id
        }
      });
      
      if (transactions.length === 0) {
        console.log(`  ❌ 缺少ScoreTransaction记录`);
        
        // 直接创建缺失的记录
        await prisma.scoreTransaction.create({
          data: {
            walletAddress: targetWallet, // 统一使用小写地址
            amount: cls.score,
            type: 'classification',
            referenceId: cls.id,
            referenceType: 'classification',
            description: `垃圾分类奖励 - ${cls.isCorrect ? '正确' : '参与'}分类`,
            isValid: true,
            createdAt: cls.createdAt,
          }
        });
        
        console.log(`  ✅ 已创建ScoreTransaction记录`);
      } else {
        console.log(`  ✓ 已有${transactions.length}条ScoreTransaction记录`);
        transactions.forEach(tx => {
          console.log(`    - ID:${tx.id} 钱包:${tx.walletAddress} 金额:${tx.amount}`);
        });
      }
    }
    
    // 2. 重新计算总积分
    const totalScore = await prisma.scoreTransaction.aggregate({
      where: {
        walletAddress: targetWallet,
        isValid: true
      },
      _sum: { amount: true }
    });
    
    console.log(`\n✅ 最终钱包总积分: ${totalScore._sum.amount}`);
    
  } catch (error) {
    console.error('调试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTransactions();