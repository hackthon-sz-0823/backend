import { UseInterceptors } from '@nestjs/common';
import { ResponseInterceptor } from '../interceptors/response.interceptor';

/**
 * 基础 API 响应装饰器
 */
export const ApiResponse = () => UseInterceptors(ResponseInterceptor);
