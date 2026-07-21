import { useClientDemoMock } from './demoMock';
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

/** GitHub Pages 等无后端环境：用本地路由替代真实 HTTP */
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

export { useClientDemoMock };
