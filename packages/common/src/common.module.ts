import { Module, Logger, DynamicModule } from '@nestjs/common';
import { RequestInterceptor } from './interceptors/request.interceptor';
import { LoggerService } from './services/logger.service';
import {
  ASYNC_OPTIONS_TYPE,
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
} from './common.definitions';
import { WinstonModule } from 'nest-winston';
import { LOG_DATA_PROVIDER_TOKEN } from './constants/logger.constants';
import { ClsModule, ClsService } from 'nestjs-cls';
import { logMetadataFactory } from './helpers/log-metadata-factory.helper';
import { APP_INFO_TOKEN } from './constants/app.constants';
import { AppService } from './services/app.service';

@Module({})
export class CommonModule extends ConfigurableModuleClass {
  static forRoot(options: typeof OPTIONS_TYPE): DynamicModule {
    return {
      module: CommonModule,
      imports: [
        WinstonModule.forRoot(options.logging ?? {}),
        ClsModule.forRoot({
          global: true,
          middleware: {
            mount: true,
          },
        }),
      ],
      providers: [{ provide: MODULE_OPTIONS_TOKEN, useValue: options }, ...this.getProviders()],
      exports: [...this.getProviders()],
    };
  }

  static forRootAsync(options?: typeof ASYNC_OPTIONS_TYPE) {
    const OptionsDynamicModule = {
      ...super.forRootAsync(options),
      exports: [MODULE_OPTIONS_TOKEN],
    };

    return {
      module: CommonModule,
      imports: [
        this.buildWinstonDynamicModule(OptionsDynamicModule),
        ClsModule.forRoot({
          global: true,
          middleware: {
            mount: true,
          },
        }),
      ],
      providers: [...OptionsDynamicModule.providers, ...this.getProviders()],
      exports: [...this.getProviders()],
    };
  }

  static getProviders() {
    return [
      this.buildLogDataProvider(),
      this.buildAppInfoProvider(),
      AppService,
      RequestInterceptor,
      LoggerService,
      Logger,
    ];
  }

  static buildLogDataProvider() {
    return {
      provide: LOG_DATA_PROVIDER_TOKEN,
      inject: [MODULE_OPTIONS_TOKEN, ClsService],
      useFactory: (options: typeof OPTIONS_TYPE, cls: ClsService) => () => ({
        ...logMetadataFactory(cls),
        ...options.logging.metadataFactory(),
      }),
    };
  }

  static buildAppInfoProvider() {
    return {
      provide: APP_INFO_TOKEN,
      useFactory: (options: typeof OPTIONS_TYPE) => options?.appInfo,
      inject: [MODULE_OPTIONS_TOKEN],
    };
  }

  static buildWinstonDynamicModule(optionsDynamicModule: DynamicModule) {
    return WinstonModule.forRootAsync({
      imports: [optionsDynamicModule],
      inject: [MODULE_OPTIONS_TOKEN],
      useFactory: (options: typeof OPTIONS_TYPE) => options?.logging ?? {},
    });
  }
}
