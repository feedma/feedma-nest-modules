import { ClsStore } from 'nestjs-cls';

type ILogData<TData extends ClsStore = ClsStore> = TData & {
  requestId?: string;
  userId?: string;
  language?: string;
};

export const mockAppStore: ILogData = {
  requestId: 'dd117294-b1c6-4c62-a41c-590d119c13ca',
  userId: 'f955bd8c-3ba0-4113-83de-cb4c2e171113',
  language: 'en',
};

export const clsGetterMockFactory =
  <TData extends ClsStore>(store?: TData) =>
  (key?: keyof ILogData<TData>): ILogData<TData>[keyof ILogData<TData>] =>
    (({ ...mockAppStore, ...store }) as ILogData<TData>)[key as keyof ILogData<TData>];
