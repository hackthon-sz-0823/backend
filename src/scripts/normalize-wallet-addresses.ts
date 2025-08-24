import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function normalizeWalletAddresses() {
  try {
    console.log('开始统一钱包地址格式...');
    
    const targetWallet = '0x7878c4617329ad141e3834d23fcf1aa6476a6914'; // 标准小写格式
    const targetWalletUpper = '0x7878C4617329AD141e3834d23FCf1AA6476A6914';
    
    // 1. 更新ScoreTransaction表中的大写地址为小写
    const updatedScoreTransactions = await prisma.scoreTransaction.updateMany({
      where: {
        walletAddress: targetWalletUpper
      },
      data: {
        walletAddress: targetWallet
      }
    });
    
    console.log(`✅ 更新了 ${updatedScoreTransactions.count} 条ScoreTransaction记录的钱包地址`);
    
    // 2. 更新Classification表中的大写地址为小写
    const updatedClassifications = await prisma.classification.updateMany({
      where: {
        walletAddress: targetWalletUpper
      },
      data: {
        walletAddress: targetWallet
      }
    });
    
    console.log(`✅ 更新了 ${updatedClassifications.count} 条Classification记录的钱包地址`);
    
    // 3. 更新WalletAchievement表中的大写地址为小写
    const updatedAchievements = await prisma.walletAchievement.updateMany({
      where: {
        walletAddress: targetWalletUpper
      },
      data: {
        walletAddress: targetWallet
      }
    });
    
    console.log(`✅ 更新了 ${updatedAchievements.count} 条WalletAchievement记录的钱包地址`);
    
    // 4. 验证总积分
    const totalScore = await prisma.scoreTransaction.aggregate({
      where: {
        walletAddress: targetWallet,
        isValid: true
      },
      _sum: { amount: true }
    });
    
    console.log(`\n🎉 统一完成！钱包总积分: ${totalScore._sum.amount}`);
    
  } catch (error) {
    console.error('统一失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

normalizeWalletAddresses();