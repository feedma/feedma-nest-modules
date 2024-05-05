import { Type } from '@nestjs/common';
import { Field, ObjectType } from '@nestjs/graphql';
import { IPage, IPagination } from '@feedma/nest-common';

@ObjectType()
export class Pagination implements IPagination {
  @Field()
  totalItems: number;

  @Field()
  totalMatches: number;

  @Field()
  itemsPerPage: number;

  @Field()
  totalPages: number;

  @Field({ nullable: true })
  firstPage: number;

  @Field({ nullable: true })
  lastPage: number;

  @Field()
  page: number;

  constructor(attributes: Pagination) {
    Object.assign(this, attributes);
  }
}

export function PaginatedResult<TItemType>(ItemType: Type<TItemType>): Type<IPage<TItemType>> {
  @ObjectType()
  class Page<TItems = TItemType> implements IPage<TItems> {
    @Field(() => [ItemType])
    items: TItems[];

    @Field(() => Pagination)
    pagination: Pagination;

    constructor(attributes?: IPage<TItems>) {
      Object.assign(this, attributes);
    }
  }

  return Page as Type<IPage<TItemType>>;
}
