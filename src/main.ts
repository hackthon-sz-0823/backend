import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 全局配置
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 自动转换类型
      whitelist: true, // 去除未定义的属性
    }),
  );
  app.enableCors({
    origin: true,
    credentials: true,
  });
  const config = new DocumentBuilder()
    .setTitle('智慧垃圾分类系统nest应用')
    .setDescription('智慧垃圾分类系统接口文档')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3001);
  console.log(
    `🚀 Server is running on http://localhost:${process.env.PORT ?? 3001}`,
  );
  console.log(
    `📊 GraphQL Playground: http://localhost:${process.env.PORT ?? 3001}/graphql`,
  );
}
bootstrap();
