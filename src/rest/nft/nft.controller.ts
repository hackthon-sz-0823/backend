// src/modules/nft/nft.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { NftService } from './nft.service';
import {
  WalletQueryDto,
  ReserveNftDto,
  ClaimNftDto,
  AddNftToPoolDto,
  BatchAddNftDto,
} from './dto/nft.dto';

@ApiTags('NFT管理')
@Controller('nft')
export class NftController {
  constructor(private readonly nftService: NftService) {}

  /**
   * 获取可领取的NFT列表
   */
  @Get('eligible')
  @ApiOperation({ summary: '获取钱包可领取的NFT列表' })
  @ApiQuery({
    name: 'walletAddress',
    description: '钱包地址',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @ApiResponse({
    status: 200,
    description: '返回可领取的NFT列表',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: '环保战士 #001' },
          description: {
            type: 'string',
            example: '完成100次正确分类的环保英雄',
          },
          imageUrl: { type: 'string', example: 'https://example.com/nft.png' },
          rarity: { type: 'number', example: 3 },
          category: { type: 'string', example: 'achievement' },
          requiredScore: { type: 'number', example: 100 },
          requiredClassifications: { type: 'number', example: 50 },
          canClaim: { type: 'boolean', example: true },
          missingRequirements: {
            type: 'array',
            items: { type: 'string' },
            example: ['需要 100 积分，当前 80'],
          },
        },
      },
    },
  })
  async getEligibleNfts(@Query() query: WalletQueryDto) {
    return this.nftService.getEligibleNfts(query.walletAddress);
  }

  /**
   * 预留NFT
   */
  @Post('reserve')
  @ApiOperation({ summary: '预留NFT（30分钟有效）' })
  @ApiResponse({
    status: 200,
    description: 'NFT预留成功',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'NFT预留成功，请在30分钟内完成领取',
        },
        reservedUntil: {
          type: 'string',
          format: 'date-time',
          example: '2025-01-15T11:00:00Z',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async reserveNft(@Body() dto: ReserveNftDto) {
    return this.nftService.reserveNft(dto);
  }

  /**
   * 领取NFT（直接转移）
   */
  @Post('claim')
  @ApiOperation({ summary: '领取NFT - 直接转移到用户钱包' })
  @ApiResponse({
    status: 200,
    description: 'NFT转移成功',
    schema: {
      type: 'object',
      properties: {
        claimId: { type: 'number', example: 123 },
        transferResult: {
          type: 'object',
          properties: {
            transactionHash: {
              type: 'string',
              example: '0x1234567890abcdef...',
            },
            blockNumber: { type: 'number', example: 18500000 },
          },
        },
        message: { type: 'string', example: 'NFT转移成功！' },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async claimNft(@Body() dto: ClaimNftDto) {
    return this.nftService.claimNft(dto);
  }

  /**
   * 获取NFT领取记录
   */
  @Get('claims')
  @ApiOperation({ summary: '获取钱包的NFT领取记录' })
  @ApiQuery({ name: 'walletAddress', description: '钱包地址' })
  @ApiResponse({
    status: 200,
    description: '返回NFT领取记录',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 123 },
          nftPoolId: { type: 'number', example: 1 },
          walletAddress: { type: 'string', example: '0x1234...' },
          status: {
            type: 'string',
            example: 'CONFIRMED',
            enum: ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'],
          },
          requestedAt: { type: 'string', format: 'date-time' },
          confirmedAt: { type: 'string', format: 'date-time' },
          failedAt: { type: 'string', format: 'date-time' },
          failureReason: { type: 'string' },
        },
      },
    },
  })
  async getNftClaims(@Query() query: WalletQueryDto) {
    return this.nftService.getNftClaims(query.walletAddress);
  }

  /**
   * 查询领取状态
   */
  @Get('claims/:claimId')
  @ApiOperation({ summary: '查询特定领取记录的状态' })
  @ApiParam({ name: 'claimId', description: '领取记录ID', example: '123' })
  @ApiResponse({
    status: 200,
    description: '返回领取状态',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 123 },
        nftPoolId: { type: 'number', example: 1 },
        walletAddress: { type: 'string', example: '0x1234...' },
        status: { type: 'string', example: 'CONFIRMED' },
        requestedAt: { type: 'string', format: 'date-time' },
        confirmedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getClaimStatus(@Param('claimId') claimId: string) {
    const claimIdNum = parseInt(claimId, 10);
    if (isNaN(claimIdNum)) {
      throw new Error('Invalid claim ID');
    }
    return this.nftService.getClaimStatus(claimIdNum);
  }

  /**
   * 获取已拥有的NFT
   */
  @Get('owned')
  @ApiOperation({ summary: '获取钱包拥有的NFT列表' })
  @ApiQuery({ name: 'walletAddress', description: '钱包地址' })
  @ApiResponse({
    status: 200,
    description: '返回拥有的NFT列表',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          claimId: { type: 'number', example: 123 },
          nft: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: '环保战士 #001' },
              description: {
                type: 'string',
                example: '完成100次正确分类的环保英雄',
              },
              imageUrl: {
                type: 'string',
                example: 'https://example.com/nft.png',
              },
              rarity: { type: 'number', example: 3 },
              category: { type: 'string', example: 'achievement' },
            },
          },
          claimedAt: { type: 'string', format: 'date-time' },
          transactionHash: { type: 'string', example: '0x1234567890abcdef...' },
        },
      },
    },
  })
  async getOwnedNfts(@Query() query: WalletQueryDto) {
    return this.nftService.getOwnedNfts(query.walletAddress);
  }

  // ==========================================
  // 管理员功能
  // ==========================================

  /**
   * 添加NFT到池（管理员功能 - 直接铸造）
   */
  @Post('admin/pool')
  @ApiOperation({ summary: '添加NFT到池并铸造到链上（管理员）' })
  @ApiResponse({
    status: 201,
    description: 'NFT铸造并添加成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: '环保战士 #001' },
        description: { type: 'string', example: '完成100次正确分类的环保英雄' },
        tokenId: { type: 'number', example: 42 },
        contractAddress: { type: 'string', example: '0x1234567890abcdef...' },
        metadataUri: { type: 'string', example: 'ipfs://QmHash...' },
        status: { type: 'string', example: 'AVAILABLE' },
        blockchainInfo: {
          type: 'object',
          properties: {
            tokenId: { type: 'number', example: 42 },
            transactionHash: {
              type: 'string',
              example: '0x1234567890abcdef...',
            },
            metadataUri: { type: 'string', example: 'ipfs://QmHash...' },
          },
        },
      },
    },
  })
  async addToPool(@Body() dto: AddNftToPoolDto) {
    return this.nftService.addNftToPool(dto);
  }

  /**
   * 批量添加NFT（管理员功能）
   */
  @Post('admin/pool/batch')
  @ApiOperation({ summary: '批量添加NFT到池（管理员）' })
  @ApiResponse({
    status: 201,
    description: '批量NFT添加成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          tokenId: { type: 'number' },
          blockchainInfo: {
            type: 'object',
            properties: {
              tokenId: { type: 'number' },
              transactionHash: { type: 'string' },
              metadataUri: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async batchAddToPool(@Body() dto: BatchAddNftDto) {
    return this.nftService.batchAddNfts(dto);
  }

  /**
   * 获取NFT池统计信息
   */
  @Get('admin/stats')
  @ApiOperation({ summary: '获取NFT池统计信息（管理员）' })
  @ApiResponse({
    status: 200,
    description: '返回NFT池统计',
    schema: {
      type: 'object',
      properties: {
        overview: {
          type: 'object',
          properties: {
            totalNfts: { type: 'number', example: 100 },
            availableNfts: { type: 'number', example: 75 },
            claimedNfts: { type: 'number', example: 20 },
            pendingClaims: { type: 'number', example: 5 },
            claimRate: { type: 'number', example: 20 },
          },
        },
        byRarity: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rarity: { type: 'number', example: 1 },
              count: { type: 'number', example: 50 },
            },
          },
        },
        byCategory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', example: 'achievement' },
              count: { type: 'number', example: 30 },
            },
          },
        },
      },
    },
  })
  async getPoolStats() {
    return this.nftService.getPoolStats();
  }
}
