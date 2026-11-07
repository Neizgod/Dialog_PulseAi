// ============================================================
// DialogPulse — Analysis Types
// POST /analysis/dialogs/{dialog_id}/run
// POST /analysis/dialogs/batch/run
// POST /analysis/imports/{import_id}/run
// GET  /analysis/imports/{import_id}/progress
// POST /analysis/dialogs/{dialog_id}/retry
// ============================================================
import type {
  ImportBatchStatus,
  DialogAnalysisStatus,
  DialogOutcome,
  ClientTemperature,
  AnalysisProgress,
} from './common.types';

// POST /analysis/dialogs/{dialog_id}/run — Response (раздел 11: возвращает анализ)
export interface RunDialogAnalysisResponse {
  dialog_id: number;
  analysis_status: DialogAnalysisStatus;
  analysis_id: number;
  outcome: DialogOutcome;
  client_temperature: ClientTemperature;
  quality_score: number | null;
  summary: string;
  objections: string[];
  objection_details: string[];
  manager_errors: string[];
  manager_error_details: string[];
  loss_reasons: string[];
  recommendation: string;
  risk_flags: string[];
  error_message: string | null;
}

// POST /analysis/imports/{import_id}/run — Response
export interface RunImportAnalysisResponse {
  import_id: number;
  status: ImportBatchStatus;
  progress: AnalysisProgress;
}

// Статус прогресса анализа импорта (progress.status).
// partially_completed — часть диалогов обработана, но остались pending.
export type AnalysisProgressStatus =
  | 'empty' // в загрузке нет диалогов для анализа
  | 'pending' // ожидает анализа
  | 'processing' // анализируется
  | 'partially_completed' // частично обработано
  | 'completed' // готово
  | 'completed_with_errors'; // завершено с ошибками

// GET /analysis/imports/{import_id}/progress — Response (плоская структура)
export interface ImportAnalysisProgressResponse {
  import_id: number;
  status: AnalysisProgressStatus;
  dialogs_count: number; // всего диалогов
  pending_count: number; // ожидают анализа
  processing_count: number; // анализируются сейчас
  done_count: number; // обработаны без технической ошибки
  error_count: number; // ошибок анализа
  processed_count: number; // обработано всего (done + error)
  progress_percent: number; // процент прогресса (считает backend)
}

// POST /analysis/dialogs/{dialog_id}/retry — Response
export interface RetryDialogAnalysisResponse {
  dialog_id: number;
  analysis_status: DialogAnalysisStatus;
}

// POST /analysis/dialogs/batch/run — Request
export interface BatchRunAnalysisRequest {
  dialog_ids: number[];
  only_pending: boolean;
}

export interface BatchRunAnalysisError {
  dialog_id: number;
  message: string;
}

// POST /analysis/dialogs/batch/run — Response
export interface BatchRunAnalysisResponse {
  requested_dialogs_count: number;
  selected_dialogs_count: number;
  analyzed_count: number;
  skipped_count: number;
  failed_count: number;
  errors: BatchRunAnalysisError[];
}

// POST /analysis/imports/{import_id}/run — Query параметры
export interface RunImportAnalysisQuery {
  only_pending?: boolean;
  limit?: number;
}

// POST /analysis/imports/{import_id}/run — Response (расширенный)
export interface RunImportAnalysisExtendedResponse {
  import_id: number;
  import_dialogs_count: number;
  selected_dialogs_count: number;
  analyzed_count: number;
  skipped_count: number;
  failed_count: number;
  errors: BatchRunAnalysisError[];
}

// POST /analysis/imports/{import_id}/run-async — Query параметры.
// only_pending=true → анализируются только диалоги в статусе pending/error
// (done повторно не запускаются). Используется и для «Повторить анализ для ошибок».
export interface RunImportAnalysisAsyncQuery {
  only_pending?: boolean;
}

// POST /analysis/imports/{import_id}/run-async — Response.
// Анализ ставится в очередь (Celery); прогресс отслеживать через progress-эндпоинт.
export interface RunImportAnalysisAsyncResponse {
  import_id: number;
  task_id: string;
  status: 'queued';
  import_dialogs_count: number;
  message: string;
}