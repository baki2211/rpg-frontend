import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/api';
import { tokenService } from './tokenService';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.apiUrl,
  withCredentials: true, // Important for cookie-based auth
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    // Add headers that might help with CORS in production
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
  },
});

// Track if we're currently refreshing to avoid multiple simultaneous refreshes
let isRefreshing = false;

// Request interceptor (for adding auth tokens and auto-refresh)
apiClient.interceptors.request.use(
  async (config) => {
    // Add Authorization header if token exists
    const token = tokenService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Check if token needs refresh (avoid refreshing during refresh call)
      if (!config.url?.includes('/auth/refresh') && tokenService.isTokenNearExpiry() && !isRefreshing) {
        isRefreshing = true;
        
        try {
          // Attempt to refresh the token
          const refreshResponse = await apiClient.post('/auth/refresh');
          
          if (refreshResponse.data.refreshed) {
            // Token was refreshed, update stored token and request header
            tokenService.setToken(refreshResponse.data.token, refreshResponse.data.user);
            config.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
          }
          // If not refreshed, token is still fresh - proceed with original token
        } catch (refreshError) {
          // Refresh failed - let the original request proceed
          // If token is truly expired, the main request will handle the 401
          console.warn('Token refresh failed:', refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (for handling errors globally)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors - token expired, redirect to login
    if (error.response?.status === 401) {
      tokenService.clearAuth();
      
      // Redirect to login if we're in a browser environment
      if (typeof window !== 'undefined') {
        window.location.href = '/pages/login';
      }
      
      return Promise.reject(error);
    }

    // Handle network errors with retry logic (only for non-auth requests)
    if (!error.response && !originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    if (!error.response && originalRequest._retryCount < 3) {
      originalRequest._retryCount++;
      const delay = Math.pow(2, originalRequest._retryCount - 1) * 1000; // 1s, 2s, 4s
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);

// Common API methods
export const api = {
  // GET request
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) => 
    apiClient.get<T>(url, config),

  // POST request
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    apiClient.post<T>(url, data, config),

  // PUT request
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    apiClient.put<T>(url, data, config),

  // DELETE request
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => 
    apiClient.delete<T>(url, config),

  // PATCH request
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    apiClient.patch<T>(url, data, config),
};

export default apiClient; 