import { HttpStatus } from '@nestjs/common';

export function isSuccessHttpCode(statusCode: number): boolean {
  return statusCode >= HttpStatus.OK && statusCode < HttpStatus.AMBIGUOUS;
}
