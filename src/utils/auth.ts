import { refreshToken } from '@/services/auth/api';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const currentRefreshToken = getRefreshToken();

    if (!currentRefreshToken) {
      throw new Error('没有 refresh token');
    }

    const response = await refreshToken(currentRefreshToken);

    if (
      response.code !== 200 ||
      !response.data?.access_token ||
      !response.data?.refresh_token
    ) {
      throw new Error(response.errorMsg || response.msg || '刷新登录状态失败');
    }

    setTokens(response.data.access_token, response.data.refresh_token);

    return response.data.access_token;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}
