import { Module } from '@nestjs/common';
import { LeaderboardResolver } from './leaderboard.resolver';
import { LeaderboardService } from './leaderboard.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [LeaderboardResolver, LeaderboardService],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}