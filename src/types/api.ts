import { AxiosResponse } from 'axios';

export interface ApiResponse<T = never> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  status?: number;
  data?: never;
}

export type ApiPromise<T> = Promise<AxiosResponse<T>>;
