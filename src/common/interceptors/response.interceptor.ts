import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/response.interface';
import { ResponseUtil } from '../utils/response.util';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  ): Observable<ApiResponse<T> | any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    return next.handle().pipe(
      map((data: T) => {
        if (data && typeof data === 'object' && 'success' in data) {
          // 如果已经是 ApiResponse 格式，直接返回
          return data as unknown as ApiResponse<T>;
        }

        return ResponseUtil.success(data, 'Success');
      }),
    );
  }
}
