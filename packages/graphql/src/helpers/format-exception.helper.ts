import { Exception } from '@feedma/nest-common';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

export function formatException(formattedError: GraphQLFormattedError, error: unknown) {
  const { extensions, ...rest } = formattedError;
  let code = extensions.code;
  let message = extensions.message;

  if (error instanceof GraphQLError) {
    const isException = error.originalError instanceof Exception;
    code = isException ? error.originalError.code : code;
    message = isException ? error.originalError.message : message;
  }

  if (error instanceof Exception) {
    code = error.code;
    message = error.message;
  }

  return {
    code,
    message,
    ...rest,
  };
}
