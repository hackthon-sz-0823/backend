// src/rest/classification/classification.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ClassificationService } from './classification.service';
import {
  CreateClassificationDto,
  ClassificationQueryDto,
  ClassificationStatsDto,
  WasteCategoryEnum,
} from './dto/classification.dto';
import { ApiResponse as EnhancedApiResponse } from '@src/common/decorators/enhanced-api-response.decorator';

@ApiTags('垃圾分类')
@Controller('classification')
@EnhancedApiResponse()
export class ClassificationController {
  constructor(private readonly classificationService: ClassificationService) {}

  /**
   * 提交垃圾分类
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '提交垃圾分类',
    description:
      '用户上传垃圾图片，选择预期分类，系统调用AI进行分析评分并返回结果',
  })
  @ApiResponse({
    status: 200,
    description: '分类成功，返回详细分析结果',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        imageUrl: { type: 'string', example: 'https://example.com/waste.jpg' },
        expectedCategory: { type: 'string', example: 'recyclable' },
        aiDetectedCategory: { type: 'string', example: 'recyclable' },
        isCorrect: { type: 'boolean', example: true },
        score: { type: 'number', example: 15 },
        confidence: { type: 'number', example: 0.92 },
        aiDescription: {
          type: 'string',
          example: '这是一个塑料瓶，属于可回收垃圾',
        },
        characteristics: {
          type: 'array',
          items: { type: 'string' },
          example: ['透明塑料材质', 'PET材质标识', '完整的瓶身'],
        },
        materialType: { type: 'string', example: 'PET塑料' },
        disposalInstructions: {
          type: 'string',
          example: '清洗后投入可回收垃圾桶',
        },
        detailedAnalysis: { type: 'string', example: '详细的AI分析...' },
        learningPoints: {
          type: 'array',
          items: { type: 'string' },
          example: ['PET塑料瓶可回收利用', '投放前需清洗干净'],
        },
        suggestions: {
          type: 'array',
          items: { type: 'string' },
          example: ['继续保持正确分类习惯'],
        },
        improvementTips: {
          type: 'array',
          items: { type: 'string' },
          example: ['图片拍摄角度良好，便于识别'],
        },
        walletAddress: { type: 'string', example: '0x1234...5678' },
        userLocation: { type: 'string', example: '北京市朝阳区' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: '请提供有效的图片URL' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '服务器内部错误',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: '分类处理失败，请稍后重试' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async createClassification(@Body() dto: CreateClassificationDto) {
    return this.classificationService.createClassification(dto);
  }

  /**
   * 获取用户分类历史
   */
  @Get('history')
  @ApiOperation({
    summary: '获取用户分类历史',
    description: '分页查询用户的垃圾分类历史记录',
  })
  @ApiQuery({
    name: 'walletAddress',
    description: '钱包地址',
    example: '0x1234567890abcdef1234567890abcdef12345678',
    required: true,
  })
  @ApiQuery({
    name: 'page',
    description: '页码',
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: '每页数量',
    example: 10,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: '返回分页的分类历史记录',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              imageUrl: { type: 'string' },
              expectedCategory: { type: 'string' },
              aiDetectedCategory: { type: 'string' },
              isCorrect: { type: 'boolean' },
              score: { type: 'number' },
              confidence: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
      },
    },
  })
  async getUserClassifications(@Query() query: ClassificationQueryDto) {
    return this.classificationService.getUserClassifications(query);
  }

  /**
   * 获取用户统计数据
   */
  @Get('stats')
  @ApiOperation({
    summary: '获取用户统计数据',
    description: '查询用户的垃圾分类统计信息，包括总次数、准确率、积分等',
  })
  @ApiQuery({
    name: 'walletAddress',
    description: '钱包地址',
    example: '0x1234567890abcdef1234567890abcdef12345678',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '返回用户统计数据',
    schema: {
      type: 'object',
      properties: {
        totalClassifications: { type: 'number', example: 50 },
        correctClassifications: { type: 'number', example: 42 },
        accuracyRate: { type: 'number', example: 84 },
        totalScore: { type: 'number', example: 650 },
        averageScore: { type: 'number', example: 13 },
        categoryBreakdown: {
          type: 'object',
          properties: {
            recyclable: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 20 },
                correct: { type: 'number', example: 18 },
                accuracy: { type: 'number', example: 90 },
              },
            },
            hazardous: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 5 },
                correct: { type: 'number', example: 4 },
                accuracy: { type: 'number', example: 80 },
              },
            },
            kitchen: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 15 },
                correct: { type: 'number', example: 12 },
                accuracy: { type: 'number', example: 80 },
              },
            },
            other: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 10 },
                correct: { type: 'number', example: 8 },
                accuracy: { type: 'number', example: 80 },
              },
            },
          },
        },
        recentClassifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              expectedCategory: { type: 'string' },
              isCorrect: { type: 'boolean' },
              score: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        achievements: {
          type: 'object',
          properties: {
            canEarn: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  progress: { type: 'number' },
                  target: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  })
  async getUserStats(@Query() query: ClassificationStatsDto) {
    return this.classificationService.getUserStats(query);
  }

  /**
   * 获取垃圾分类标准说明
   */
  @Get('categories')
  @ApiOperation({
    summary: '获取垃圾分类标准',
    description: '返回支持的垃圾分类标准和说明',
  })
  @ApiResponse({
    status: 200,
    description: '返回垃圾分类标准',
    schema: {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'string', example: 'recyclable' },
              label: { type: 'string', example: '可回收垃圾' },
              description: {
                type: 'string',
                example: '可以再生循环利用的垃圾',
              },
              examples: {
                type: 'array',
                items: { type: 'string' },
                example: ['塑料瓶', '纸张', '金属罐', '玻璃瓶'],
              },
              color: { type: 'string', example: '#2563eb' },
            },
          },
        },
      },
    },
  })
  getCategories() {
    return {
      categories: [
        {
          value: WasteCategoryEnum.RECYCLABLE,
          label: '可回收垃圾',
        },
        {
          value: WasteCategoryEnum.HAZARDOUS,
          label: '有害垃圾',
        },
        {
          value: WasteCategoryEnum.KITCHEN,
          label: '厨余垃圾',
        },
        {
          value: WasteCategoryEnum.OTHER,
          label: '其他垃圾',
        },
      ],
    };
  }
}
