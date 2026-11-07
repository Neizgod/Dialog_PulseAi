import { request, type QueryParams } from "./request";
import type {
  DeleteDialogResponse,
  DialogDetail,
  DialogNavigationResponse,
  DialogsListQuery,
  DialogsListResponse,
  DialogsSummaryResponse,
} from "../types/dialogs.types";

// Dialogs API отвечает за список диалогов, фильтры и карточку диалога.

export const getDialogsSummaryAPI = (
  query?: DialogsListQuery
): Promise<DialogsSummaryResponse> =>
  request<DialogsSummaryResponse>(
    "/dialogs/summary",
    { method: "GET" },
    query as QueryParams
  );

export const getDialogsListAPI = (
  query?: DialogsListQuery
): Promise<DialogsListResponse> =>
  request<DialogsListResponse>(
    "/dialogs",
    {
      method: "GET",
    },
    query as QueryParams
  );

export const getDialogDetailAPI = (dialog_id: number): Promise<DialogDetail> =>
  request<DialogDetail>(`/dialogs/${dialog_id}`, {
    method: "GET",
  });

// Навигация «предыдущий / следующий» в рамках текущей выборки.
// Передаём те же query-параметры (фильтры, поиск, сортировка), что и список.
export const getDialogNavigationAPI = (
  dialog_id: number,
  query?: DialogsListQuery
): Promise<DialogNavigationResponse> =>
  request<DialogNavigationResponse>(
    `/dialogs/${dialog_id}/navigation`,
    { method: "GET" },
    query as QueryParams
  );

export const deleteDialogAPI = (
  dialog_id: number
): Promise<DeleteDialogResponse> =>
  request<DeleteDialogResponse>(`/dialogs/${dialog_id}`, {
    method: "DELETE",
  });
