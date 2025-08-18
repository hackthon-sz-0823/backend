import { Module } from '@nestjs/common';
import { NftService } from './nft.service';
import { NftController } from './nft.controller';
import { SharedModule } from '@src/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [NftController],
  providers: [NftService],
})
export class NftModule {}
