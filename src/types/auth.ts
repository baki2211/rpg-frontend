export interface AuthUser {
  id: number;
  username: string;
  role: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  isLoading: boolean;
  error: string | null;
  retryAuth: () => void;
}

export interface LoginResponse {
  token?: string;
  user?: AuthUser;
  refreshed?: boolean;
}

export interface RegisterData {
  username: string;
  password: string;
  email?: string;
}