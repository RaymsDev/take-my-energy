import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          this.logger.log(
            `${method} ${url} ${res.statusCode} +${Date.now() - start}ms`,
          );
        },
        error: (err: { status?: number }) => {
          const status = err?.status ?? 500;
          this.logger.error(
            `${method} ${url} ${status} +${Date.now() - start}ms`,
          );
        },
      }),
    );
  }
}
