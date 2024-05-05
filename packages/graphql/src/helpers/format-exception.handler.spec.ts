import { GraphQLError } from 'graphql';
import { formatException } from './format-exception.helper';
import { Exception } from '@feedma/nest-common';

describe('formatException', () => {
  class TestException extends Exception {
    code = 'NEW_CODE';
    status = 401;
    defaultMessage = 'error message';
  }

  it('should return formatted error with code from extensions', () => {
    const formattedError = {
      message: 'error message',
      path: ['path'],
      locations: [{ line: 1, column: 1 }],
      extensions: { code: 'CODE' },
    };
    const error = new Error('error message');
    expect(formatException(formattedError, error)).toEqual({
      code: 'CODE',
      message: 'error message',
      path: ['path'],
      locations: [{ line: 1, column: 1 }],
    });
  });

  it('should return formatted error with code from originalError', () => {
    const formattedError = {
      message: 'error message',
      path: ['path'],
      locations: [{ line: 1, column: 1 }],
      extensions: { code: 'CODE' },
    };
    const error = new GraphQLError('error message', { originalError: new TestException() });
    expect(formatException(formattedError, error)).toEqual({
      code: 'NEW_CODE',
      message: 'error message',
      path: ['path'],
      locations: [{ line: 1, column: 1 }],
    });
  });

  it('should return formatted error with code from error', () => {
    const formattedError = {
      message: 'error message',
      path: ['path'],
      locations: [{ line: 1, column: 1 }],
      extensions: { code: 'CODE' },
    };
    const error = new TestException();
    expect(formatException(formattedError, error)).toEqual({
      code: 'NEW_CODE',
      message: 'error message',
      path: ['path'],
      locations: [{ line: 1, column: 1 }],
    });
  });
});
