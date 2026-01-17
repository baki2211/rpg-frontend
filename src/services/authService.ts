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
  private pendingAuthCheck: Promise<AuthUser> | null = null;
  private pendingLogin: Promise<AuthUser> | null = null;
  private pendingRefresh: Promise<LoginResponse> | null = null;

  async login(username: string, password: string): Promise<AuthUser> {
    // Prevent duplicate login requests
    if (this.pendingLogin) {
      return this.pendingLogin;
    }

    this.pendingLogin = (async () => {
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
    })().finally(() => {
      this.pendingLogin = null;
    });

    return this.pendingLogin;
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout', {});
    tokenService.clearAuth();
  }

  async register(userData: RegisterData): Promise<void> {
    await api.post('/auth/register', userData);
  }

  async checkAuth(): Promise<AuthUser> {
    // Deduplicate simultaneous auth checks
    if (this.pendingAuthCheck) {
      return this.pendingAuthCheck;
    }

    this.pendingAuthCheck = api.get<AuthUser>('/protected')
      .then(response => response.data)
      .finally(() => {
        this.pendingAuthCheck = null;
      });

    return this.pendingAuthCheck;
  }

  async refreshToken(): Promise<LoginResponse> {
    // Prevent duplicate refresh requests
    if (this.pendingRefresh) {
      return this.pendingRefresh;
    }

    this.pendingRefresh = api.post<LoginResponse>('/auth/refresh')
      .then(response => {
        if (response.data.token) {
          tokenService.setToken(response.data.token, response.data.user);
        }
        return response.data;
      })
      .finally(() => {
        this.pendingRefresh = null;
      });

    return this.pendingRefresh;
  }
}

export const authService = new AuthService();
