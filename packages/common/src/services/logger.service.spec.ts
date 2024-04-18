import { ClsService } from 'nestjs-cls';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INQUIRER } from '@nestjs/core';
import { clsGetterMockFactory, mockAppStore } from '@feedma/nest-testing';
import { LoggerService } from './logger.service';
import { LOG_DATA_PROVIDER_TOKEN } from '../constants/logger.constants';
import { logMetadataFactory } from '../helpers/log-metadata-factory.helper';

describe('LoggerService', () => {
  let service: LoggerService;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        ConfigService,
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: {
            debug: jest.fn(),
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            verbose: jest.fn(),
            setContext: jest.fn(),
          },
        },
        {
          provide: ClsService,
          useValue: {
            get: jest.fn().mockImplementation(clsGetterMockFactory()),
          },
        },
        {
          provide: INQUIRER,
          useValue: { constructor: { name: 'TestController' } },
        },
        {
          provide: LOG_DATA_PROVIDER_TOKEN,
          useFactory: (cls: ClsService) => () => logMetadataFactory(cls),
          inject: [ClsService],
        },
      ],
    }).compile();

    service = await module.resolve<LoggerService>(LoggerService);
    logger = await module.resolve<Logger>(WINSTON_MODULE_NEST_PROVIDER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should invoke the debug method with the expected data', () => {
    service.debug('debug message');
    expect(logger.debug).toHaveBeenCalledWith(
      {
        message: 'debug message',
        value: {
          _debug: {
            requestId: mockAppStore.requestId,
            userId: mockAppStore.userId,
            language: mockAppStore.language,
          },
        },
      },
      ['TestController'],
    );
  });

  it('should invoke the log method with the expected data', () => {
    service.log('log message');
    expect(logger.log).toHaveBeenCalledWith(
      {
        message: 'log message',
        value: {
          _debug: {
            requestId: mockAppStore.requestId,
            userId: mockAppStore.userId,
            language: mockAppStore.language,
          },
        },
      },
      ['TestController'],
    );
  });

  it('should invoke the error method with the expected data', () => {
    const stack = 'some_error in file: __path/some/file.ts';
    service.error('error message', stack);
    expect(logger.error).toHaveBeenCalledWith(
      {
        message: 'error message',
        value: {
          _debug: {
            requestId: mockAppStore.requestId,
            userId: mockAppStore.userId,
            language: mockAppStore.language,
          },
        },
      },
      stack,
      ['TestController'],
    );
  });

  it('should invoke the warn method with the expected data', () => {
    service.warn('warn message');
    expect(logger.warn).toHaveBeenCalledWith(
      {
        message: 'warn message',
        value: {
          _debug: {
            requestId: mockAppStore.requestId,
            userId: mockAppStore.userId,
            language: mockAppStore.language,
          },
        },
      },
      ['TestController'],
    );
  });

  it('should invoke the verbose method with the expected data', () => {
    service.verbose('verbose message');
    expect(logger.verbose).toHaveBeenCalledWith(
      {
        message: 'verbose message',
        value: {
          _debug: {
            requestId: mockAppStore.requestId,
            userId: mockAppStore.userId,
            language: mockAppStore.language,
          },
        },
      },
      ['TestController'],
    );
  });
});
