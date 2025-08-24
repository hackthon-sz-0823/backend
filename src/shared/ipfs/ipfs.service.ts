import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  background_color?: string;
}

export interface IPFSUploadResult {
  hash: string;
  url: string; // ipfs://<hash>
}

/** Pinata: /pinning/pinJSONToIPFS 与 /pinning/pinFileToIPFS 的响应体 */
interface PinataPinResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate?: boolean;
}

/** Pinata: /data/testAuthentication 响应体（仅取我们会用到的字段） */
interface PinataAuthResponse {
  message?: string;
}

@Injectable()
export class IPFSService {
  private readonly logger = new Logger(IPFSService.name);
  private readonly pinataApiKey: string;
  private readonly pinataSecretKey: string;
  private readonly pinataGateway: string;
  private readonly frontendUrl: string;
  private readonly pinataJWT: string;

  constructor() {
    this.pinataApiKey = process.env.PINATA_API_KEY ?? '';
    this.pinataSecretKey = process.env.PINATA_SECRET_API_KEY ?? '';
    this.pinataGateway =
      process.env.PINATA_GATEWAY ?? 'https://gateway.pinata.cloud';
    this.pinataJWT = process.env.PINATA_JWT ?? '';
    this.frontendUrl = process.env.FRONTEND_URL ?? '';

    if (!this.pinataApiKey || !this.pinataSecretKey) {
      this.logger.warn(
        'Pinata credentials not configured, IPFS uploads will be simulated',
      );
    }
  }

  /**
   * 上传NFT元数据到IPFS
   */
  async uploadMetadata(metadata: NFTMetadata): Promise<IPFSUploadResult> {
    try {
      const body = {
        pinataContent: metadata,
        pinataMetadata: {
          name: `${metadata.name}-metadata`,
          keyvalues: {
            type: 'nft-metadata',
            created: new Date().toISOString(),
          },
        },
        pinataOptions: {
          groupId: '5fb886c6-dc6d-4b0c-8efb-432d1dd5283a', // nft group ID from Pinata
        },
      };

      const resp: AxiosResponse<PinataPinResponse> = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        body,
        {
          headers: {
            Authorization: `Bearer ${process.env.PINATA_JWT}`,
            'Content-Type': 'application/json',
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
        },
      );

      const hash = resp.data.IpfsHash;
      this.logger.log(`Uploaded metadata to IPFS: ${hash}`);
      return { hash, url: `ipfs://${hash}` };
    } catch (error) {
      throw new Error(
        `IPFS上传失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 上传图片到IPFS（Node Buffer）
   */
  async uploadImage(
    imageBuffer: Buffer,
    fileName: string,
  ): Promise<IPFSUploadResult> {
    try {
      // 无凭据 → 模拟
      if (!this.pinataApiKey || !this.pinataSecretKey) {
        const mockHash = `Qm${Math.random().toString(36).slice(2, 46)}`;
        this.logger.log(`[SIMULATED] Uploaded image to IPFS: ${mockHash}`);
        return { hash: mockHash, url: `ipfs://${mockHash}` };
      }

      const form = new FormData();
      form.append('file', imageBuffer, fileName);
      form.append(
        'pinataMetadata',
        JSON.stringify({
          folder: 'nft',
          name: fileName,
          keyvalues: {
            type: 'nft-image',
            created: new Date().toISOString(),
          },
        }),
      );
      form.append(
        'pinataOptions',
        JSON.stringify({
          groupId: '5fb886c6-dc6d-4b0c-8efb-432d1dd5283a', // nft group ID from Pinata
        }),
      );

      const resp: AxiosResponse<PinataPinResponse> = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        form,
        {
          headers: {
            ...form.getHeaders(),
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
          // 让 axios 正确处理可变长度表单
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      );

      const hash = resp.data.IpfsHash;
      this.logger.log(`Uploaded image to IPFS: ${hash}`);
      return { hash, url: `ipfs://${hash}` };
    } catch (error) {
      throw new Error(
        `图片IPFS上传失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 构建NFT元数据
   */
  buildNFTMetadata(params: {
    name: string;
    description: string;
    imageUrl: string;
    rarity: number;
    category: string;
    attributes?: Array<{ trait_type: string; value: string | number }>;
  }): NFTMetadata {
    const defaultAttributes: NFTMetadata['attributes'] = [
      { trait_type: 'Category', value: params.category },
      { trait_type: 'Rarity Level', value: params.rarity },
    ];

    const slug =
      params.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') || 'nft';

    // 处理图片URL - 如果是相对路径，转换为完整的HTTPS URL
    let imageUrl = params.imageUrl;
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('ipfs://')) {
      // 使用 Picsum 作为占位图服务，或者可以配置一个图片服务器
      imageUrl = `https://picsum.photos/400/400?random=${encodeURIComponent(params.name)}`;
      this.logger.log(`Converting relative image path to placeholder: ${params.imageUrl} -> ${imageUrl}`);
    }

    return {
      name: params.name,
      description: params.description,
      image: imageUrl,
      attributes: [...defaultAttributes, ...(params.attributes ?? [])],
      external_url: this.frontendUrl
        ? `${this.frontendUrl}/nft/${slug}`
        : undefined,
    };
  }

  /**
   * 获取IPFS文件的HTTP URL（兼容传入 ipfs://<hash> 或裸 hash）
   */
  getHttpUrl(ipfs: string): string {
    const hash = ipfs.startsWith('ipfs://')
      ? ipfs.slice('ipfs://'.length)
      : ipfs;
    return `${this.pinataGateway}/ipfs/${encodeURIComponent(hash)}`;
  }

  /**
   * 测试IPFS连接
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.pinataApiKey || !this.pinataSecretKey) {
        this.logger.log('IPFS service running in simulation mode');
        return true;
      }

      const resp: AxiosResponse<PinataAuthResponse> = await axios.get(
        'https://api.pinata.cloud/data/testAuthentication',
        {
          headers: {
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
        },
      );

      this.logger.log('IPFS connection test successful');
      return resp.status === 200;
    } catch (error) {
      this.logger.error(
        `IPFS connection test failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
