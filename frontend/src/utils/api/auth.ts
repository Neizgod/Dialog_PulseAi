import { request } from "./request";
import type {
  CurrentUser,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RegisterRequest,
  RegisterResponse,
} from "../types/auth.types";

export const registerUserAPI = (
  data: RegisterRequest
): Promise<RegisterResponse> =>
  request<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json;charset=utf-8" },
  });

export const loginUserAPI = (data: LoginRequest): Promise<LoginResponse> =>
  request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json;charset=utf-8" },
  });

export const authUserAPI = (): Promise<CurrentUser> =>
  request<CurrentUser>("/users/me", {
    method: "GET",
  });

export const logoutUserAPI = (): Promise<LogoutResponse> =>
  request<LogoutResponse>("/auth/logout", {
    method: "POST",
  });
