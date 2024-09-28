import { EntityRepository } from './repository-type.helper';

describe('EntityRepository', () => {
  it('should be defined', () => {
    expect(EntityRepository).toBeDefined();
  });

  it('should return instanceof BaseRepository', () => {
    class TestEntity {}
    const repo = EntityRepository(TestEntity);
    expect(repo).toBeDefined();
    expect(repo).toBeInstanceOf(Function);
  });
});
