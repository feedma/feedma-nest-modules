import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';
import { INQUIRER } from '@nestjs/core';
import { LOG_DATA_PROVIDER_TOKEN } from '../constants/logger.constants';
import { LogData, LogMetadataFactory } from '../interfaces/logger.interface';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  invoker: string;
  constructor(
    @Inject(LOG_DATA_PROVIDER_TOKEN) private metadataFactory: LogMetadataFactory<LogData>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private logger: Logger,
    @Inject(INQUIRER) source?: string | unknown,
  ) {
    this.invoker = source?.constructor?.name;
    (logger as unknown as WinstonLogger).setContext(source?.constructor?.name);
  }

  get source(): unknown[] {
    return [this.invoker];
  }

  get meta(): object {
    return this.metadataFactory();
  }

  debug(message: unknown, payload?: Record<string, unknown>, ...optionalParams: unknown[]): void {
    this.logger.debug({ message, value: { _debug: this.meta, ...payload } }, [
      ...this.source,
      ...optionalParams,
    ]);
  }

  error(
    message: string,
    stack?: string,
    payload?: Record<string, unknown>,
    ...optionalParams: unknown[]
  ): void {
    this.logger.error({ message, value: { _debug: this.meta, ...payload } }, stack, [
      ...this.source,
      ...optionalParams,
    ]);
  }

  log(message: unknown, payload?: Record<string, unknown>, ...optionalParams: unknown[]): void {
    this.logger.log({ message, value: { _debug: this.meta, ...payload } }, [
      ...this.source,
      ...optionalParams,
    ]);
  }

  verbose(message: unknown, payload?: Record<string, unknown>, ...optionalParams: unknown[]): void {
    this.logger.verbose({ message, value: { _debug: this.meta, ...payload } }, [
      ...this.source,
      ...optionalParams,
    ]);
  }

  warn(message: unknown, payload?: Record<string, unknown>, ...optionalParams: unknown[]): void {
    this.logger.warn({ message, value: { _debug: this.meta, ...payload } }, [
      ...this.source,
      ...optionalParams,
    ]);
  }
}
