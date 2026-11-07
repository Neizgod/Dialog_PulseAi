// ============================================================
// DialogPulse — Common Types
// Общие перечисления и переиспользуемые типы
// ============================================================

// ============================================================
// Enums
// ============================================================

export type ImportBatchStatus =
  | 'uploaded'
  // Аудио: асинхронная транскрибация (нужен polling GET /imports/{id})
  | 'transcription_queued'
  | 'transcription_processing'
  | 'transcription_failed'
  | 'preview_ready'
  | 'imported'
  | 'import_failed'
  | 'analysis_processing'
  | 'analysis_completed'
  | 'analysis_completed_with_errors'
  | 'analysis_failed';

export type DialogAnalysisStatus = 'pending' | 'processing' | 'done' | 'error';

export type DialogOutcome =
  | 'success'
  | 'lost'
  | 'pending'
  | 'complaint'
  | 'consultation'
  | 'unknown';

export type ClientTemperature = 'hot' | 'warm' | 'cold' | 'unknown';

export type SenderRole = 'client' | 'manager' | 'system' | 'unknown';

// Технические ключи возражений (analysis.objections) — для словаря ключ→название
export type ObjectionKey =
  | 'price'
  | 'delivery'
  | 'availability'
  | 'trust'
  | 'timing'
  | 'need_more_info'
  | 'comparison'
  | 'decision_maker'
  | 'no_need'
  | 'other';

// Технические ключи ошибок менеджера (analysis.manager_errors)
export type ManagerErrorKey =
  | 'no_need_clarification'
  | 'no_objection_handling'
  | 'slow_response'
  | 'no_next_step'
  | 'rude_tone'
  | 'incomplete_answer'
  | 'wrong_product_offer'
  | 'ignored_client_question'
  | 'other';

// Технические риск-флаги (analysis.risk_flags) — считаются backend-метриками,
// не генерируются AI-моделью
export type RiskFlag =
  | 'manager_response_delay_warning'
  | 'manager_response_delay_critical'
  | 'no_manager_reply_after_client'
  | 'missing_timestamps'
  | 'dialog_ended_with_client_message';

export type FeedbackRating = 'correct' | 'partially_correct' | 'incorrect';

export type ExportFormat = 'markdown' | 'csv' | 'pdf';

export type UserRole = 'user' | 'admin';

// ============================================================
// Общие вложенные типы
// ============================================================

export interface UserShort {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface ManagerShort {
  id: number;
  external_id: string | null;
  name: string;
}
export interface ImportBatchShort {
  id: number;
  original_filename: string;
}

export interface AnalysisProgress {
  total: number;
  processed: number;
  success: number;
  errors: number;
  percent: number;
  remaining?: number;
}

export interface TaggedItem {
  type: string;
  label: string;
}

export interface TaggedItemWithCount extends TaggedItem {
  count: number;
}

// Готовый к отображению элемент анализа: приходит с backend уже с label/detail.
// Используется для objection_items / manager_error_items / risk_flag_items —
// frontend больше не склеивает ключи со словарями вручную.
export interface AnalysisTagItem {
  key: string;
  label: string;
  detail: string | null;
}

// Элемент распределения/топа: backend отдаёт готовый label + count по ключу.
// Используется на дашборде (outcomes, top_objections, most_frequent_error и т.д.).
export interface LabeledCount {
  key: string;
  label: string;
  count: number;
}

// ============================================================
// Общий формат ошибок API
// ============================================================

export interface ApiErrorDetail {
  code: string;
  message: string;
  fields?: string[];
  dialog_id?: number;
}

export interface ApiError {
  detail: ApiErrorDetail;
}
