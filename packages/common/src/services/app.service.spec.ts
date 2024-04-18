import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { APP_INFO_TOKEN } from '../constants/app.constants';
import { IAppInfo } from '../interfaces/app.interface';

describe('AppService', () => {
  let service: AppService;
  const mockedAppInfo: IAppInfo = {
    name: 'test',
    version: '1.0.0',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: APP_INFO_TOKEN,
          useValue: mockedAppInfo,
        },
      ],
    }).compile();

    service = await module.resolve<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should invoke the debug method with the expected data', () => {
    expect(service.getInfo()).toStrictEqual({
      env: 'test',
      name: 'test',
      version: '1.0.0',
    });
  });
});
