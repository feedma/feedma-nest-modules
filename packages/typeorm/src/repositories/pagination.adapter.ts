import { IPaginationMeta } from 'nestjs-typeorm-paginate';
import { IPagination } from '@feedma/nest-common';

/**
 * The only place in this package that names a nestjs-typeorm-paginate type.
 * Deliberately absent from the package index: replacing the paginator must not
 * be a breaking change for consumers.
 */
export function toPagination(meta: IPaginationMeta): IPagination {
  const { totalItems, totalPages } = meta;

  return {
    totalItems,
    itemsPerPage: meta.itemsPerPage,
    totalPages,
    // Emptiness is a property of the result set, not of the page: a caller past
    // the last page still needs to know where to navigate back to.
    firstPage: totalItems > 0 ? 1 : null,
    lastPage: totalItems > 0 ? totalPages : null,
    page: meta.currentPage,
  };
}
