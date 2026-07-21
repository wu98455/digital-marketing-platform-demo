// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';
import { demoCaptcha, useClientDemoMock } from '@/utils/demoMock';

/** 发送验证码 POST /api/login/captcha */
export async function getFakeCaptcha(
  params: {
    // query
    /** 手机号 */
    phone?: string;
  },
  options?: { [key: string]: any },
) {
  if (useClientDemoMock) {
    return demoCaptcha();
  }
  return request<API.FakeCaptcha>('/api/login/captcha', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
