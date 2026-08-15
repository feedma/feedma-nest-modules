export interface IPagination {
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  firstPage: number | null;
  lastPage: number | null;
  page: number;
}

export interface IPage<TData> {
  items: TData[];
  pagination: IPagination;
}
