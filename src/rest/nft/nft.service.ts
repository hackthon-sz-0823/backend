import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { WalletUtil } from '@src/common/utils/wallet.util';
import { NftPool } from '@prisma/client';
import { WalletService } from '@src/shared/wallet/wallet.service';
import {
  ReserveNftDto,
  ClaimNftDto,
  AddNftToPoolDto,
  BatchAddNftDto,
} from './dto/nft.dto';
import { BlockchainService } from '@src/shared/blockchain/blockchain.service';
import { IPFSService } from '@src/shared/ipfs/ipfs.service';

export interface EligibleNft {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  rarity: number;
  category: string;
  requiredScore: number;
  requiredClassifications: number;
  canClaim: boolean;
  missingRequirements?: string[];
}

export interface NftClaimStatus {
  id: number;
  nftPoolId: number;
  walletAddress: string;
  status: string;
  requestedAt: Date;
  confirmedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}

@Injectable()
export class NftService {
  private readonly logger = new Logger(NftService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly blockchainService: BlockchainService,
    private readonly ipfsService: IPFSService,
  ) {}

  /**
   * 获取当前钱包可领取的NFT列表
   */
  async getEligibleNfts(walletAddress: string): Promise<EligibleNft[]> {
    try {
      const normalizedAddress =
        this.walletService.validateAndNormalize(walletAddress);

      // 获取用户档案
      const profile =
        await this.walletService.getWalletProfile(normalizedAddress);

      // 获取所有可用的NFT
      const availableNfts = await this.prisma.prismaClient.nftPool.findMany({
        where: {
          status: 'AVAILABLE',
          isActive: true,
        },
        orderBy: [{ rarity: 'desc' }, { requiredScore: 'asc' }],
      });

      // 检查每个NFT的领取资格
      const eligibleNfts: EligibleNft[] = await Promise.all(
        availableNfts.map(async (nft) => {
          const missingRequirements: string[] = [];

          // 检查积分要求
          if (profile.totalScore < (nft.requiredScore || 0)) {
            missingRequirements.push(
              `需要 ${nft.requiredScore} 积分，当前 ${profile.totalScore}`,
            );
          }

          // 检查分类次数要求
          if (
            profile.totalClassifications < (nft.requiredClassifications || 0)
          ) {
            missingRequirements.push(
              `需要 ${nft.requiredClassifications} 次分类，当前 ${profile.totalClassifications}`,
            );
          }

          // 检查是否已经领取过
          const existingClaim =
            await this.prisma.prismaClient.nftClaim.findFirst({
              where: {
                walletAddress: normalizedAddress,
                nftPoolId: nft.id,
                status: { in: ['CONFIRMED', 'PENDING'] },
              },
            });

          if (existingClaim) {
            missingRequirements.push('已经领取过此NFT');
          }

          return {
            id: nft.id,
            name: nft.name,
            description: nft.description ?? '',
            imageUrl: nft.imageUrl ?? '',
            rarity: nft.rarity,
            category: nft.category || 'general',
            requiredScore: nft.requiredScore || 0,
            requiredClassifications: nft.requiredClassifications || 0,
            canClaim: missingRequirements.length === 0,
            missingRequirements:
              missingRequirements.length > 0 ? missingRequirements : undefined,
          };
        }),
      );

      this.logger.log(
        `Found ${eligibleNfts.length} NFTs for wallet ${WalletUtil.formatAddress(walletAddress)}`,
      );
      return eligibleNfts;
    } catch (error) {
      this.logger.error(
        `Error getting eligible NFTs: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 预留指定NFT
   */
  async reserveNft(
    dto: ReserveNftDto,
  ): Promise<{ message: string; reservedUntil: Date }> {
    try {
      const { walletAddress, nftPoolId } = dto;
      const normalizedAddress =
        this.walletService.validateAndNormalize(walletAddress);

      // 检查NFT是否存在且可用
      const nft = await this.prisma.prismaClient.nftPool.findFirst({
        where: {
          id: nftPoolId,
          status: 'AVAILABLE',
          isActive: true,
        },
      });

      if (!nft) {
        throw new NotFoundException('NFT不存在或不可领取');
      }

      // 检查用户资格
      const eligibleNfts = await this.getEligibleNfts(normalizedAddress);
      const targetNft = eligibleNfts.find((n) => n.id === nftPoolId);

      if (!targetNft || !targetNft.canClaim) {
        throw new BadRequestException(
          `不符合领取条件: ${targetNft?.missingRequirements?.join(', ')}`,
        );
      }

      // 预留NFT（30分钟）
      const reservedUntil = new Date(Date.now() + 30 * 60 * 1000);

      await this.prisma.prismaClient.nftPool.update({
        where: { id: nftPoolId },
        data: {
          status: 'RESERVED',
          claimedByWallet: normalizedAddress,
          reservedUntil,
        },
      });

      this.logger.log(
        `NFT ${nftPoolId} reserved for wallet ${WalletUtil.formatAddress(walletAddress)}`,
      );

      return {
        message: 'NFT预留成功，请在30分钟内完成领取',
        reservedUntil,
      };
    } catch (error) {
      this.logger.error(
        `Error reserving NFT: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 提交NFT领取请求
   */
  async claimNft(dto: ClaimNftDto): Promise<{
    claimId: number;
    transferResult: {
      transactionHash: string;
      blockNumber: number;
    };
    message: string;
  }> {
    try {
      const { walletAddress, nftPoolId } = dto;
      const normalizedAddress =
        this.walletService.validateAndNormalize(walletAddress);

      // 检查NFT是否被当前用户预留
      const nft = await this.prisma.prismaClient.nftPool.findFirst({
        where: {
          id: nftPoolId,
          status: 'RESERVED',
          claimedByWallet: normalizedAddress,
          reservedUntil: { gt: new Date() },
        },
      });

      if (!nft) {
        throw new BadRequestException('NFT未预留或预留已过期，请先预留NFT');
      }

      if (!nft.tokenId) {
        throw new BadRequestException('此NFT尚未铸造到链上，无法转移');
      }

      // 创建领取记录
      const claimRecord = await this.prisma.prismaClient.nftClaim.create({
        data: {
          walletAddress: normalizedAddress,
          nftPoolId,
          status: 'PENDING',
          userAgent: 'WasteWise-Web3',
          ipAddress: '127.0.0.1',
          metadata: {
            claimMethod: 'direct_transfer',
            step: 'transferring',
          },
        },
      });

      try {
        // 直接调用区块链服务转移NFT
        const transferResult = await this.blockchainService.transferNFT(
          normalizedAddress,
          nft.tokenId,
        );

        // 更新领取记录和NFT状态
        await Promise.all([
          this.prisma.prismaClient.nftClaim.update({
            where: { id: claimRecord.id },
            data: {
              status: 'CONFIRMED',
              transactionHash: transferResult.transactionHash,
              blockNumber: BigInt(transferResult.blockNumber),
              gasUsed: BigInt(transferResult.gasUsed),
              confirmedAt: new Date(),
            },
          }),
          this.prisma.prismaClient.nftPool.update({
            where: { id: nftPoolId },
            data: {
              status: 'CLAIMED',
              claimedAt: new Date(),
            },
          }),
        ]);

        this.logger.log(
          `NFT ${nftPoolId} successfully transferred to ${normalizedAddress}`,
        );

        return {
          claimId: claimRecord.id,
          transferResult: {
            transactionHash: transferResult.transactionHash,
            blockNumber: transferResult.blockNumber,
          },
          message: 'NFT转移成功！',
        };
      } catch (transferError) {
        // 转移失败，更新记录状态
        await this.prisma.prismaClient.nftClaim.update({
          where: { id: claimRecord.id },
          data: {
            status: 'FAILED',
            failureReason: JSON.stringify(transferError),
            failedAt: new Date(),
          },
        });

        // 释放NFT预留
        await this.prisma.prismaClient.nftPool.update({
          where: { id: nftPoolId },
          data: { status: 'AVAILABLE' },
        });

        throw transferError;
      }
    } catch (error) {
      this.logger.error(
        `Error claiming NFT: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 获取当前钱包的NFT领取记录
   */
  async getNftClaims(walletAddress: string): Promise<NftClaimStatus[]> {
    try {
      const normalizedAddress =
        this.walletService.validateAndNormalize(walletAddress);

      const claims = await this.prisma.prismaClient.nftClaim.findMany({
        where: { walletAddress: normalizedAddress },
        orderBy: { requestedAt: 'desc' },
        take: 50, // 最近50条记录
      });

      return claims.map((claim) => ({
        id: claim.id,
        nftPoolId: claim.nftPoolId,
        walletAddress: claim.walletAddress,
        status: claim.status,
        requestedAt: claim.requestedAt,
        confirmedAt: claim.confirmedAt || undefined,
        failedAt: claim.failedAt || undefined,
        failureReason: claim.failureReason || undefined,
      }));
    } catch (error) {
      this.logger.error(
        `Error getting NFT claims: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 查询领取状态
   */
  async getClaimStatus(claimId: number): Promise<NftClaimStatus> {
    try {
      const claim = await this.prisma.prismaClient.nftClaim.findUnique({
        where: { id: claimId },
      });

      if (!claim) {
        throw new NotFoundException('领取记录不存在');
      }

      return {
        id: claim.id,
        nftPoolId: claim.nftPoolId,
        walletAddress: claim.walletAddress,
        status: claim.status,
        requestedAt: claim.requestedAt,
        confirmedAt: claim.confirmedAt || undefined,
        failedAt: claim.failedAt || undefined,
        failureReason: claim.failureReason || undefined,
      };
    } catch (error) {
      this.logger.error(
        `Error getting claim status: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 获取当前钱包拥有的NFT
   */
  async getOwnedNfts(walletAddress: string) {
    try {
      const normalizedAddress =
        this.walletService.validateAndNormalize(walletAddress);

      const ownedNfts = await this.prisma.prismaClient.nftClaim.findMany({
        where: {
          walletAddress: normalizedAddress,
          status: 'CONFIRMED',
        },
        include: {
          nftPool: {
            select: {
              id: true,
              name: true,
              description: true,
              imageUrl: true,
              rarity: true,
              category: true,
            },
          },
        },
        orderBy: { confirmedAt: 'desc' },
      });

      return ownedNfts.map((claim) => ({
        claimId: claim.id,
        nft: claim.nftPool,
        claimedAt: claim.confirmedAt,
        transactionHash: claim.transactionHash,
      }));
    } catch (error) {
      this.logger.error(
        `Error getting owned NFTs: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 添加NFT到池 - 立即铸造到链上
   */
  async addNftToPool(dto: AddNftToPoolDto): Promise<
    NftPool & {
      blockchainInfo: {
        tokenId: number;
        transactionHash: string;
        metadataUri: string;
      };
    }
  > {
    try {
      this.logger.log(`Starting NFT minting process for: ${dto.name}`);

      // Step 1: 构建NFT元数据
      const metadata = this.ipfsService.buildNFTMetadata({
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        rarity: dto.rarity,
        category: dto.category || 'general',
        attributes: dto.attributes,
      });

      // Step 2: 上传元数据到IPFS
      const ipfsResult = await this.ipfsService.uploadMetadata(metadata);
      const metadataUri = ipfsResult.url;

      this.logger.log(`Metadata uploaded to IPFS: ${metadataUri}`);

      // Step 3: 铸造NFT到区块链
      const adminAddress = process.env.ADMIN_WALLET_ADDRESS;
      if (!adminAddress) {
        throw new Error('Admin wallet address not configured');
      }

      const mintResult = await this.blockchainService.mintNFT(
        adminAddress,
        metadataUri,
      );

      this.logger.log(
        `NFT minted successfully: tokenId=${mintResult.tokenId}, tx=${mintResult.transactionHash}`,
      );

      // Step 4: 保存到数据库
      const nft = await this.prisma.prismaClient.nftPool.create({
        data: {
          tokenId: mintResult.tokenId,
          // TODO: 合约地址
          contractAddress: '0x',
          metadataUri: metadataUri,
          imageUrl: dto.imageUrl,
          name: dto.name,
          description: dto.description,
          status: 'AVAILABLE',
          rarity: dto.rarity,
          category: dto.category || 'general',
          requiredScore: dto.requiredScore,
          requiredClassifications: dto.requiredClassifications,
          createdBy: adminAddress,
          attributes: metadata.attributes,
        },
      });

      this.logger.log(`NFT saved to database: ${nft.name} (ID: ${nft.id})`);

      return {
        ...nft,
        blockchainInfo: {
          tokenId: mintResult.tokenId,
          transactionHash: mintResult.transactionHash,
          metadataUri: metadataUri,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error adding NFT to pool: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 批量添加NFT（管理员功能）
   */
  async batchAddNfts(dto: BatchAddNftDto): Promise<
    Array<
      NftPool & {
        blockchainInfo: {
          tokenId: number;
          transactionHash: string;
          metadataUri: string;
        };
      }
    >
  > {
    try {
      this.logger.log(`Starting batch NFT minting for ${dto.nfts.length} NFTs`);

      const results: (NftPool & {
        blockchainInfo: {
          tokenId: number;
          transactionHash: string;
          metadataUri: string;
        };
      })[] = [];

      // 串行处理，避免nonce冲突
      for (const nftData of dto.nfts) {
        try {
          const result = await this.addNftToPool(nftData);
          results.push(result);

          // 添加短暂延迟，确保区块链交易顺序
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          this.logger.error(
            `Failed to mint NFT ${nftData.name}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      this.logger.log(
        `Batch minting completed: ${results.length}/${dto.nfts.length} successful`,
      );
      return results;
    } catch (error) {
      this.logger.error(
        `Error in batch adding NFTs: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 获取NFT池统计信息
   */
  async getPoolStats() {
    try {
      const [totalNfts, availableNfts, claimedNfts, pendingClaims] =
        await Promise.all([
          this.prisma.prismaClient.nftPool.count(),
          this.prisma.prismaClient.nftPool.count({
            where: { status: 'AVAILABLE' },
          }),
          this.prisma.prismaClient.nftPool.count({
            where: { status: 'CLAIMED' },
          }),
          this.prisma.prismaClient.nftClaim.count({
            where: { status: 'PENDING' },
          }),
        ]);

      // 按稀有度统计
      const rarityStats = await this.prisma.prismaClient.nftPool.groupBy({
        by: ['rarity'],
        _count: { _all: true },
        orderBy: { rarity: 'asc' },
      });

      // 按类别统计
      const categoryStatsRaw = await this.prisma.prismaClient.nftPool.groupBy({
        by: ['category'],
        _count: { _all: true },
      });
      // 按_count._all 降序排序
      const categoryStats = categoryStatsRaw.sort(
        (a, b) => b._count._all - a._count._all,
      );

      return {
        overview: {
          totalNfts,
          availableNfts,
          claimedNfts,
          pendingClaims,
          claimRate:
            totalNfts > 0 ? Math.round((claimedNfts / totalNfts) * 100) : 0,
        },
        byRarity: rarityStats.map((stat) => ({
          rarity: stat.rarity,
          count: stat._count._all,
        })),
        byCategory: categoryStats.map((stat) => ({
          category: stat.category || 'general',
          count: stat._count._all,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Error getting pool stats: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
