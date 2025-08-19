import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AchievementService } from './achievement.service';
import {
  CreateAchievementDto,
  UpdateAchievementDto,
  ClaimAchievementDto,
  UpdateProgressDto,
  AchievementQueryDto,
  UserAchievementQueryDto,
  BatchCreateAchievementsDto,
  WalletQueryDto,
} from './dto/achievement.dto';
import { ACHIEVEMENT_SEEDS } from './data/achievement-seeds';

@ApiTags('成就系统')
@Controller('achievement')
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  // ==========================================
  // 用户功能
  // ==========================================

  /**
   * 获取用户成就列表
   */
  @Get('my-achievements')
  @ApiOperation({ summary: '获取用户成就列表' })
  @ApiQuery({ name: 'walletAddress', description: '钱包地址' })
  @ApiQuery({ name: 'category', description: '成就分类筛选', required: false })
  @ApiQuery({
    name: 'completedOnly',
    description: '是否只显示已完成的成就',
    required: false,
  })
  @ApiQuery({
    name: 'claimableOnly',
    description: '是否只显示可领取的成就',
    required: false,
  })
  @ApiQuery({
    name: 'claimedOnly',
    description: '是否只显示已领取的成就',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: '返回用户成就列表',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          code: { type: 'string', example: 'first_classification' },
          name: { type: 'string', example: '初次尝试' },
          description: { type: 'string', example: '完成第一次垃圾分类' },
          scoreReward: { type: 'number', example: 20 },
          iconUrl: { type: 'string', example: 'https://example.com/icon.png' },
          category: { type: 'string', example: 'milestone' },
          tier: { type: 'number', example: 1 },
          progress: { type: 'number', example: 100 },
          isCompleted: { type: 'boolean', example: true },
          isClaimed: { type: 'boolean', example: false },
          canClaim: { type: 'boolean', example: true },
          completedAt: { type: 'string', format: 'date-time' },
          claimedAt: { type: 'string', format: 'date-time' },
          missingRequirements: {
            type: 'array',
            items: { type: 'string' },
            example: ['需要 100 积分，当前 80'],
          },
        },
      },
    },
  })
  async getUserAchievements(@Query() query: UserAchievementQueryDto) {
    return this.achievementService.getUserAchievements(query);
  }

  /**
   * 获取可领取的成就
   */
  @Get('claimable')
  @ApiOperation({ summary: '获取用户可领取的成就列表' })
  @ApiQuery({ name: 'walletAddress', description: '钱包地址' })
  @ApiResponse({
    status: 200,
    description: '返回可领取的成就列表',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: '初次尝试' },
          description: { type: 'string', example: '完成第一次垃圾分类' },
          scoreReward: { type: 'number', example: 20 },
          category: { type: 'string', example: 'milestone' },
          tier: { type: 'number', example: 1 },
          completedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async getClaimableAchievements(@Query() query: WalletQueryDto) {
    return this.achievementService.getClaimableAchievements(
      query.walletAddress,
    );
  }

  /**
   * 领取成就奖励
   */
  @Post('claim')
  @ApiOperation({ summary: '领取成就奖励' })
  @ApiResponse({
    status: 200,
    description: '成功领取成就奖励',
    schema: {
      type: 'object',
      properties: {
        achievement: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '初次尝试' },
            scoreReward: { type: 'number', example: 20 },
          },
        },
        scoreAwarded: { type: 'number', example: 20 },
        transactionId: { type: 'number', example: 123 },
        message: {
          type: 'string',
          example: '成功领取成就"初次尝试"，获得 20 积分！',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async claimAchievement(@Body() dto: ClaimAchievementDto) {
    return this.achievementService.claimAchievement(dto);
  }

  /**
   * 获取成就详情
   */
  @Get(':id')
  @ApiOperation({ summary: '获取成就详情' })
  @ApiParam({ name: 'id', description: '成就ID', example: '1' })
  @ApiQuery({
    name: 'walletAddress',
    description: '钱包地址（可选，提供时返回用户进度）',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: '返回成就详情',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        code: { type: 'string', example: 'first_classification' },
        name: { type: 'string', example: '初次尝试' },
        description: { type: 'string', example: '完成第一次垃圾分类' },
        scoreReward: { type: 'number', example: 20 },
        category: { type: 'string', example: 'milestone' },
        tier: { type: 'number', example: 1 },
        requirements: {
          type: 'object',
          example: { min_classifications: 1 },
        },
        progress: { type: 'number', example: 50 },
        isCompleted: { type: 'boolean', example: false },
        isClaimed: { type: 'boolean', example: false },
        canClaim: { type: 'boolean', example: false },
        missingRequirements: {
          type: 'array',
          items: { type: 'string' },
          example: ['需要 1 次分类，当前 0'],
        },
      },
    },
  })
  async getAchievementDetail(
    @Param('id', ParseIntPipe) id: number,
    @Query('walletAddress') walletAddress?: string,
  ) {
    return this.achievementService.getAchievementDetail(id, walletAddress);
  }

  /**
   * 获取用户成就统计
   */
  @Get('stats/user')
  @ApiOperation({ summary: '获取用户成就统计信息' })
  @ApiQuery({ name: 'walletAddress', description: '钱包地址' })
  @ApiResponse({
    status: 200,
    description: '返回用户成就统计',
    schema: {
      type: 'object',
      properties: {
        totalAchievements: { type: 'number', example: 50 },
        completedAchievements: { type: 'number', example: 15 },
        claimedAchievements: { type: 'number', example: 10 },
        unclaimedRewards: { type: 'number', example: 100 },
        completionRate: { type: 'number', example: 30 },
        totalScoreEarned: { type: 'number', example: 500 },
        averageProgress: { type: 'number', example: 45 },
        byCategory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', example: 'milestone' },
              total: { type: 'number', example: 20 },
              completed: { type: 'number', example: 8 },
              claimed: { type: 'number', example: 5 },
            },
          },
        },
        byTier: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tier: { type: 'number', example: 1 },
              total: { type: 'number', example: 25 },
              completed: { type: 'number', example: 12 },
              claimed: { type: 'number', example: 8 },
            },
          },
        },
      },
    },
  })
  async getUserAchievementStats(@Query() query: WalletQueryDto) {
    return this.achievementService.getUserAchievementStats(query.walletAddress);
  }

  /**
   * 获取成就分类信息
   */
  @Get('categories/info')
  @ApiOperation({ summary: '获取成就分类信息' })
  @ApiResponse({
    status: 200,
    description: '返回成就分类统计',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string', example: 'milestone' },
          categoryName: { type: 'string', example: '里程碑' },
          total: { type: 'number', example: 20 },
          avgScoreReward: { type: 'number', example: 150 },
        },
      },
    },
  })
  async getAchievementCategories() {
    return this.achievementService.getAchievementCategories();
  }

  // ==========================================
  // 管理员功能
  // ==========================================

  /**
   * 创建新成就（管理员）
   */
  @Post('admin/create')
  @ApiOperation({ summary: '创建新成就（管理员）' })
  @ApiResponse({
    status: 201,
    description: '成就创建成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        code: { type: 'string', example: 'first_classification' },
        name: { type: 'string', example: '初次尝试' },
        description: { type: 'string', example: '完成第一次垃圾分类' },
        scoreReward: { type: 'number', example: 20 },
        category: { type: 'string', example: 'milestone' },
        tier: { type: 'number', example: 1 },
        isActive: { type: 'boolean', example: true },
      },
    },
  })
  async createAchievement(@Body() dto: CreateAchievementDto) {
    return this.achievementService.createAchievement(dto);
  }

  /**
   * 更新成就信息（管理员）
   */
  @Put('admin/:id')
  @ApiOperation({ summary: '更新成就信息（管理员）' })
  @ApiParam({ name: 'id', description: '成就ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: '成就更新成功',
  })
  async updateAchievement(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAchievementDto,
  ) {
    return this.achievementService.updateAchievement(id, dto);
  }

  /**
   * 删除成就（管理员）
   */
  @Delete('admin/:id')
  @ApiOperation({ summary: '删除成就（管理员）' })
  @ApiParam({ name: 'id', description: '成就ID', example: '1' })
  @ApiResponse({
    status: 204,
    description: '成就删除成功',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAchievement(@Param('id', ParseIntPipe) id: number) {
    return this.achievementService.deleteAchievement(id);
  }

  /**
   * 获取所有成就（管理员）
   */
  @Get('admin/list')
  @ApiOperation({ summary: '获取所有成就列表（管理员）' })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'limit', description: '每页数量', required: false })
  @ApiQuery({ name: 'category', description: '成就分类筛选', required: false })
  @ApiQuery({ name: 'tier', description: '成就等级筛选', required: false })
  @ApiQuery({ name: 'isActive', description: '是否启用筛选', required: false })
  @ApiQuery({ name: 'search', description: '搜索关键词', required: false })
  @ApiQuery({ name: 'sortBy', description: '排序字段', required: false })
  @ApiQuery({ name: 'sortOrder', description: '排序方向', required: false })
  @ApiResponse({
    status: 200,
    description: '返回成就列表',
    schema: {
      type: 'object',
      properties: {
        achievements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              code: { type: 'string', example: 'first_classification' },
              name: { type: 'string', example: '初次尝试' },
              description: { type: 'string', example: '完成第一次垃圾分类' },
              scoreReward: { type: 'number', example: 20 },
              category: { type: 'string', example: 'milestone' },
              tier: { type: 'number', example: 1 },
              isActive: { type: 'boolean', example: true },
              maxClaims: { type: 'number', example: null },
              validFrom: { type: 'string', format: 'date-time' },
              validUntil: { type: 'string', format: 'date-time' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  })
  async getAchievements(@Query() query: AchievementQueryDto) {
    return this.achievementService.getAchievements(query);
  }

  /**
   * 批量创建成就（管理员）
   */
  @Post('admin/batch-create')
  @ApiOperation({ summary: '批量创建成就（管理员）' })
  @ApiResponse({
    status: 201,
    description: '批量创建成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          code: { type: 'string', example: 'first_classification' },
          name: { type: 'string', example: '初次尝试' },
          scoreReward: { type: 'number', example: 20 },
        },
      },
    },
  })
  async batchCreateAchievements(@Body() dto: BatchCreateAchievementsDto) {
    return this.achievementService.batchCreateAchievements(dto);
  }

  /**
   * 手动更新用户成就进度（管理员）
   */
  @Post('admin/update-progress')
  @ApiOperation({ summary: '手动更新用户成就进度（管理员/测试用）' })
  @ApiResponse({
    status: 200,
    description: '进度更新成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        walletAddress: { type: 'string', example: '0x1234...' },
        achievementId: { type: 'number', example: 1 },
        progress: { type: 'number', example: 50 },
        isCompleted: { type: 'boolean', example: false },
        isClaimed: { type: 'boolean', example: false },
        completedAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async updateUserProgress(@Body() dto: UpdateProgressDto) {
    return this.achievementService.updateUserProgress(dto);
  }

  /**
   * 初始化预设成就（管理员）
   */
  @Post('admin/seed')
  @ApiOperation({ summary: '初始化预设成就数据（管理员）' })
  @ApiResponse({
    status: 201,
    description: '预设成就初始化成功',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '成功创建 25 个预设成就' },
        count: { type: 'number', example: 25 },
        achievements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'first_classification' },
              name: { type: 'string', example: '初次尝试' },
              tier: { type: 'number', example: 1 },
            },
          },
        },
      },
    },
  })
  async seedAchievements() {
    const results = await this.achievementService.batchCreateAchievements({
      achievements: ACHIEVEMENT_SEEDS,
    });

    return {
      message: `成功创建 ${results.length} 个预设成就`,
      count: results.length,
      achievements: results.map((a) => ({
        code: a.code,
        name: a.name,
        tier: a.tier,
      })),
    };
  }
}
