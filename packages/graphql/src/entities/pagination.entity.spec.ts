import type { IPagination } from '@feedma/nest-common';
import { Pagination } from './pagination.entity';

describe('Pagination', () => {
  it('assigns the six contract fields', () => {
    const pagination = new Pagination({
      totalItems: 47,
      itemsPerPage: 15,
      totalPages: 4,
      page: 2,
      firstPage: 1,
      lastPage: 4,
    });

    expect(pagination.totalItems).toBe(47);
    expect(pagination.lastPage).toBe(4);
  });

  it('accepts the null navigation the interface permits', () => {
    // `implements IPagination` cannot catch this on its own: narrowing a
    // property to `number` is assignable to `number | null`, so the check only
    // runs in the harmless direction. The bite is backwards from the contract —
    // a caller assigning the null the interface allows gets a type error.
    // That bite only fires under `strictNullChecks`. This repository's root
    // `tsconfig.json` sets `strictNullChecks: false`, so the class does not
    // catch the assignment here either; the protection applies to a consumer
    // compiling with `strictNullChecks` on.
    const pagination: IPagination = new Pagination({
      totalItems: 0,
      itemsPerPage: 15,
      totalPages: 0,
      page: 1,
      firstPage: null,
      lastPage: null,
    });

    expect(pagination.firstPage).toBeNull();
  });
});
