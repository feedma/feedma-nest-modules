import { IPagination } from '@feedma/nest-common';

/**
 * What a paginated query knows once it has run: the page it was asked for, the
 * size it was asked for, and how many rows matched.
 */
export interface IPaginationCounts {
  totalItems: number;
  page: number;
  limit: number;
}

/**
 * Builds the pagination contract from a counted result.
 *
 * `limit` is assumed to be at least one — the caller clamps it — because a page
 * size of zero has no honest `totalPages`.
 */
export function toPagination({ totalItems, page, limit }: IPaginationCounts): IPagination {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    totalItems,
    itemsPerPage: limit,
    totalPages,
    // Emptiness is a property of the result set, not of the page: a caller past
    // the last page still needs to know where to navigate back to.
    firstPage: totalItems > 0 ? 1 : null,
    lastPage: totalItems > 0 ? totalPages : null,
    page,
  };
}
