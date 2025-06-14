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

// Request interceptor (for adding auth tokens, logging, etc.)
apiClient.interceptors.request.use(
  (config) => {
    // Add Authorization header if token exists
    const token = tokenService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  (error) => {
    // Handle common errors here (401, 403, 500, etc.)
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login if needed
      // Could add redirect logic here in the future
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