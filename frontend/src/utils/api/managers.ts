import { request, type QueryParams } from "./request";
import type {
  FeedbackRequest,
  FeedbackResponse,
  ManagersAnalyticsResponse,
  ManagersOptionsQuery,
  ManagersOptionsResponse,
} from "../types/managers-feedback.types";

// Аналитика по менеджерам
export const getAnalyticsByManagersAPI =
  (): Promise<ManagersAnalyticsResponse> =>
    request<ManagersAnalyticsResponse>("/managers/analytics", {
      method: "GET",
    });

// Список менеджеров для фильтра (сужается переданным срезом)
export const getManagersOptionsAPI = (
  query?: ManagersOptionsQuery
): Promise<ManagersOptionsResponse> =>
  request<ManagersOptionsResponse>(
    "/managers/options",
    { method: "GET" },
    query as QueryParams
  );

// Обратная связь по анализу диалога
export const postFeedbackAPI = (
  dialog_id: number,
  data: FeedbackRequest
): Promise<FeedbackResponse> =>
  request<FeedbackResponse>(`/dialogs/${dialog_id}/analysis/feedback`, {
    method: "POST",
    body: JSON.stringify(data),
  });
