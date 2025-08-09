import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(2, { message: '用户名至少2个字符' })
  name: string;

  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsOptional()
  @IsPositive({ message: '年龄必须是正数' })
  age?: number;
}
