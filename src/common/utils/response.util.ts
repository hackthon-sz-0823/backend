import { ApiResponse } from '../interfaces/response.interface';

export class ResponseUtil {
  static success<T>(data: T, message = 'Success'): ApiResponse<T> {
    return {
      success: true,
      code: 200,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static error<T = null>(
    message: string,
    code = 500,
    data: T = null as T,
  ): ApiResponse<T> {
    return {
      success: false,
      code,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
