import { API_CONFIG } from '../config/api';
import { ROUTES } from '../config/routes';
import { CSRF_HEADER_NAME, getCsrfToken } from './csrfService';

// Hardcoded so a 401-response body can never steer the redirect target.
const LOGIN_REDIRECT_PATH = ROUTES.login;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

const MUTATING_METHODS: ReadonlySet<HttpMethod> = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_EXEMPT_PATHS = ['/auth/login', '/auth/register'];

export interface ApiRequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestContext;
}

interface RequestContext extends ApiRequestConfig {
  method: HttpMethod;
  url: string;
  _retryCount?: number;
}

export type ApiErrorCode =
  | 'ERR_BAD_RESPONSE'
  | 'ERR_TOO_MANY_REQUESTS'
  | 'ERR_NETWORK'
  | 'ERR_TIMEOUT'
  | 'ERR_CANCELED';

export interface ApiError extends Error {
  config: RequestContext;
  response?: ApiResponse<unknown>;
  code?: ApiErrorCode;
}

const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'Cache-Control': 'no-cache',
};

const MAX_NETWORK_RETRIES = 3;
const DEFAULT_TIMEOUT = 10000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const buildUrl = (url: string) => {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const baseUrl = API_CONFIG.apiUrl.endsWith('/')
    ? API_CONFIG.apiUrl
    : `${API_CONFIG.apiUrl}/`;
  const normalizedPath = url.startsWith('/') ? url.slice(1) : url;

  return new URL(normalizedPath, baseUrl).toString();
};

const headersToRecord = (headers: Headers): Record<string, string> => {
  const result: Record<string, string> = {};

  headers.forEach((value, key) => {
    result[key] = value;
  });

  return result;
};

const isFormData = (value: unknown): value is FormData => {
  return typeof FormData !== 'undefined' && value instanceof FormData;
};

const isJsonLikeObject = (value: unknown) => {
  return value !== null && typeof value === 'object' && !isFormData(value) && !(value instanceof Blob) && !(value instanceof ArrayBuffer) && !(value instanceof URLSearchParams);
};

const shouldSendJson = (value: unknown) => {
  return isJsonLikeObject(value) || Array.isArray(value);
};

const normalizeErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const createApiError = (
  message: string,
  config: RequestContext,
  options: { code?: ApiErrorCode; response?: ApiResponse<unknown> } = {}
): ApiError => {
  const error = new Error(message) as ApiError;
  error.name = 'ApiError';
  error.config = config;
  error.code = options.code;
  error.response = options.response;
  return error;
};

const parseResponseBody = async <T>(response: Response): Promise<T> => {
  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return (await response.json()) as T;
    } catch {
      return undefined as T;
    }
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
};

const needsCsrf = (method: HttpMethod, url: string) => {
  if (!MUTATING_METHODS.has(method)) return false;
  return !CSRF_EXEMPT_PATHS.some(path => url.includes(path));
};

