import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isWalletAddress', async: false })
export class IsWalletAddressConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
  }

  defaultMessage(): string {
    return '钱包地址格式不正确,应为42位十六进制字符串(以0x开头)';
  }
}

export function IsWalletAddress(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isWalletAddress',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsWalletAddressConstraint,
    });
  };
}
