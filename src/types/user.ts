export interface User {
  id: number;
  username: string;
  email: string;
  password?: string; // Only included for admin operations
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardData {
  user: User;
  message: string;
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
