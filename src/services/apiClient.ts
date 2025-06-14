import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/api';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.apiUrl,
  withCredentials: true, // Important for cookie-based auth
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (for adding auth tokens, logging, etc.)
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    // config.headers.Authorization = `Bearer ${token}`;
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
      // Handle unauthorized - maybe redirect to login
      console.warn('Unauthorized request');
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