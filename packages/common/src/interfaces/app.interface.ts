export interface IAppDebugOptions {
  enabled?: boolean;
}

export interface IAppInfo {
  name: string;
  version: string;
  port?: number;
  debug?: IAppDebugOptions;
}

export interface IAppConfig extends IAppInfo {}
