export class WalletUtil {
  static validateAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  static formatAddress(address: string): string {
    if (!this.validateAddress(address)) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  static normalizeAddress(address: string): string {
    return address.toLowerCase();
  }
}
