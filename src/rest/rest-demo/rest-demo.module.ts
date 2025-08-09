import { Module } from '@nestjs/common';
import { RestDemoService } from './rest-demo.service';
import { RestDemoController } from './rest-demo.controller';
import { RestCommonModule } from '@src/common/rest.common.module';
import { PrismaModule } from '@src/shared/prisma/prisma.module';

@Module({
  controllers: [RestDemoController],
  providers: [RestDemoService],
  exports: [RestDemoService],
  imports: [RestCommonModule, PrismaModule],
})
export class RestDemoModule {}
