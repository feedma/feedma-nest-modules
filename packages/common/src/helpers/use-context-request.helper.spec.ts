import { GqlExecutionContext } from '@nestjs/graphql';
import {
  executionContextMock,
  gqlExecutionContextMock,
  httpArgumentHostMock,
} from '@feedma/nest-testing';
import { useContextRequest } from './use-context-request.helper';

describe('useContextRequest()', () => {
  it('should be a function', () => {
    expect(useContextRequest).toBeFunction();
  });

  it('should return the request from http context if context type is http', async () => {
    const httpRequest = {};
    jest.spyOn(executionContextMock, 'getType').mockReturnValue('http');
    jest.spyOn(httpArgumentHostMock, 'getRequest').mockReturnValue(httpRequest);

    expect(await useContextRequest(executionContextMock)).toBe(httpRequest);
  });

  it('should return the request from graphql context if context type is http', async () => {
    const gqlRequest = {};
    const gqlContext = { req: gqlRequest };
    jest.spyOn(executionContextMock, 'getType').mockReturnValue('graphql');
    jest.spyOn(gqlExecutionContextMock, 'getContext').mockReturnValue(gqlContext);
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(gqlExecutionContextMock);

    expect(await useContextRequest(executionContextMock)).toBe(gqlRequest);
  });
});
