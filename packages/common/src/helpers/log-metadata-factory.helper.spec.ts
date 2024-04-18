import { ClsService } from 'nestjs-cls';
import { logMetadataFactory } from './log-metadata-factory.helper';
import { LogData } from '../interfaces/logger.interface';
import { AsyncLocalStorage } from 'node:async_hooks';

describe('logMetadataFactory', () => {
  let cls: ClsService<LogData>;

  beforeEach(() => {
    const als = new AsyncLocalStorage();
    cls = new ClsService<LogData>(als);
  });

  it('should return correct result', async () => {
    await cls.runWith({} as LogData, async () => {
      cls.set('requestId', 'some-request-id');
      cls.set('userId', 'some-user-id');
      cls.set('language', 'en');

      const result = logMetadataFactory(cls);

      expect(result).toEqual({
        requestId: 'some-request-id',
        userId: 'some-user-id',
        language: 'en',
      });
    });
  });

  it('should return correct result even if more data exists in the context', async () => {
    await cls.runWith({} as LogData & { other: string }, async () => {
      cls.set('requestId', 'some-request-id');
      cls.set('userId', 'some-user-id');
      cls.set('language', 'en');
      cls.set('other', 'value');

      const result = logMetadataFactory(cls);

      expect(result).toEqual({
        requestId: 'some-request-id',
        userId: 'some-user-id',
        language: 'en',
      });
    });
  });
});
