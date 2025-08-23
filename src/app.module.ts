import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { RestDemoModule } from './rest/rest-demo/rest-demo.module';
import { GraphDemoModule } from './graphql/graph-demo/graph-demo.module';
import { LeaderboardModule } from './graphql/leaderboard/leaderboard.module';
import { NftModule } from './rest/nft/nft.module';
import { SharedModule } from './shared/shared.module';
import { AchievementModule } from './rest/achievement/achievement.module';
import { ClassificationModule } from './rest/classification/classification.module';
import { CommonModule } from './common/common.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 设为全局模块，这样在其他模块中无需再导入
      envFilePath: '.env', // 指定环境变量文件路径
      expandVariables: true, // 支持变量扩展，例如 ${PORT}
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: true, // 启用 GraphQL Playground
      introspection: true,
      autoSchemaFile: true,
      debug: true,
    }),
    CommonModule,
    SharedModule,
    // 演示模块
    RestDemoModule,
    GraphDemoModule,
    LeaderboardModule,
    NftModule,
    AchievementModule,
    ClassificationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
