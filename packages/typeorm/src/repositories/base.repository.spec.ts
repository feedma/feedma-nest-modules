import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import type { Pagination } from 'nestjs-typeorm-paginate';
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

// Builds the value the mocked `paginate` resolves to. This is a `Pagination`, the
// shape nestjs-typeorm-paginate returns — not the `IPage` shape from nest-common.
function buildPagination(items: TestEntity[]): Pagination<TestEntity> {
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
  } as unknown as Pagination<TestEntity>;
}

describe('BaseRepository', () => {
  beforeEach(() => {
    paginateMock.mockReset();
    paginateMock.mockResolvedValue(buildPagination([]));
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

    it('applies the default pagination options to the given query builder', async () => {
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

    it('applies the default pagination options when paginating the repository itself', async () => {
      const repository = buildRepository();

      await repository.paginate();

      expect(paginateMock).toHaveBeenCalledWith(repository, defaultPaginationOptions, undefined);
    });

    it('resolves a single promise, not a nested one', async () => {
      const repository = buildRepository();
      const pagination = buildPagination([]);
      paginateMock.mockResolvedValue(pagination);

      await expect(repository.paginate()).resolves.toBe(pagination);
    });

    it('exposes the entity type in the paginated result', async () => {
      const repository = buildRepository();
      const entity = new TestEntity();
      paginateMock.mockResolvedValue(buildPagination([entity]));

      // Compile-time guard: callers must get `TestEntity[]`, not `unknown[]`.
      const result: Pagination<TestEntity> = await repository.paginate();
      const items: TestEntity[] = result.items;

      expect(items).toEqual([entity]);
    });
  });
});
