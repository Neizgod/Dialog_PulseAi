// ============================================================
// DialogPulse — Auth Types
// POST /auth/register, POST /auth/login, GET /users/me, POST /auth/logout
// ============================================================

import type { UserRole, UserShort } from './common.types';

// POST /auth/register — Request
export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

// POST /auth/register — Response
export interface RegisterResponse {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

// POST /auth/login — Request
export interface LoginRequest {
  email: string;
  password: string;
}

// POST /auth/login — Response
export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  user: UserShort;
}

// GET /users/me — Response
export interface CurrentUser {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

// POST /auth/logout — Response
export interface LogoutResponse {
  message: string;
}
