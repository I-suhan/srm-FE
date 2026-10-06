import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { request as apiRequest, getIntl, history } from '@umijs/max';
import { message, notification } from 'antd';
import { clearTokens, refreshAccessToken } from '@/utils/auth';

// 错误处理方案： 错误类型
enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}
// 与后端约定的响应数据格式
interface BackendResult {
  code: number;
  msg?: string | null;
  data?: unknown;
  errorCode?: string | null;
  errorMsg?: string | null;
}

interface BizErrorInfo {
  errorCode?: string | null;
  errorMessage?: string;
  showType?: ErrorShowType;
  data?: unknown;
}

// 错误类型
type RequestError = Error & {
  response?: {
    status?: number;
    data?: any;
  };
  request?: any;
  config?: RequestOptions & {
    _retry?: boolean;
  };
};

/**
 * @name 错误处理
 * pro 自带的错误处理， 可以在这里做自己的改动
 * @doc https://umijs.org/docs/max/request#配置
 */
export const errorConfig: RequestConfig = {
  // 错误处理： umi@3 的错误处理方案。
  errorConfig: {
    // 错误抛出
    errorThrower: (res) => {
      const result = res as BackendResult;

      // HTTP 200 + 后端业务成功
      if (result.code === 200) {
        return;
      }

      const error: any = new Error(result.errorMsg || result.msg || '请求失败');

      error.name = 'BizError';

      error.info = {
        errorCode: result.errorCode,
        errorMessage: result.errorMsg || result.msg || '请求失败',
        showType: ErrorShowType.ERROR_MESSAGE,
        data: result.data,
      };

      throw error;
    },
    // 错误接收及处理
    errorHandler: async (error: any, opts: any) => {
      if (opts?.skipErrorHandler) {
        throw error;
      }

      // =============================
      // 401：Access Token 过期
      // =============================
      if (error?.response?.status === 401) {
        const originalConfig = error.response.config as RequestOptions & {
          _retry?: boolean;
        };

        // refresh 请求自身失败
        if (originalConfig?.url?.includes('/auth/refresh')) {
          clearTokens();

          if (history.location.pathname !== '/user/login') {
            history.replace('/user/login');
          }

          throw error;
        }

        // 防止无限重试
        if (originalConfig?._retry) {
          clearTokens();

          if (history.location.pathname !== '/user/login') {
            history.replace('/user/login');
          }

          throw error;
        }

        // 标记这个请求已经 retry 过
        originalConfig._retry = true;

        try {
          // 多个 401 会共享这里的 Promise
          await refreshAccessToken();

          // refreshAccessToken 已经把新的
          // access_token / refresh_token 写入 localStorage
          //
          // 重新发请求时，request interceptor
          // 会自动读取新的 access_token
          return await apiRequest(originalConfig.url!, originalConfig);
        } catch (refreshError) {
          clearTokens();

          const { pathname, search, hash } = history.location;

          if (pathname !== '/user/login') {
            history.replace(
              `/user/login?redirect=${encodeURIComponent(
                pathname + search + hash,
              )}`,
            );
          }

          throw refreshError;
        }
      }

      // =============================
      // 业务错误
      // =============================
      if (error.name === 'BizError') {
        const errorInfo: BizErrorInfo | undefined = error.info;

        if (errorInfo) {
          const { errorMessage, errorCode } = errorInfo;

          switch (errorInfo.showType) {
            case ErrorShowType.SILENT:
              break;

            case ErrorShowType.WARN_MESSAGE:
              message.warning(errorMessage);
              break;

            case ErrorShowType.ERROR_MESSAGE:
              message.error(errorMessage);
              break;

            case ErrorShowType.NOTIFICATION:
              notification.open({
                message: errorCode,
                description: errorMessage,
              });
              break;

            case ErrorShowType.REDIRECT:
              history.replace('/user/login');
              break;

            default:
              message.error(errorMessage);
          }
        }

        return;
      }

      // =============================
      // 其他 Axios HTTP 错误
      // =============================
      if (error?.response) {
        message.error(`Response status:${error.response.status}`);
        return;
      }

      // =============================
      // 网络断开
      // =============================
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        message.error(
          getIntl().formatMessage({
            id: 'app.request.offline',
            defaultMessage:
              'Network unavailable. Please check your connection and try again.',
          }),
        );
        return;
      }

      // =============================
      // 请求发出但没有响应
      // =============================
      if (error?.request) {
        message.error('None response! Please retry.');
        return;
      }

      message.error('Request error, please retry.');
    },
  },

  // 请求拦截器
  requestInterceptors: [
    (config: RequestOptions) => {
      // 拦截请求配置，进行个性化处理。
      // 示例：为请求附加 token（按需启用）
      // const token = localStorage.getItem('token');
      // if (token) {
      //   config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
      // }
      return config;
    },
  ],

  // 响应拦截器
  responseInterceptors: [],
};
