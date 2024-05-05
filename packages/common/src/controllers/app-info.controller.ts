import { Controller, Get } from '@nestjs/common';
import { AppService } from '../services/app.service';

@Controller()
export class AppInfoController {
  constructor(protected appService: AppService) {}

  @Get()
  index() {
    return this.appService.getInfo();
  }
}
