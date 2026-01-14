import { api } from './apiClient';
import { User, DashboardData, UpdateProfileData, ChangePasswordData } from '../types/user';

class UserService {
  async getDashboard(): Promise<DashboardData> {
    const response = await api.get<DashboardData>('/user/dashboard');
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/user/profile');
    return response.data;
  }

  async updateProfile(userData: UpdateProfileData): Promise<User> {
    const response = await api.put<User>('/user/profile', userData);
    return response.data;
  }

  async changePassword(passwordData: ChangePasswordData): Promise<void> {
    await api.post<void>('/user/change-password', passwordData);
  }

  async checkProtected(): Promise<{ message: string }> {
    const response = await api.get<{ message: string }>('/protected');
    return response.data;
  }

  async getAllUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/user/all');
    return response.data;
  }

  async updateUserPassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    await api.put(`/user/${userId}/password`, { oldPassword, newPassword });
  }
}

export const userService = new UserService();
