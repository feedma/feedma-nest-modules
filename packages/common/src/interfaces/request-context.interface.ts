import { ClsStore } from 'nestjs-cls';

export interface IRequestContext extends ClsStore {
  language: string;
  requestId?: string;
  userId?: string;
}
