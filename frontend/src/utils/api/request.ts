import { getCookie } from "../cookie";
import type { ApiError } from "../types/common.types";

const BASE_URL = import.meta.env.VITE_DIALOG_PULSE_URL;

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export const buildUrl = (path: string, query?: QueryParams): string => {
  const url = new URL(path, BASE_URL);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
};

export const request = async <T>(
  path: string,
  init?: RequestInit,
  query?: QueryParams
): Promise<T> => {
  const token = getCookie("accessToken");

  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers, // init.headers перезапишет токен если нужно
    },
  });
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: { code: "unknown", message: response.statusText },
    }));
    throw error;
  }

  return response.json() as Promise<T>;
};
