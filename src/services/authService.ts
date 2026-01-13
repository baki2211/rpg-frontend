import { api } from './apiClient';
import { tokenService } from './tokenService';

interface LoginResponse {
  token?: string;
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

interface AuthUser {
  user: {
    id: string;
    username: string;
    role: string;
  };
}

interface RegisterData {
  username: string;
  password: string;
  email?: string;
}

class AuthService {
  async login(username: string, password: string): Promise<AuthUser> {
    const loginResponse = await api.post<LoginResponse>('/auth/login', {
      username,
      password,
    });

    // Store token if received
    if (loginResponse.data.token) {
      tokenService.setToken(loginResponse.data.token, loginResponse.data.user);
    }

    // Fetch complete user data
    const userResponse = await api.get<AuthUser>('/protected');
    return userResponse.data;
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout', {});
    tokenService.clearAuth();
  }

  async register(userData: RegisterData): Promise<void> {
    await api.post('/auth/register', userData);
  }

  async checkAuth(): Promise<AuthUser> {
    const response = await api.get<AuthUser>('/protected');
    return response.data;
  }

  async refreshToken(): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/refresh');

    if (response.data.token) {
      tokenService.setToken(response.data.token, response.data.user);
    }

    return response.data;
  }
}

export const authService = new AuthService();
