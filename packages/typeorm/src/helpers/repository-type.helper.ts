import { DataSource, DataSourceOptions } from 'typeorm';
import { Type } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { BaseRepository } from '../repositories/base.repository';

export function EntityRepository<Entity>(
  entity: Type<Entity>,
  dataSourceOptions?: DataSource | DataSourceOptions | string,
): Type<BaseRepository<Entity>> {
  class Repo<T = Entity> extends BaseRepository<T> {
    constructor(@InjectDataSource(dataSourceOptions) dataSource: DataSource) {
      super(entity, dataSource);
    }
  }

  return Repo as unknown as Type<BaseRepository<Entity>>;
}
