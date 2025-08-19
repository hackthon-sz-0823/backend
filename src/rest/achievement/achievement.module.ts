import { Module } from '@nestjs/common';
import { AchievementController } from './achievement.controller';
import { AchievementService } from './achievement.service';
import { SharedModule } from '@src/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [AchievementController],
  providers: [AchievementService],
  exports: [AchievementService], // 导出服务供其他模块使用
})
export class AchievementModule {}
