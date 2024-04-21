import { ClsStore } from 'nestjs-cls';

export interface IBaseLogData {
  requestId: string;
  userId?: string;
  language?: string;
}

export type LogData<TData extends IBaseLogData = IBaseLogData> = Partial<IBaseLogData & TData>;

export type LogMetadataFactory<TData extends ClsStore = LogData> = () => TData;
