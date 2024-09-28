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

export type ID = number | string;
export const defaultPaginationOptions = {
  limit: 15,
  page: 1,
};

export class BaseRepository<Entity> extends Repository<Entity> {
  constructor(target: EntityTarget<Entity>, dataSource: DataSource) {
    super(target, dataSource.createEntityManager());
  }

  paginate(
    queryBuilder?: SelectQueryBuilder<Entity>,
    paginationOptions?: IPaginationOptions,
  ): Promise<ReturnType<typeof paginate>>;

  paginate(
    paginationOptions?: IPaginationOptions,
    findOptions?: FindOptionsWhere<Entity> | FindManyOptions<Entity>,
  ): Promise<ReturnType<typeof paginate>>;

  async paginate(
    target?: SelectQueryBuilder<Entity> | IPaginationOptions,
    customOptions?: IPaginationOptions | FindOptionsWhere<Entity> | FindManyOptions<Entity>,
  ): Promise<ReturnType<typeof paginate>> {
    //TODO: make defaultPaginationOptions configurable form outside
    if (target instanceof SelectQueryBuilder) {
      return paginate(target, { ...defaultPaginationOptions, ...customOptions });
    }

    return paginate(
      this,
      { ...defaultPaginationOptions, ...target } as IPaginationOptions,
      customOptions as FindOptionsWhere<Entity> | FindManyOptions<Entity>,
    );
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
