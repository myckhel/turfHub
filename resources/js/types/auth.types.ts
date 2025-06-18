// Authentication related types

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
  [key: string]: string | boolean | undefined;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  terms?: boolean;
  [key: string]: string | boolean | undefined;
}

export interface ResetPasswordData {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
  [key: string]: string;
}

export interface ForgotPasswordData {
  email: string;
  [key: string]: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  avatar?: string;
  roles: Role[];
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  guard_name: string;
}

export interface AuthResponse {
  user: AuthUser;
  token?: string;
  expires_at?: string;
}

export interface VerificationResponse {
  message: string;
  verified: boolean;
}
