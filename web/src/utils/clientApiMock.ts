import { resolveDemoApi } from './demoApiRouter';

type DemoRequestConfig = {
  url?: string;
  method?: string;
  params?: Record<string, any>;
  data?: any;
  [key: string]: any;
};

type DemoResponse = {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: DemoRequestConfig;
};

/**
 * 演示接口统一走本地路由（含系统管理 localStorage 用户表），
 * 保证开发 / Pages 生产与审批校验共用同一份用户配置。
 */
export function createDemoApiAdapter() {
  return async (config: DemoRequestConfig): Promise<DemoResponse> => {
    const data = resolveDemoApi({
      url: config.url,
      method: config.method,
      params: config.params,
      data: config.data,
    });
    if (data == null) {
      const error: any = new Error('Demo API not found');
      error.response = { status: 404, data: { success: false }, config };
      error.config = config;
      error.isAxiosError = true;
      throw error;
    }
    return {
      data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  };
}

export { useClientDemoMock } from './demoMock';
