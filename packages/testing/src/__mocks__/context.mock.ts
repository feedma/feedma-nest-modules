import { of } from 'rxjs';
import { GraphQLExecutionContext } from '@nestjs/graphql/dist/services/gql-execution-context';
import { ArgumentsHost, CallHandler, ExecutionContext } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

export const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
};

export const httpArgumentHostMock: HttpArgumentsHost = {
  getRequest: jest.fn(),
  getResponse: jest.fn().mockReturnValue(mockResponse),
  getNext: jest.fn(),
};

export const argumentHostMock: ArgumentsHost = {
  getArgByIndex: jest.fn(),
  getArgs: jest.fn(),
  getType: jest.fn(),
  switchToHttp: jest.fn().mockReturnValue(httpArgumentHostMock),
  switchToRpc: jest.fn(),
  switchToWs: jest.fn(),
};

export const executionContextMock: ExecutionContext = {
  getArgByIndex: jest.fn().mockReturnThis(),
  getArgs: jest.fn().mockReturnThis(),
  getClass: jest.fn().mockReturnThis(),
  getHandler: jest.fn().mockReturnThis(),
  getType: jest.fn().mockReturnThis(),
  switchToRpc: jest.fn().mockReturnThis(),
  switchToWs: jest.fn().mockReturnThis(),
  switchToHttp: jest.fn().mockReturnValue(httpArgumentHostMock),
};

export const gqlExecutionContextMock: GraphQLExecutionContext = {
  ...executionContextMock,
  getRoot: jest.fn().mockReturnThis(),
  getContext: jest.fn().mockReturnValue(httpArgumentHostMock),
  getInfo: jest.fn().mockReturnThis(),
} as unknown as GraphQLExecutionContext;

export const callHandlerMock: CallHandler = {
  handle: jest.fn().mockReturnValue(of({})),
};
