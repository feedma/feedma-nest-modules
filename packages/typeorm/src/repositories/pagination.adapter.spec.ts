import { toPagination } from './pagination.adapter';

describe('toPagination', () => {
  it('derives the contract from the counted result', () => {
    expect(toPagination({ totalItems: 47, page: 2, limit: 15 })).toEqual({
      totalItems: 47,
      itemsPerPage: 15,
      totalPages: 4,
      page: 2,
      firstPage: 1,
      lastPage: 4,
    });
  });

  it('reports no navigation for an empty result set', () => {
    const pagination = toPagination({ totalItems: 0, page: 1, limit: 15 });

    expect(pagination.totalPages).toBe(0);
    expect(pagination.firstPage).toBeNull();
    expect(pagination.lastPage).toBeNull();
  });

  it('keeps navigation when the page is out of range but the result set is not empty', () => {
    // The rule keys off totalItems, never items.length. A caller asking for page
    // 99 of four gets no items but must still learn that page 4 exists.
    expect(toPagination({ totalItems: 47, page: 99, limit: 15 })).toEqual({
      totalItems: 47,
      itemsPerPage: 15,
      totalPages: 4,
      page: 99,
      firstPage: 1,
      lastPage: 4,
    });
  });

  it('keeps navigation for a page below one', () => {
    // Out of range in the other direction is the same case: the page cannot be
    // served, and the result set is still populated.
    const pagination = toPagination({ totalItems: 47, page: 0, limit: 15 });

    expect(pagination.page).toBe(0);
    expect(pagination.firstPage).toBe(1);
    expect(pagination.lastPage).toBe(4);
  });

  it('counts a partial last page as a page', () => {
    expect(toPagination({ totalItems: 31, page: 1, limit: 15 }).totalPages).toBe(3);
  });

  it('reports one page when the result set fits exactly', () => {
    expect(toPagination({ totalItems: 15, page: 1, limit: 15 }).totalPages).toBe(1);
  });
});
