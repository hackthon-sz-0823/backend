import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GraphDemoService {
  private products: Product[] = [
    {
      id: 1,
      name: 'iPhone 15',
      description: '最新款苹果手机',
      price: 6999,
      category: '电子产品',
      inStock: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 2,
      name: 'MacBook Pro',
      description: '专业级笔记本电脑',
      price: 15999,
      category: '电子产品',
      inStock: false,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: 3,
      name: '咖啡杯',
      description: '精美陶瓷咖啡杯',
      price: 89,
      category: '生活用品',
      inStock: true,
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    },
  ];
  private nextId = 4;

  findAll(): Product[] {
    return this.products;
  }

  findOne(id: number): Product {
    const product = this.products.find((product) => product.id === id);
    if (!product) {
      throw new NotFoundException(`产品ID ${id} 不存在`);
    }
    return product;
  }

  findByCategory(category: string): Product[] {
    return this.products.filter((product) => product.category === category);
  }

  findInStock(): Product[] {
    return this.products.filter((product) => product.inStock);
  }

  searchByName(keyword: string): Product[] {
    return this.products.filter((product) =>
      product.name.toLowerCase().includes(keyword.toLowerCase()),
    );
  }

  create(createProductInput: CreateProductInput): Product {
    const newProduct: Product = {
      id: this.nextId++,
      ...createProductInput,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.push(newProduct);
    return newProduct;
  }

  update(id: number, updateProductInput: UpdateProductInput): Product {
    const productIndex = this.products.findIndex(
      (product) => product.id === id,
    );
    if (productIndex === -1) {
      throw new NotFoundException(`产品ID ${id} 不存在`);
    }

    this.products[productIndex] = {
      ...this.products[productIndex],
      ...updateProductInput,
      updatedAt: new Date(),
    };

    return this.products[productIndex];
  }

  remove(id: number): { message: string; deletedProduct: Product } {
    const productIndex = this.products.findIndex(
      (product) => product.id === id,
    );
    if (productIndex === -1) {
      throw new NotFoundException(`产品ID ${id} 不存在`);
    }

    const deletedProduct = this.products.splice(productIndex, 1)[0];
    return {
      message: `产品 ${deletedProduct.name} 已成功删除`,
      deletedProduct,
    };
  }

  getStatistics(): {
    totalProducts: number;
    inStockCount: number;
    categories: string[];
  } {
    const categories = [...new Set(this.products.map((p) => p.category))];

    console.log('📊 计算统计数据...');
    console.log('🔢 产品总数:', this.products.length);
    console.log(
      '📦 有库存数量:',
      this.products.filter((p) => p.inStock).length,
    );
    console.log('🏷️ 分类:', categories);

    const result = {
      totalProducts: this.products.length || 0, // 确保不为 null
      inStockCount: this.products.filter((p) => p.inStock).length || 0, // 确保不为 null
      categories: categories || [], // 确保不为 null
    };

    console.log('✅ 返回统计结果:', result);
    return result;
  }
}
