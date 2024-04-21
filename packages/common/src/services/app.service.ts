import { Inject, Injectable } from '@nestjs/common';
import { APP_INFO_TOKEN } from '../constants/app.constants';
import { IAppInfo } from '../interfaces/app.interface';

@Injectable()
export class AppService {
  constructor(@Inject(APP_INFO_TOKEN) private appInfo: IAppInfo) {}

  getInfo() {
    return {
      name: this.appInfo.name,
      version: this.appInfo.version,
      env: process.env.NODE_ENV,
    };
  }
}
