import { Module } from '@nestjs/common';
import { GraphDemoService } from './graph-demo.service';
import { GraphDemoResolver } from './graph-demo.resolver';

@Module({
  providers: [GraphDemoResolver, GraphDemoService],
  exports: [GraphDemoService], // 如果其他模块需要使用
})
export class GraphDemoModule {}
