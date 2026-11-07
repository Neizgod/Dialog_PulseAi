import { request, type QueryParams } from "./request";
import type {
  BatchRunAnalysisRequest,
  BatchRunAnalysisResponse,
  ImportAnalysisProgressResponse,
  RetryDialogAnalysisResponse,
  RunDialogAnalysisResponse,
  RunImportAnalysisExtendedResponse,
  RunImportAnalysisQuery,
  RunImportAnalysisResponse,
  RunImportAnalysisAsyncQuery,
  RunImportAnalysisAsyncResponse,
} from "../types/analysis.types";

// Analysis API отвечает за запуск анализа, повторный запуск и получение прогресса.

export const runDialogAnalysisAPI = (
  dialog_id: number
): Promise<RunDialogAnalysisResponse> =>
  request<RunDialogAnalysisResponse>(`/analysis/dialogs/${dialog_id}/run`, {
    method: "POST",
  });

export const batchRunAnalysisAPI = (
  data: BatchRunAnalysisRequest
): Promise<BatchRunAnalysisResponse> =>
  request<BatchRunAnalysisResponse>("/analysis/dialogs/batch/run", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json;charset=utf-8" },
  });

export const runImportAnalysisAPI = (
  import_id: number,
  query?: RunImportAnalysisQuery
): Promise<RunImportAnalysisResponse | RunImportAnalysisExtendedResponse> =>
  request<RunImportAnalysisResponse | RunImportAnalysisExtendedResponse>(
    `/analysis/imports/${import_id}/run`,
    { method: "POST" },
    query as QueryParams
  );

// Асинхронный запуск (Celery): не ждём завершения, прогресс — через progress-эндпоинт.
// Используется экраном AI-анализа загрузки, кнопками «Запустить»/«Продолжить»/«Повторить».
export const runImportAnalysisAsyncAPI = (
  import_id: number,
  query?: RunImportAnalysisAsyncQuery
): Promise<RunImportAnalysisAsyncResponse> =>
  request<RunImportAnalysisAsyncResponse>(
    `/analysis/imports/${import_id}/run-async`,
    { method: "POST" },
    query as QueryParams
  );

export const getProgressAnalysisAPI = (
  import_id: number
): Promise<ImportAnalysisProgressResponse> =>
  request<ImportAnalysisProgressResponse>(
    `/analysis/imports/${import_id}/progress`,
    { method: "GET" }
  );

export const retryAnalysisAPI = (
  dialog_id: number
): Promise<RetryDialogAnalysisResponse> =>
  request<RetryDialogAnalysisResponse>(`/analysis/dialogs/${dialog_id}/retry`, {
    method: "POST",
  });
