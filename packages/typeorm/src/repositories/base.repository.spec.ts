import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import type { IPage } from '@feedma/nest-common';
import { BaseRepository, defaultPaginationOptions } from './base.repository';

class TestEntity {
  id: number;
  name: string;
}

/**
 * These cover the arithmetic and the dispatch: which branch runs, and what
 * offsets it asks for. Whether those offsets produce a correct page over a join
 * is a property of the database, and is covered in the integration spec.
 */

interface IQueryBuilderStub {
  skip: jest.Mock;
  take: jest.Mock;
  getManyAndCount: jest.Mock;
  getCount: jest.Mock;
}

function buildRepository(count = 0, items: TestEntity[] = []): BaseRepository<TestEntity> {
  const dataSource = {
    createEntityManager: jest.fn(),
  } as unknown as DataSource;
  const repository = new BaseRepository(TestEntity, dataSource);

  repository.findAndCount = jest.fn().mockResolvedValue([items, count]);
  repository.count = jest.fn().mockResolvedValue(count);

  return repository;
}

function buildQueryBuilder(count = 0, items: TestEntity[] = []): IQueryBuilderStub {
  // A plain object would fail the `instanceof SelectQueryBuilder` check and
  // silently fall through to the find options branch, paginating the whole table.
  const queryBuilder = Object.create(
    SelectQueryBuilder.prototype,
  ) as SelectQueryBuilder<TestEntity>;

  const stub = queryBuilder as unknown as IQueryBuilderStub;
  stub.skip = jest.fn().mockReturnValue(queryBuilder);
  stub.take = jest.fn().mockReturnValue(queryBuilder);
  stub.getManyAndCount = jest.fn().mockResolvedValue([items, count]);
  stub.getCount = jest.fn().mockResolvedValue(count);

  return stub;
}

describe('BaseRepository', () => {
  it('should be defined', () => {
    expect(BaseRepository).toBeDefined();
  });

  it('should return instanceof Repository', () => {
    const repository = buildRepository();

    expect(repository).toBeDefined();
    expect(repository).toBeInstanceOf(Repository);
  });

  describe('paginate', () => {
    it('offsets the given query builder by whole pages', async () => {
      const repository = buildRepository();
      const queryBuilder = buildQueryBuilder();

      await repository.paginate(queryBuilder as unknown as SelectQueryBuilder<TestEntity>, {
        page: 3,
        limit: 5,
      });

      expect(queryBuilder.skip).toHaveBeenCalledWith(10);
      expect(queryBuilder.take).toHaveBeenCalledWith(5);
      expect(queryBuilder.getManyAndCount).toHaveBeenCalled();
    });

    it('applies the default pagination params to the given query builder', async () => {
      const repository = buildRepository();
      const queryBuilder = buildQueryBuilder();

      await repository.paginate(queryBuilder as unknown as SelectQueryBuilder<TestEntity>);

      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(defaultPaginationOptions.limit);
    });

    it('paginates the repository itself when no query builder is given', async () => {
      const repository = buildRepository();

      await repository.paginate({ page: 2, limit: 10 }, { where: { id: 1 } });

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { id: 1 },
        skip: 10,
        take: 10,
      });
    });

    it('applies the default pagination params', async () => {
      const repository = buildRepository();

      await repository.paginate();

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: defaultPaginationOptions.limit,
      });
    });

    it('clamps a limit below one', async () => {
      const repository = buildRepository();

      await repository.paginate({ limit: 0 });

      expect(repository.findAndCount).toHaveBeenCalledWith({ skip: 0, take: 1 });
    });

    it('clamps a negative limit', async () => {
      const repository = buildRepository();

      await repository.paginate({ limit: -5 });

      expect(repository.findAndCount).toHaveBeenCalledWith({ skip: 0, take: 1 });
    });

    it('falls back to the default for an explicitly undefined field', async () => {
      const repository = buildRepository();

      await repository.paginate({ page: 2, limit: undefined });

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: defaultPaginationOptions.limit,
        take: defaultPaginationOptions.limit,
      });
    });

    it('returns the contract shape rather than the driver shape', async () => {
      const items = [{ id: 1, name: 'one' }];
      const repository = buildRepository(47, items);

      const page = await repository.paginate({ page: 2, limit: 15 });

      expect(page).toEqual({
        items,
        pagination: {
          totalItems: 47,
          itemsPerPage: 15,
          totalPages: 4,
          page: 2,
          firstPage: 1,
          lastPage: 4,
        },
      });
    });

    it('returns the contract shape for the query builder branch too', async () => {
      const items = [{ id: 1, name: 'one' }];
      const repository = buildRepository();
      const queryBuilder = buildQueryBuilder(47, items);

      const page = await repository.paginate(
        queryBuilder as unknown as SelectQueryBuilder<TestEntity>,
        { page: 2, limit: 15 },
      );

      expect(page).toEqual({
        items,
        pagination: {
          totalItems: 47,
          itemsPerPage: 15,
          totalPages: 4,
          page: 2,
          firstPage: 1,
          lastPage: 4,
        },
      });
    });

    it('does not clamp page, and counts rather than assuming, below page one', async () => {
      const repository = buildRepository(47);

      const page = await repository.paginate({ page: 0, limit: 15 });

      // No offset addresses a page below one, so the item query is skipped —
      // but the count still runs, or the contract would report an empty result
      // set for a populated table.
      expect(repository.findAndCount).not.toHaveBeenCalled();
      expect(repository.count).toHaveBeenCalled();
      expect(page.items).toEqual([]);
      expect(page.pagination.page).toBe(0);
      expect(page.pagination.firstPage).toBe(1);
      expect(page.pagination.lastPage).toBe(4);
    });

    it('counts the query builder without offsetting it below page one', async () => {
      const repository = buildRepository();
      const queryBuilder = buildQueryBuilder(47);

      const page = await repository.paginate(
        queryBuilder as unknown as SelectQueryBuilder<TestEntity>,
        { page: -1, limit: 15 },
      );

      expect(queryBuilder.skip).not.toHaveBeenCalled();
      expect(queryBuilder.getManyAndCount).not.toHaveBeenCalled();
      expect(queryBuilder.getCount).toHaveBeenCalled();
      expect(page.items).toEqual([]);
      expect(page.pagination.totalItems).toBe(47);
    });

    it('exposes the entity type in the returned page', async () => {
      const repository = buildRepository();

      const page: IPage<TestEntity> = await repository.paginate();

      expect(page.items).toEqual([]);
    });
  });
});
