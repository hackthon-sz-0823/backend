import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import {
  Context,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';
import * as express from 'express';
import * as awsServerlessExpress from 'aws-serverless-express';
import { Server } from 'http';

let cachedServer: Server | null = null;

async function createNestServer(): Promise<Server> {
  if (!cachedServer) {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);

    const app = await NestFactory.create(AppModule, adapter);

    // 全局配置
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );

    app.enableCors({
      origin: true,
      credentials: true,
    });

    // Swagger配置 - 仅在开发环境
    if (process.env.NODE_ENV !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('智慧垃圾分类系统nest应用')
        .setDescription('智慧垃圾分类系统接口文档')
        .setVersion('1.0')
        .build();
      const documentFactory = () => SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, documentFactory);
    }

    await app.init();
    cachedServer = awsServerlessExpress.createServer(expressApp);
  }
  return cachedServer;
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  try {
    const server = await createNestServer();
    return awsServerlessExpress.proxy(server, event, context, 'PROMISE')
      .promise as Promise<APIGatewayProxyResult>;
  } catch (error) {
    console.error('Lambda handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }
};
