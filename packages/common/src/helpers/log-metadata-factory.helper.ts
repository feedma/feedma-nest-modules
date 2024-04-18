import { ClsService } from 'nestjs-cls';
import { LogData } from '../interfaces/logger.interface';

export function logMetadataFactory(cls: ClsService<Partial<LogData>>): Partial<LogData> {
  return {
    requestId: cls.get('requestId'),
    userId: cls.get('userId'),
    language: cls.get('language'),
  };
}
