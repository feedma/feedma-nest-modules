import { WinstonModuleOptions } from 'nest-winston';
import { ConfigurableModuleBuilder } from '@nestjs/common';
import { LogMetadataFactory } from './interfaces/logger.interface';
import { IAppInfo } from './interfaces/app.interface';

export interface ILoggingOptions extends WinstonModuleOptions {
  metadataFactory?: LogMetadataFactory;
}

export interface ICommonModuleOptions {
  appInfo?: IAppInfo;
  logging?: ILoggingOptions;
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<ICommonModuleOptions>({
    moduleName: 'CommonModule',
  })
    .setClassMethodName('forRoot')
    .build();
