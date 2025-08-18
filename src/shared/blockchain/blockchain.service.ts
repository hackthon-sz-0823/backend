// src/shared/blockchain/blockchain.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { NFT_CONTRACT_ADDRESS, WASTEWISE_ABI } from './const';
import { NFTCategory, NFTRarity } from '../nft.information';

export interface MintResult {
  tokenId: number;
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
}

export interface TransferResult {
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
}

export interface NetworkInfo {
  chainId: number;
  networkName: string;
  adminAddress: string;
  adminBalance: string;
  contractAddress: string;
}

type WasteWiseContract = ethers.Contract & {
  mintNFT(
    to: string,
    metadataURI: string,
    name: string,
    category: number,
    rarity: number,
  ): Promise<ethers.TransactionResponse>;
  transferNFT(to: string, tokenId: number): Promise<ethers.TransactionResponse>;
  getTotalSupply(): Promise<bigint>;
};

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: WasteWiseContract | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeBlockchain();
  }

  private initializeBlockchain(): void {
    try {
      const rpcUrl = process.env.SEPOLIA_RPC_URL;
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // 初始化管理员钱包
      const privateKey = process.env.ADMIN_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('ADMIN_PRIVATE_KEY environment variable is required');
      }
      this.wallet = new ethers.Wallet(privateKey, this.provider);

      // 初始化合约实例
      const contractAddress = NFT_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error(
          'NFT_CONTRACT_ADDRESS environment variable is required',
        );
      }
      this.contract = new ethers.Contract(
        contractAddress,
        WASTEWISE_ABI,
        this.wallet,
      ) as WasteWiseContract;

      this.isInitialized = true;
      this.logger.log('Blockchain service initialized successfully');
      this.logger.log(`Contract Address: ${contractAddress}`);
      this.logger.log(`Admin Wallet: ${this.wallet.address}`);
    } catch (error) {
      this.logger.error(
        `Failed to initialize blockchain service: ${error instanceof Error ? error.message : String(error)}`,
      );
      // 不抛出错误，让服务继续运行，但标记为未初始化
      this.isInitialized = false;
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.contract || !this.wallet) {
      throw new Error('Blockchain service is not properly initialized');
    }
  }

  /**
   * 铸造NFT到指定地址
   */
  async mintNFT(
    to: string,
    tokenURI: string,
    name: string = 'WasteWise NFT',
    category: string = 'achievement',
    rarity: number = 1,
  ): Promise<MintResult> {
    try {
      this.ensureInitialized();

      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      // 映射类别字符串到枚举值
      const categoryEnum = this.mapCategoryToEnum(category);
      // 映射稀有度数字到枚举值
      const rarityEnum = this.mapRarityToEnum(rarity);

      this.logger.log(`Minting NFT to ${to} with URI: ${tokenURI}`);
      this.logger.log(
        `Name: ${name}, Category: ${category}(${categoryEnum}), Rarity: ${rarity}(${rarityEnum})`,
      );

      // ✅ 调用合约的mintNFT方法 - 使用正确的5个参数
      const tx = await this.contract.mintNFT(
        to, // address to
        tokenURI, // string metadataURI
        name, // string name
        categoryEnum, // enum category
        rarityEnum, // enum rarity
      );

      this.logger.log(`Transaction sent: ${tx.hash}`);

      // 等待交易确认
      const receipt = await tx.wait();
      this.logger.log(
        `Transaction confirmed in block: ${receipt?.blockNumber}`,
      );

      // 从事件日志中获取tokenId
      if (!receipt || !receipt.logs) {
        throw new Error('Transaction receipt is null or missing logs');
      }

      // 查找NFTMinted事件
      const mintEvent = receipt.logs.find((log: ethers.Log) => {
        try {
          if (!this.contract) return false;
          const parsedLog = this.contract.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });
          return parsedLog?.name === 'NFTMinted';
        } catch {
          return false;
        }
      });

      if (!mintEvent) {
        throw new Error('NFTMinted event not found in transaction logs');
      }

      const parsedEvent = this.contract.interface.parseLog({
        topics: mintEvent.topics,
        data: mintEvent.data,
      });

      if (!parsedEvent) {
        throw new Error('Failed to parse NFTMinted event');
      }

      const tokenId = Number(parsedEvent.args.tokenId);

      const result: MintResult = {
        tokenId,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };

      this.logger.log(
        `NFT minted successfully: tokenId=${tokenId}, tx=${receipt.hash}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to mint NFT: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new Error(
        `区块链铸造失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 转移NFT到指定地址
   */
  async transferNFT(to: string, tokenId: number): Promise<TransferResult> {
    try {
      this.ensureInitialized();

      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      this.logger.log(`Transferring NFT ${tokenId} to ${to}`);

      // 调用合约的transferNFT方法
      const tx = await this.contract.transferNFT(to, tokenId);
      this.logger.log(`Transfer transaction sent: ${tx.hash}`);

      // 等待交易确认
      const receipt = await tx.wait();
      this.logger.log(`Transfer confirmed in block: ${receipt?.blockNumber}`);
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }
      const result: TransferResult = {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };

      this.logger.log(
        `NFT transferred successfully: tokenId=${tokenId}, tx=${receipt.hash}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to transfer NFT: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new Error(
        `区块链转移失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 获取交易收据（用于验证）
   */
  async getTransactionReceipt(
    txHash: string,
  ): Promise<ethers.TransactionReceipt | null> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      this.logger.error(
        `Failed to get transaction receipt: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * 获取当前网络信息
   */
  async getNetworkInfo(): Promise<NetworkInfo> {
    try {
      this.ensureInitialized();

      if (!this.provider || !this.wallet || !this.contract) {
        throw new Error('Service not properly initialized');
      }

      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(this.wallet.address);
      const contractAddress = await this.contract.getAddress();

      return {
        chainId: Number(network.chainId),
        networkName: network.name,
        adminAddress: this.wallet.address,
        adminBalance: ethers.formatEther(balance),
        contractAddress: contractAddress,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get network info: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 检查合约连接状态
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.contract) {
        return false;
      }

      // 尝试调用合约的只读方法
      await this.contract.getTotalSupply();
      return true;
    } catch (error) {
      this.logger.error(
        `Blockchain health check failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * 重新初始化区块链连接
   */
  reinitialize(): boolean {
    try {
      this.initializeBlockchain();
      return this.isInitialized;
    } catch (error) {
      this.logger.error(
        `Failed to reinitialize blockchain service: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * 获取初始化状态
   */
  getInitializationStatus(): {
    isInitialized: boolean;
    hasProvider: boolean;
    hasWallet: boolean;
    hasContract: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      hasProvider: !!this.provider,
      hasWallet: !!this.wallet,
      hasContract: !!this.contract,
    };
  }

  /**
   * 映射类别字符串到枚举值
   */
  private mapCategoryToEnum(category: string): NFTCategory {
    const categoryMap: { [key: string]: NFTCategory } = {
      general: NFTCategory.GENERAL,
      achievement: NFTCategory.ACHIEVEMENT,
      special: NFTCategory.SPECIAL,
      limited: NFTCategory.LIMITED,
    };
    return categoryMap[category.toLowerCase()] || NFTCategory.GENERAL;
  }

  /**
   * 映射稀有度数字到枚举值
   */
  private mapRarityToEnum(rarity: number): NFTRarity {
    const rarityMap: { [key: number]: NFTRarity } = {
      1: NFTRarity.COMMON,
      2: NFTRarity.UNCOMMON,
      3: NFTRarity.RARE,
      4: NFTRarity.EPIC,
      5: NFTRarity.LEGENDARY,
    };
    return rarityMap[rarity] || NFTRarity.COMMON;
  }
}
