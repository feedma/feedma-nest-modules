import { v4 } from 'uuid';
import { Observable, tap } from 'rxjs';
import { ClsService } from 'nestjs-cls';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { LoggerService } from '../services/logger.service';
import { IRequestContext } from '../interfaces/request-context.interface';
import { useContextRequest } from '../helpers/use-context-request.helper';

@Injectable()
export class RequestInterceptor implements NestInterceptor {
  constructor(
    private cls: ClsService<IRequestContext>,
    private readonly logger: LoggerService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const now = Date.now();
    const request = await useContextRequest(context);
    const requestId = request.headers['x-request-id'] as string;
    const language = request.headers['accept-language'] || 'en';

    this.cls.set('requestId', requestId || v4());
    this.cls.set('language', language);

    this.logger.log('Incoming request', { url: request.url, method: request.method });

    return next.handle().pipe(tap(() => this.logger.log(`Finished after ${Date.now() - now}ms`)));
  }
}
