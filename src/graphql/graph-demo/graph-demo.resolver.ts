import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import {
  GraphDemoService,
  Product as ServiceProduct,
} from './graph-demo.service';
import { Product } from './entities/product.entity'; // GraphQL 实体
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductStatistics } from './entities/product-statistics.entity';
import { DeleteProductResponse } from './entities/delete-product-response.entity';

@Resolver(() => Product)
export class GraphDemoResolver {
  constructor(private readonly graphDemoService: GraphDemoService) {}

  // 查询操作 - 返回类型为 GraphQL Product，实际数据来自 Service
  @Query(() => [Product], { description: '获取所有产品' })
  products(): ServiceProduct[] {
    console.log('🔍 GraphQL products query called');
    const result = this.graphDemoService.findAll();
    console.log('📊 Returning products:', result.length);
    return result;
  }

  @Query(() => Product, { description: '根据ID获取产品' })
  product(@Args('id', { type: () => Int }) id: number): ServiceProduct {
    console.log('🔍 GraphQL product query called with id:', id);
    return this.graphDemoService.findOne(id);
  }

  @Query(() => [Product], { description: '根据分类获取产品' })
  productsByCategory(@Args('category') category: string): ServiceProduct[] {
    console.log(
      '🔍 GraphQL productsByCategory query called with category:',
      category,
    );
    return this.graphDemoService.findByCategory(category);
  }

  @Query(() => [Product], { description: '获取有库存的产品' })
  productsInStock(): ServiceProduct[] {
    console.log('🔍 GraphQL productsInStock query called');
    return this.graphDemoService.findInStock();
  }

  @Query(() => [Product], { description: '根据名称搜索产品' })
  searchProducts(@Args('keyword') keyword: string): ServiceProduct[] {
    console.log(
      '🔍 GraphQL searchProducts query called with keyword:',
      keyword,
    );
    return this.graphDemoService.searchByName(keyword);
  }

  @Query(() => ProductStatistics, { description: '获取产品统计信息' })
  productStatistics(): ProductStatistics {
    console.log('🔍 GraphQL productStatistics query called');

    const stats = this.graphDemoService.getStatistics();
    console.log('📊 Service 返回的统计数据:', stats);

    // 添加安全检查
    const safeStats = {
      totalProducts: stats.totalProducts ?? 0,
      inStockCount: stats.inStockCount ?? 0,
      categories: stats.categories ?? [],
    };

    console.log('✅ 安全处理后的统计数据:', safeStats);
    return safeStats;
  }

  // 变更操作
  @Mutation(() => Product, { description: '创建新产品' })
  createProduct(
    @Args('createProductInput') createProductInput: CreateProductInput,
  ): ServiceProduct {
    console.log(
      '🔍 GraphQL createProduct mutation called with input:',
      createProductInput,
    );
    return this.graphDemoService.create(createProductInput);
  }

  @Mutation(() => Product, { description: '更新产品信息' })
  updateProduct(
    @Args('id', { type: () => Int }) id: number,
    @Args('updateProductInput') updateProductInput: UpdateProductInput,
  ): ServiceProduct {
    console.log(
      '🔍 GraphQL updateProduct mutation called with id:',
      id,
      'input:',
      updateProductInput,
    );
    return this.graphDemoService.update(id, updateProductInput);
  }

  @Mutation(() => DeleteProductResponse, { description: '删除产品' })
  removeProduct(@Args('id', { type: () => Int }) id: number): {
    message: string;
    deletedProduct: ServiceProduct;
  } {
    console.log('🔍 GraphQL removeProduct mutation called with id:', id);
    return this.graphDemoService.remove(id);
  }
}
