import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { IPFSService } from './ipfs/ipfs.service';
import { BlockchainService } from './blockchain/blockchain.service';
import { WalletService } from './wallet/wallet.service';

@Module({
  providers: [PrismaService, IPFSService, BlockchainService, WalletService],
  exports: [PrismaService, IPFSService, BlockchainService, WalletService],
})
export class SharedModule {}
