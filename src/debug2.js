const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function debugDatabase() {
  try {
    console.log('=== 测试数据库连接 ===');
    
    // 测试简单查询
    const result = await prisma.$queryRaw`SELECT current_timestamp as time`;
    console.log('数据库连接正常:', result);
    
    console.log('\n=== 检查表是否存在 ===');
    
    // 检查积分交易表
    try {
      const count = await prisma.scoreTransaction.count();
      console.log(`score_transactions 表记录数: ${count}`);
    } catch (error) {
      console.error('score_transactions 表查询失败:', error.message);
    }
    
    // 检查分类表
    try {
      const classCount = await prisma.classification.count();
      console.log(`classifications 表记录数: ${classCount}`);
    } catch (error) {
      console.error('classifications 表查询失败:', error.message);
    }
    
    // 检查成就表
    try {
      const achieveCount = await prisma.achievement.count();
      console.log(`achievements 表记录数: ${achieveCount}`);
    } catch (error) {
      console.error('achievements 表查询失败:', error.message);
    }
    
    console.log('\n=== 原始SQL查询积分交易 ===');
    const rawScores = await prisma.$queryRaw`
      SELECT wallet_address, SUM(amount) as total_score, COUNT(*) as transaction_count 
      FROM score_transactions 
      WHERE is_valid = true 
      GROUP BY wallet_address 
      ORDER BY total_score DESC
    `;
    
    console.log('原始SQL查询结果:');
    console.log(rawScores);
    
  } catch (error) {
    console.error('调试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDatabase();