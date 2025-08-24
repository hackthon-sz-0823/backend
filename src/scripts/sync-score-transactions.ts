import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncScoreTransactions() {
  try {
    console.log('开始同步ScoreTransaction记录...');
    
    // 专门处理目标用户的分类
    const targetWallet = '0x7878c4617329ad141e3834d23fcf1aa6476a6914';
    const targetWalletUpper = '0x7878C4617329AD141e3834d23FCf1AA6476A6914';
    
    // 1. 找到目标用户的所有得分分类
    const classificationsWithScore = await prisma.classification.findMany({
      where: {
        OR: [
          { walletAddress: targetWallet },
          { walletAddress: targetWalletUpper }
        ],
        score: {
          gt: 0
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`找到 ${classificationsWithScore.length} 个有得分的分类记录`);
    
    let syncCount = 0;
    
    for (const classification of classificationsWithScore) {
      // 检查是否已经有对应的ScoreTransaction (忽略大小写)
      const existingTransaction = await prisma.scoreTransaction.findFirst({
        where: {
          walletAddress: {
            equals: classification.walletAddress,
            mode: 'insensitive'
          },
          type: 'classification',
          referenceId: classification.id,
          referenceType: 'classification'
        }
      });
      
      if (!existingTransaction) {
        // 创建缺失的ScoreTransaction记录，使用标准化的钱包地址
        await prisma.scoreTransaction.create({
          data: {
            walletAddress: targetWallet, // 使用标准化的小写地址
            amount: classification.score,
            type: 'classification',
            referenceId: classification.id,
            referenceType: 'classification',
            description: `垃圾分类奖励 - ${classification.isCorrect ? '正确' : '参与'}分类`,
            isValid: true,
            createdAt: classification.createdAt, // 使用原始分类的时间
          }
        });
        
        syncCount++;
        console.log(`✅ 同步分类 ${classification.id}: ${classification.score}积分`);
      } else {
        console.log(`⏭️  分类 ${classification.id}: 已有ScoreTransaction记录`);
      }
    }
    
    console.log(`\n同步完成！共同步了 ${syncCount} 条ScoreTransaction记录`);
    
    // 2. 验证同步结果 - 查看所有ScoreTransaction记录
    
    const allTransactions = await prisma.scoreTransaction.findMany({
      where: {
        walletAddress: targetWallet
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`\n钱包 ${targetWallet} 的所有ScoreTransaction记录:`);
    allTransactions.forEach(tx => {
      console.log(`- ID:${tx.id} Amount:${tx.amount} Valid:${tx.isValid} Type:${tx.type} RefId:${tx.referenceId} Date:${tx.createdAt.toISOString()}`);
    });
    
    const totalScore = await prisma.scoreTransaction.aggregate({
      where: {
        walletAddress: targetWallet,
        isValid: true
      },
      _sum: {
        amount: true
      }
    });
    
    const totalScoreAll = await prisma.scoreTransaction.aggregate({
      where: {
        walletAddress: targetWallet
      },
      _sum: {
        amount: true
      }
    });
    
    console.log(`\n钱包总积分 (仅valid): ${totalScore._sum.amount}`);
    console.log(`钱包总积分 (全部): ${totalScoreAll._sum.amount}`);
    
  } catch (error) {
    console.error('同步失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行同步
syncScoreTransactions();