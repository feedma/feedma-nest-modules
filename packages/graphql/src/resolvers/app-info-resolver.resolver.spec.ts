import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from '@feedma/nest-common';
import { AppInfoResolver } from './app-info-resolver.resolver';

describe('AppInfoResolver', () => {
  let resolver: AppInfoResolver;
  let appService: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppInfoResolver,
        {
          provide: AppService,
          useValue: {
            getInfo: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<AppInfoResolver>(AppInfoResolver);
    appService = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('root', () => {
    it('should return the app info', () => {
      const response = {
        name: 'App name',
        version: '1.0.0',
        env: 'test',
      };
      jest.spyOn(appService, 'getInfo').mockReturnValue(response);

      expect(resolver.appInfo()).toStrictEqual(response);
    });
  });
});
