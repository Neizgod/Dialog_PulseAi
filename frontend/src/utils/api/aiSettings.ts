import { request } from "./request";
import type {
  AiSettingsOptions,
  AiSettingsResponse,
  AiSettingsUpdateRequest,
  AiCheckResult,
} from "../types/ai-settings.types";

// AI-настройки (только для администратора)

// Опции для формы — вызывать ПЕРЕД GET /ai-settings
export const getAiSettingsOptionsAPI = (): Promise<AiSettingsOptions> =>
  request<AiSettingsOptions>("/ai-settings/options", { method: "GET" });

export const getAiSettingsAPI = (): Promise<AiSettingsResponse> =>
  request<AiSettingsResponse>("/ai-settings", { method: "GET" });

// Сохранение. api_key передавать только если пользователь ввёл новый ключ.
// Возвращает обновлённые настройки.
export const updateAiSettingsAPI = (
  data: AiSettingsUpdateRequest
): Promise<AiSettingsResponse> =>
  request<AiSettingsResponse>("/ai-settings", {
    method: "PATCH",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json;charset=utf-8" },
  });

// Проверка подключения модели анализа
export const checkAnalysisModelAPI = (): Promise<AiCheckResult> =>
  request<AiCheckResult>("/ai-settings/check-analysis", { method: "POST" });

// Проверка подключения модели расшифровки аудио
export const checkAudioModelAPI = (): Promise<AiCheckResult> =>
  request<AiCheckResult>("/ai-settings/check-audio", { method: "POST" });
