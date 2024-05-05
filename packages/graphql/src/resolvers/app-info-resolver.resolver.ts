import { Query, Resolver } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-scalars';
import { AppService } from '@feedma/nest-common';

@Resolver()
export class AppInfoResolver {
  constructor(protected appService: AppService) {}

  @Query(() => GraphQLJSONObject)
  appInfo(): Record<string, unknown> {
    return this.appService.getInfo();
  }
}
