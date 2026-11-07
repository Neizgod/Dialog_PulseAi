// ============================================================
// DialogPulse — Dialogs Types
// GET /dialogs
// GET /dialogs/summary
// GET /dialogs/{dialog_id}
// DELETE /dialogs/{dialog_id}
// DELETE /imports/{import_id}
// ============================================================

import type {
  DialogAnalysisStatus,
  DialogOutcome,
  ClientTemperature,
  SenderRole,
  ManagerShort,
  AnalysisTagItem,
} from './common.types';

// ============================================================
// Preset (быстрые вкладки-фильтры)
// ============================================================

export type DialogPreset =
  | 'lost'
  | 'analysis_errors'
  | 'low_score'
  | 'not_analyzed'
  | 'problematic';

// ============================================================
// Summary
// ============================================================

// GET /dialogs/summary — Response
export interface DialogsSummaryResponse {
  dialogs_count: number;
  analyzed_count: number;
  lost_count: number;
  average_quality_score: number | null;
  analysis_errors_count: number;
}

// ============================================================
// List
// ============================================================

// Поля сортировки (только /dialogs; в /summary не передаются)
export type DialogSortBy =
  | 'created_at'
  | 'started_at'
  | 'quality_score'
  | 'analysis_status'
  | 'messages_count';

export type SortOrder = 'asc' | 'desc';

// GET /dialogs — Query параметры
export interface DialogsListQuery {
  page?: number;
  page_size?: number;
  manager_id?: number;
  channel?: string;
  analysis_status?: DialogAnalysisStatus;
  outcome?: DialogOutcome;
  client_temperature?: ClientTemperature;
  score_min?: number;
  score_max?: number;
  import_id?: number;
  date_from?: string;
  date_to?: string;
  preset?: DialogPreset;
  // Фильтры по техническим ключам (не по русским названиям)
  objection?: string;
  manager_error?: string;
  has_manager_errors?: boolean;
  risk_flag?: string;
  // Поиск по нескольким полям (external_dialog_id, manager.name, content и т.д.)
  search?: string;
  // Сортировка — только для /dialogs
  sort_by?: DialogSortBy;
  sort_order?: SortOrder;
}

// Вложенный анализ в элементе списка
// (null для диалогов в статусе pending)
export interface DialogListAnalysis {
  outcome: DialogOutcome;
  client_temperature: ClientTemperature;
  quality_score: number | null;
  summary: string;
  objections: string[]; // технические ключи
  objection_details: string[]; // человекочитаемые пояснения
  manager_errors: string[]; // технические ключи
  manager_error_details: string[];
  risk_flags: string[]; // технические ключи
  error_message: string | null;
  // Display-поля от backend (готовые названия + сгруппированные элементы),
  // чтобы не склеивать ключи со словарями вручную
  outcome_label: string;
  client_temperature_label: string;
  objection_items: AnalysisTagItem[];
  manager_error_items: AnalysisTagItem[];
  risk_flag_items: AnalysisTagItem[];
}

// GET /dialogs — Response item
export interface DialogListItem {
  id: number;
  external_dialog_id: string;
  client_external_id: string | null;
  channel: string;
  started_at: string;
  created_at: string;
  updated_at: string;
  manager: ManagerShort;
  analysis_status: DialogAnalysisStatus;
  analysis: DialogListAnalysis | null;
  messages_count: number;
}

export interface DialogsListResponse {
  items: DialogListItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// ============================================================
// Detail
// ============================================================

export interface DialogMessage {
  id: number;
  sender_role: SenderRole;
  sender_name: string;
  sender_external_id: string | null;
  direction: string;
  content: string;
  position: number;
  sent_at: string | null;
}

export interface AnalysisEvidence {
  message_position: number;
  quote: string;
  reason: string;
}

export interface DialogAnalysis {
  outcome: DialogOutcome;
  client_temperature: ClientTemperature;
  quality_score: number | null;
  summary: string;
  objections: string[];
  objection_details: string[];
  manager_errors: string[];
  manager_error_details: string[];
  risk_flags: string[];
  error_message: string | null;
  loss_reasons: string[];
  recommendation: string | null;
  evidence: AnalysisEvidence[];
  // Display-поля от backend
  outcome_label: string;
  client_temperature_label: string;
  objection_items: AnalysisTagItem[];
  manager_error_items: AnalysisTagItem[];
  risk_flag_items: AnalysisTagItem[];
  // «Возможный улучшенный ответ»: заложено архитектурно, обычно null
  // (заполняется только при подключении более сильной модели)
  better_reply: string | null;
}

// GET /dialogs/{dialog_id} — Response (раздел 10 спецификации)
export interface DialogDetail {
  id: number;
  external_dialog_id: string;
  client_external_id: string | null;
  channel: string;
  started_at: string;
  analysis_status: DialogAnalysisStatus;
  created_at: string;
  updated_at: string;
  manager: ManagerShort;
  messages: DialogMessage[];
  analysis: DialogAnalysis | null;
}

// ============================================================
// Navigation (предыдущий / следующий в текущей выборке)
// GET /dialogs/{dialog_id}/navigation
// ============================================================

// Навигацию нужно запрашивать с теми же query-параметрами (фильтры, поиск,
// сортировка), что и список — иначе backend построит её по другой выборке.
// Если диалог не входит в выборку, все id и position будут null.
export interface DialogNavigationResponse {
  previous_dialog_id: number | null;
  next_dialog_id: number | null;
  current_position: number | null;
  total_dialogs: number;
}

// ============================================================
// Delete
// ============================================================

// DELETE /dialogs/{dialog_id} — Response
export interface DeleteDialogResponse {
  dialog_id: number;
  deleted: boolean;
}

// DELETE /imports/{import_id} — Response
export interface DeleteImportResponse {
  import_id: number;
  deleted: boolean;
}