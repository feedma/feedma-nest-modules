import { Test, TestingModule } from '@nestjs/testing';
import { AppInfoController } from './app-info.controller';
import { AppService } from '../services/app.service';

describe('AppInfoController', () => {
  let controller: AppInfoController;
  let appService: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppInfoController,
        {
          provide: AppService,
          useValue: {
            getInfo: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AppInfoController>(AppInfoController);
    appService = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('root', () => {
    it('should return the app info', () => {
      const response = {
        name: 'App name',
        version: '1.0.0',
        env: 'test',
      };
      jest.spyOn(appService, 'getInfo').mockReturnValue(response);

      expect(controller.index()).toStrictEqual(response);
    });
  });
});
