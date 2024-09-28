import { DataSource, Repository } from 'typeorm';
import { BaseRepository } from './base.repository';

describe('BaseRepository', () => {
  it('should be defined', () => {
    expect(BaseRepository).toBeDefined();
  });

  it('should return instanceof Repository', () => {
    const mockDataSource = {
      createEntityManager: jest.fn(),
    } as unknown as DataSource;
    class TestEntity {}
    const repo = new BaseRepository(TestEntity, mockDataSource);
    expect(repo).toBeDefined();
    expect(repo).toBeInstanceOf(Repository);
  });
});
