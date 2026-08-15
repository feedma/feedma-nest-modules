import type { IPagination } from './pagination.interface';

/**
 * These are compile-time assertions. They run under `npm run typecheck`, not
 * under jest: ts-jest is configured with `isolatedModules`, so it transpiles
 * without type checking and every case below passes there regardless.
 */
describe('IPagination', () => {
  it('is satisfied by the six documented fields', () => {
    const pagination: IPagination = {
      totalItems: 47,
      itemsPerPage: 15,
      totalPages: 4,
      page: 2,
      firstPage: 1,
      lastPage: 4,
    };

    expect(pagination.totalPages).toBe(4);
  });

  it('admits null navigation fields for an empty result set', () => {
    const pagination: IPagination = {
      totalItems: 0,
      itemsPerPage: 15,
      totalPages: 0,
      page: 1,
      firstPage: null,
      lastPage: null,
    };

    expect(pagination.firstPage).toBeNull();
  });

  it('does not carry totalMatches', () => {
    const pagination: IPagination = {
      totalItems: 0,
      itemsPerPage: 15,
      totalPages: 0,
      page: 1,
      firstPage: null,
      lastPage: null,
      // @ts-expect-error totalMatches was removed from the contract.
      totalMatches: 0,
    };

    expect(pagination.totalItems).toBe(0);
  });
});
