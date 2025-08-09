import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '@src/shared/prisma/prisma.service';

export interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class RestDemoService {
  constructor(private readonly prisma: PrismaService) {}
  private users: User[] = [
    {
      id: 1,
      name: '张三',
      email: 'zhangsan@example.com',
      age: 25,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 2,
      name: '李四',
      email: 'lisi@example.com',
      age: 30,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];
  private nextId = 3;

  async findAll(): Promise<User[]> {
    const data = await this.prisma.prismaClient.walletAchievement.findMany({
      orderBy: { id: 'asc' },
    });
    console.log(data, 'findAll called');
    return this.users;
  }

  findOne(id: number): User {
    const user = this.users.find((user) => user.id === id);
    if (!user) {
      throw new NotFoundException(`用户ID ${id} 不存在`);
    }
    return user;
  }

  create(createUserDto: CreateUserDto): User {
    const newUser: User = {
      id: this.nextId++,
      ...createUserDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  update(id: number, updateUserDto: UpdateUserDto): User {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
      throw new NotFoundException(`用户ID ${id} 不存在`);
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updateUserDto,
      updatedAt: new Date(),
    };

    return this.users[userIndex];
  }

  remove(id: number): { message: string; deletedUser: User } {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
      throw new NotFoundException(`用户ID ${id} 不存在`);
    }

    const deletedUser = this.users.splice(userIndex, 1)[0];
    return {
      message: `用户 ${deletedUser.name} 已成功删除`,
      deletedUser,
    };
  }

  // 额外的查询方法
  findByEmail(email: string): User | null {
    return this.users.find((user) => user.email === email) || null;
  }

  searchByName(keyword: string): User[] {
    return this.users.filter((user) =>
      user.name.toLowerCase().includes(keyword.toLowerCase()),
    );
  }
}
