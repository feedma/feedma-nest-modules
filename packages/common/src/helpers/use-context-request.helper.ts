import { ArgumentsHost, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export async function useContextRequest<
  T extends Record<string, unknown> = Record<string, unknown>,
>(context: ArgumentsHost | ExecutionContext): Promise<Request & T> {
  if (context.getType<string>() === 'graphql') {
    const { GqlExecutionContext } = await import('@nestjs/graphql');
    const ctx = GqlExecutionContext.create(context as ExecutionContext);
    return ctx.getContext().req;
  }
  // by default gets request from http context (context.getType() === 'http')
  return context.switchToHttp().getRequest();
}
