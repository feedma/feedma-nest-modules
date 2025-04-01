import * as uuidModule from 'uuid';
import { ClsModule, ClsService } from 'nestjs-cls';
import { Test, TestingModule } from '@nestjs/testing';
import { callHandlerMock, executionContextMock } from '@feedma/nest-testing';
import { LoggerService } from '../services/logger.service';
import { RequestInterceptor } from './request.interceptor';
import { IRequestContext } from '../interfaces/request-context.interface';
import { useContextRequest } from '../helpers/use-context-request.helper';

jest.mock('../helpers/use-context-request.helper');
jest.mock('uuid', () => ({ v4: jest.fn(() => '5a470513-7316-493b-b0bc-ce13dc16f543') }));

describe('RequestInterceptor', () => {
  let interceptor: RequestInterceptor;
  let cls: ClsService<IRequestContext>;
  const UUID = '5a470513-7316-493b-b0bc-ce13dc16f543';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClsModule],
      providers: [
        RequestInterceptor,
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    interceptor = module.get<RequestInterceptor>(RequestInterceptor);
    cls = module.get<ClsService<IRequestContext>>(ClsService);
    // UUID is already mocked in the jest.mock call above
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should set the request id if not given', async () => {
    const request = {
      headers: {},
    };
    jest.spyOn(cls, 'set');
    (useContextRequest as jest.Mock).mockReturnValue(request);

    await cls.runWith({} as IRequestContext, async () => {
      await interceptor.intercept(executionContextMock, callHandlerMock);
    });

    expect(cls.set).toHaveBeenCalledWith('requestId', UUID);
  });

  it('should set the request id if given as header', async () => {
    const headerUuid = 'e0a9d73b-5167-48d6-9801-e5350b67deb1';
    const request = {
      headers: {
        'x-request-id': headerUuid,
      },
    };
    jest.spyOn(cls, 'set');
    (useContextRequest as jest.Mock).mockReturnValue(request);

    await cls.runWith({} as IRequestContext, async () => {
      await interceptor.intercept(executionContextMock, callHandlerMock);
    });

    expect(cls.set).toHaveBeenCalledWith('requestId', headerUuid);
  });

  it('should set language', async () => {
    const request = {
      headers: {
        'accept-language': 'pt',
      },
    };
    jest.spyOn(cls, 'set');
    (useContextRequest as jest.Mock).mockReturnValue(request);

    await cls.runWith({} as IRequestContext, async () => {
      await interceptor.intercept(executionContextMock, callHandlerMock);
    });

    expect(cls.set).toHaveBeenCalledWith('language', 'pt');
  });

  it('should set default language if no language was received', async () => {
    const request = {
      headers: {},
    };
    jest.spyOn(cls, 'set');
    (useContextRequest as jest.Mock).mockReturnValue(request);
    await cls.runWith({} as IRequestContext, async () => {
      await interceptor.intercept(executionContextMock, callHandlerMock);
    });

    expect(cls.set).toHaveBeenCalledWith('language', 'en');
  });
});
