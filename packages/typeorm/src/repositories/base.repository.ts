import {
  Repository,
  EntityTarget,
  DataSource,
  DeepPartial,
  FindOptionsWhere,
  ObjectLiteral,
  SelectQueryBuilder,
  FindManyOptions,
} from 'typeorm';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { IPage, IPaginationParams } from '@feedma/nest-common';
import { toPagination } from './pagination.adapter';

export type ID = number | string;
export const defaultPaginationOptions = {
  limit: 15,
  page: 1,
};

/**
 * `IPaginationParams` cannot express `countQueries`, `route` or `routingLabels`,
 * which is deliberate: the first would leave the counts undefined and make the
 * contract dishonest, and the other two only feed links the contract does not
 * carry.
 *
 * `limit` is clamped because there is no honest result for a page size of zero —
 * `totalPages` would be `Infinity`. `page` is deliberately not clamped: silently
 * correcting it would hide a caller's error.
 */
function toPaginateOptions(params?: IPaginationParams): IPaginationOptions {
  const page = params?.page ?? defaultPaginationOptions.page;
  const limit = params?.limit ?? defaultPaginationOptions.limit;

  return { page, limit: Math.max(1, limit) };
}

export class BaseRepository<Entity> extends Repository<Entity> {
  constructor(target: EntityTarget<Entity>, dataSource: DataSource) {
    super(target, dataSource.createEntityManager());
  }

  paginate(
    queryBuilder?: SelectQueryBuilder<Entity>,
    params?: IPaginationParams,
  ): Promise<IPage<Entity>>;

  paginate(
    params?: IPaginationParams,
    findOptions?: FindOptionsWhere<Entity> | FindManyOptions<Entity>,
  ): Promise<IPage<Entity>>;

  async paginate(
    target?: SelectQueryBuilder<Entity> | IPaginationParams,
    customOptions?: IPaginationParams | FindOptionsWhere<Entity> | FindManyOptions<Entity>,
  ): Promise<IPage<Entity>> {
    //TODO: make defaultPaginationOptions configurable form outside
    if (target instanceof SelectQueryBuilder) {
      const result = await paginate<Entity>(
        target,
        toPaginateOptions(customOptions as IPaginationParams),
      );

      return { items: result.items, pagination: toPagination(result.meta) };
    }

    const result = await paginate<Entity>(
      this,
      toPaginateOptions(target),
      customOptions as FindOptionsWhere<Entity> | FindManyOptions<Entity>,
    );

    return { items: result.items, pagination: toPagination(result.meta) };
  }

  async findOneByIdOrFail(id: ID): Promise<Entity | null> {
    return this.findOneByOrFail({ id } as FindOptionsWhere<ObjectLiteral>);
  }

  async createOne(data: DeepPartial<Entity>): Promise<Entity> {
    const entity = this.create(data);
    return this.save(entity);
  }

  async createMany(data: DeepPartial<Entity>[]): Promise<Entity[]> {
    const entities = data.map((item) => this.create(item));
    return this.save(entities);
  }

  async updateOneById(id: ID, data: DeepPartial<Entity>): Promise<Entity> {
    const entity = await this.preload({ id, ...data });
    return this.save(entity, { reload: true });
  }

  async deleteOneById(id: ID): Promise<void> {
    await this.delete({ id } as unknown as FindOptionsWhere<ObjectLiteral>);
  }
}
