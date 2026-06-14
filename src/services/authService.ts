import { api } from './apiClient';
import { AuthUser, LoginResponse, RefreshResponse, RegisterData } from '@/types/auth';

interface ProtectedResponse {
  user: AuthUser;
  message: string;
}

class AuthService {
  private pendingAuthCheck: Promise<AuthUser> | null = null;
  private pendingLogin: Promise<AuthUser> | null = null;
  private pendingRefresh: Promise<RefreshResponse> | null = null;

  async login(username: string, password: string): Promise<AuthUser> {
    if (this.pendingLogin) {
      return this.pendingLogin;
    }

    this.pendingLogin = (async () => {
      const loginResponse = await api.post<LoginResponse>('/auth/login', {
        username,
        password,
      });
      return loginResponse.data.user;
    })().finally(() => {
      this.pendingLogin = null;
    });

    return this.pendingLogin;
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout', {});
  }

  async register(userData: RegisterData): Promise<void> {
    await api.post('/auth/register', userData);
  }

  async checkAuth(): Promise<AuthUser> {
    if (this.pendingAuthCheck) {
      return this.pendingAuthCheck;
    }

    this.pendingAuthCheck = api.get<ProtectedResponse>('/protected')
      .then(response => response.data.user)
      .finally(() => {
        this.pendingAuthCheck = null;
      });

    return this.pendingAuthCheck;
  }

  async refreshToken(): Promise<RefreshResponse> {
    if (this.pendingRefresh) {
      return this.pendingRefresh;
    }

    this.pendingRefresh = api.post<RefreshResponse>('/auth/refresh')
      .then(response => response.data)
      .finally(() => {
        this.pendingRefresh = null;
      });

    return this.pendingRefresh;
  }
}

export const authService = new AuthService();
