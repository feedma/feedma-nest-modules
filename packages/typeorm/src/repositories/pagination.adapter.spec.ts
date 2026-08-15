import { IPaginationMeta } from 'nestjs-typeorm-paginate';
import { toPagination } from './pagination.adapter';

function buildMeta(overrides: Partial<IPaginationMeta> = {}): IPaginationMeta {
  return {
    itemCount: 15,
    totalItems: 47,
    itemsPerPage: 15,
    totalPages: 4,
    currentPage: 2,
    ...overrides,
  };
}

describe('toPagination', () => {
  it('maps the paginator meta onto the contract', () => {
    expect(toPagination(buildMeta())).toEqual({
      totalItems: 47,
      itemsPerPage: 15,
      totalPages: 4,
      page: 2,
      firstPage: 1,
      lastPage: 4,
    });
  });

  it('reports no navigation for an empty result set', () => {
    const pagination = toPagination(
      buildMeta({ itemCount: 0, totalItems: 0, totalPages: 0, currentPage: 1 }),
    );

    expect(pagination.firstPage).toBeNull();
    expect(pagination.lastPage).toBeNull();
  });

  it('keeps navigation when the page is out of range but the result set is not empty', () => {
    // The rule keys off totalItems, never items.length. A caller asking for page
    // 99 of four gets no items but must still learn that page 4 exists.
    const pagination = toPagination(buildMeta({ itemCount: 0, currentPage: 99 }));

    expect(pagination).toEqual({
      totalItems: 47,
      itemsPerPage: 15,
      totalPages: 4,
      page: 99,
      firstPage: 1,
      lastPage: 4,
    });
  });
});
