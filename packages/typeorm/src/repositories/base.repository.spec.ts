import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import type { IPage } from '@feedma/nest-common';
import { BaseRepository, defaultPaginationOptions } from './base.repository';

jest.mock('nestjs-typeorm-paginate', () => ({
  paginate: jest.fn(),
}));

const paginateMock = paginate as unknown as jest.Mock;

class TestEntity {
  id: number;
  name: string;
}

function buildRepository(): BaseRepository<TestEntity> {
  const dataSource = {
    createEntityManager: jest.fn(),
  } as unknown as DataSource;

  return new BaseRepository(TestEntity, dataSource);
}

function buildResult(items: TestEntity[]) {
  return {
    items,
    meta: {
      itemCount: items.length,
      totalItems: items.length,
      itemsPerPage: defaultPaginationOptions.limit,
      totalPages: 1,
      currentPage: defaultPaginationOptions.page,
    },
    links: {},
  };
}

describe('BaseRepository', () => {
  beforeEach(() => {
    paginateMock.mockReset();
    paginateMock.mockResolvedValue(buildResult([]));
  });

  it('should be defined', () => {
    expect(BaseRepository).toBeDefined();
  });

  it('should return instanceof Repository', () => {
    const repository = buildRepository();

    expect(repository).toBeDefined();
    expect(repository).toBeInstanceOf(Repository);
  });

  describe('paginate', () => {
    it('paginates the given query builder', async () => {
      const repository = buildRepository();
      // A plain object would fail the `instanceof SelectQueryBuilder` check and
      // silently fall through to the find options branch, paginating the whole table.
      const queryBuilder = Object.create(
        SelectQueryBuilder.prototype,
      ) as SelectQueryBuilder<TestEntity>;

      await repository.paginate(queryBuilder, { page: 3, limit: 5 });

      expect(paginateMock).toHaveBeenCalledWith(queryBuilder, { page: 3, limit: 5 });
    });

    it('applies the default pagination params to the given query builder', async () => {
      const repository = buildRepository();
      const queryBuilder = Object.create(
        SelectQueryBuilder.prototype,
      ) as SelectQueryBuilder<TestEntity>;

      await repository.paginate(queryBuilder);

      expect(paginateMock).toHaveBeenCalledWith(queryBuilder, defaultPaginationOptions);
    });

    it('paginates the repository itself when no query builder is given', async () => {
      const repository = buildRepository();
      const findOptions = { where: { id: 1 } };

      await repository.paginate({ page: 2, limit: 10 }, findOptions);

      expect(paginateMock).toHaveBeenCalledWith(repository, { page: 2, limit: 10 }, findOptions);
    });

    it('applies the default pagination params', async () => {
      const repository = buildRepository();

      await repository.paginate();

      expect(paginateMock).toHaveBeenCalledWith(repository, defaultPaginationOptions, undefined);
    });

    it('clamps a limit below one', async () => {
      const repository = buildRepository();

      await repository.paginate({ limit: 0 });

      expect(paginateMock).toHaveBeenCalledWith(repository, { page: 1, limit: 1 }, undefined);
    });

    it('clamps a negative limit', async () => {
      const repository = buildRepository();

      await repository.paginate({ limit: -5 });

      expect(paginateMock).toHaveBeenCalledWith(repository, { page: 1, limit: 1 }, undefined);
    });

    it('falls back to the default for an explicitly undefined field', async () => {
      const repository = buildRepository();

      await repository.paginate({ page: 2, limit: undefined });

      expect(paginateMock).toHaveBeenCalledWith(repository, { page: 2, limit: 15 }, undefined);
    });

    it('returns the contract shape rather than the paginator shape', async () => {
      const repository = buildRepository();
      const entity = new TestEntity();
      paginateMock.mockResolvedValue(buildResult([entity]));

      const page = await repository.paginate();

      expect(page).toEqual({
        items: [entity],
        pagination: {
          totalItems: 1,
          itemsPerPage: 15,
          totalPages: 1,
          page: 1,
          firstPage: 1,
          lastPage: 1,
        },
      });
    });

    it('returns the contract shape for the query builder branch too', async () => {
      const repository = buildRepository();
      const entity = new TestEntity();
      paginateMock.mockResolvedValue(buildResult([entity]));
      const queryBuilder = Object.create(
        SelectQueryBuilder.prototype,
      ) as SelectQueryBuilder<TestEntity>;

      const page = await repository.paginate(queryBuilder);

      expect(page).toEqual({
        items: [entity],
        pagination: {
          totalItems: 1,
          itemsPerPage: 15,
          totalPages: 1,
          page: 1,
          firstPage: 1,
          lastPage: 1,
        },
      });
    });

    it('does not clamp page', async () => {
      const repository = buildRepository();

      await repository.paginate({ page: 0 });

      expect(paginateMock).toHaveBeenCalledWith(repository, { page: 0, limit: 15 }, undefined);
    });

    it('exposes the entity type in the returned page', async () => {
      const repository = buildRepository();
      const entity = new TestEntity();
      paginateMock.mockResolvedValue(buildResult([entity]));

      // Compile-time guard: callers must get `TestEntity[]`, not `unknown[]`.
      const page: IPage<TestEntity> = await repository.paginate();
      const items: TestEntity[] = page.items;

      expect(items).toEqual([entity]);
    });
  });
});