const buildHeaders = (method: HttpMethod, url: string, data: unknown, config?: ApiRequestConfig) => {
  const headers = new Headers(DEFAULT_HEADERS);

  Object.entries(config?.headers || {}).forEach(([key, value]) => {
    headers.set(key, value);
  });

  if (needsCsrf(method, url)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  if (isFormData(data)) {
    headers.delete('Content-Type');
  } else if (shouldSendJson(data) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
};

const buildBody = (data: unknown) => {
  if (data === undefined || data === null) {
    return undefined;
  }

  if (isFormData(data) || data instanceof Blob || data instanceof ArrayBuffer || data instanceof URLSearchParams) {
    return data;
  }

  if (shouldSendJson(data)) {
    return JSON.stringify(data);
  }

  return data as BodyInit;
};

const shouldRetryNetworkError = (error: unknown, abortedByUser: boolean) => {
  if (abortedByUser) {
    return false;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  if (error instanceof Error) {
    return (
      error.name === 'AbortError' ||
      error.message.includes('NetworkError') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('fetch')
    );
  }

  return false;
};

const executeRequest = async <T>(
  method: HttpMethod,
  url: string,
  data?: unknown,
  config?: ApiRequestConfig,
  retryCount = 0
): Promise<ApiResponse<T>> => {
  const requestUrl = buildUrl(url);
  const requestConfig: RequestContext = {
    method,
    url,
    headers: config?.headers,
    timeout: config?.timeout,
    credentials: config?.credentials,
    signal: config?.signal,
    _retryCount: retryCount,
  };

  const headers = buildHeaders(method, url, data, config);
  const body = buildBody(data);
  const timeout = config?.timeout ?? DEFAULT_TIMEOUT;
  const controller = new AbortController();
  let abortedByCaller = false;
  let timedOut = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (config?.signal) {
    if (config.signal.aborted) {
      abortedByCaller = true;
      controller.abort();
    } else {
      const onAbort = () => {
        abortedByCaller = true;
        controller.abort();
      };

      config.signal.addEventListener('abort', onAbort, { once: true });
      controller.signal.addEventListener(
        'abort',
        () => {
          config.signal?.removeEventListener('abort', onAbort);
        },
        { once: true }
      );
    }
  }

  if (!controller.signal.aborted) {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeout);
  }

  try {
    const response = await fetch(requestUrl, {
      method,
      headers,
      body,
      credentials: config?.credentials ?? 'include',
      signal: controller.signal,
    });

    const responseData = await parseResponseBody<T>(response);
    const responseEnvelope: ApiResponse<T> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: headersToRecord(response.headers),
      config: requestConfig,
    };

    if (!response.ok) {
      const errorCode =
        response.status === 429 ? 'ERR_TOO_MANY_REQUESTS' : 'ERR_BAD_RESPONSE';

      const error = createApiError(
        responseData && typeof responseData === 'object' && 'message' in (responseData as Record<string, unknown>)
          ? String((responseData as Record<string, unknown>).message)
          : `Request failed with status code ${response.status}`,
        requestConfig,
        {
          code: errorCode,
          response: responseEnvelope,
        }
      );

      if (response.status === 401) {
        if (typeof window !== 'undefined' && window.location.pathname !== LOGIN_REDIRECT_PATH) {
          window.location.href = LOGIN_REDIRECT_PATH;
        }
      }

      throw error;
    }

    return responseEnvelope;
  } catch (error: unknown) {
    if (abortedByCaller) {
      throw createApiError('Request aborted by caller', requestConfig, {
        code: 'ERR_CANCELED',
      });
    }

    if (timedOut) {
      const timeoutError = createApiError(`Request timed out after ${timeout}ms`, requestConfig, {
        code: 'ERR_TIMEOUT',
      });

      if (retryCount < MAX_NETWORK_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000;
        await sleep(delay);
        return executeRequest<T>(method, url, data, config, retryCount + 1);
      }

      throw timeoutError;
    }

    if (shouldRetryNetworkError(error, abortedByCaller) && retryCount < MAX_NETWORK_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000;
      await sleep(delay);
      return executeRequest<T>(method, url, data, config, retryCount + 1);
    }

    throw createApiError(
      normalizeErrorMessage(error, 'Network request failed'),
      requestConfig,
      {
        code: 'ERR_NETWORK',
      }
    );
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export const api = {
  request: <T = unknown>(url: string, config: ApiRequestConfig & { method: HttpMethod; data?: unknown }) => {
    return executeRequest<T>(config.method, url, config.data, config);
  },
  get: <T = unknown>(url: string, config?: ApiRequestConfig) => executeRequest<T>('GET', url, undefined, config),
  post: <T = unknown>(url: string, data?: unknown, config?: ApiRequestConfig) =>
    executeRequest<T>('POST', url, data, config),
  put: <T = unknown>(url: string, data?: unknown, config?: ApiRequestConfig) =>
    executeRequest<T>('PUT', url, data, config),
  delete: <T = unknown>(url: string, config?: ApiRequestConfig) => executeRequest<T>('DELETE', url, undefined, config),
  patch: <T = unknown>(url: string, data?: unknown, config?: ApiRequestConfig) =>
    executeRequest<T>('PATCH', url, data, config),
};

export default api;
