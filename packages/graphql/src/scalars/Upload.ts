import { ValueNode } from 'graphql';
import { GraphQLUpload } from 'graphql-upload-ts';
import { Scalar } from '@nestjs/graphql';

@Scalar('Upload')
export class Upload {
  description = 'Upload custom scalar type';

  parseValue(value: unknown): unknown {
    return GraphQLUpload.parseValue(value);
  }

  serialize(value: unknown): unknown {
    return GraphQLUpload.serialize(value);
  }

  parseLiteral(ast: ValueNode): unknown {
    return GraphQLUpload.parseLiteral(ast);
  }
}
