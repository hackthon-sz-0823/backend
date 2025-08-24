import { Module } from '@nestjs/common';
import { ClassificationService } from './classification.service';
import { ClassificationController } from './classification.controller';
import { SharedModule } from '@src/shared/shared.module';
import { AchievementModule } from '@src/rest/achievement/achievement.module';

@Module({
  imports: [SharedModule, AchievementModule],
  controllers: [ClassificationController],
  providers: [ClassificationService],
})
export class ClassificationModule {}
