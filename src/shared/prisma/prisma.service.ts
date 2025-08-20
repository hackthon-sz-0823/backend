// src/prisma.service.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  private readonly client: PrismaClient;
  constructor() {
    // 主库实例（用于写操作）
    this.client = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }

  // 获取读库实例
  get prismaClient() {
    return this.client;
  }

  // 初始化连接
  async onModuleInit() {
    try {
      this.logger.log('Initializing database connections...');
      // 初次连接前激活数据库
      this.logger.log('Activating database connection...');
      // 🔥 简单激活：唤醒 AWS RDS
      await this.client.$queryRaw`SELECT current_timestamp as wake_up_time`;
      this.logger.log('Database activated successfully');
      await this.client.$connect();
      this.logger.log('Database connections initialized successfully 🚀');
    } catch (error) {
      this.logger.error('Error while connecting to databases', error);
      throw error;
    }
  }

  // 关闭连接
  async onModuleDestroy() {
    try {
      await this.client.$connect();
      this.logger.log('Successfully disconnected from databases 🚀');
    } catch (error) {
      this.logger.error('Error while disconnecting from databases', error);
      throw error;
    }
  }
}
