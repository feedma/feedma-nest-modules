import { IPaginationParams } from '@feedma/nest-common';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class PaginationParamsInput implements IPaginationParams {
  @Field({ nullable: true, defaultValue: 1 })
  page: number;

  @Field({ nullable: true, defaultValue: 10 })
  limit: number;
}
