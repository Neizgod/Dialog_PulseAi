// ============================================================
// DialogPulse — Imports Types
// POST /imports/preview
// POST /imports/{import_id}/roles/values       (было /role-values)
// POST /imports/{import_id}/settings/validate  (было /validate-mapping и /text/{id}/roles/validate)
// POST /imports/{import_id}/confirm
// GET  /imports
// GET  /imports/{import_id}
// POST /imports/manual-dialog
// ============================================================

import type {
  ImportBatchStatus,
  DialogAnalysisStatus,
  SenderRole,
} from './common.types';

// ============================================================
// Каналы импорта
// GET /imports/channels?source_type=audio|csv|txt|markdown
// ============================================================

export type ImportSourceType =
  | 'audio'
  | 'csv'
  | 'txt'
  | 'markdown'
  | 'manual'
  | 'transcript';

export type ImportStatusGroup = 'ready' | 'processing' | 'error';

export interface ImportChannelOption {
  value: string; // отправляется в backend (default_channel)
  label: string; // показывается пользователю
}

// GET /imports/channels — Response. default_channel — предвыбранный канал:
// audio → "phone", csv/txt/markdown → "other".
export interface ImportChannelsResponse {
  default_channel: string;
  channels: ImportChannelOption[];
}

// ============================================================
// Маскирование персональных данных (redaction)
// В preview/manual/audio ответах — поле redaction; в GET /imports/{id} —
// внутри source_config.redaction. По умолчанию маскирование включено.
// На загрузке отправляется form-поле redact_sensitive_data ("true"/"false").
// ============================================================

export interface RedactionStats {
  total: number;
  phones: number;
  emails: number;
  bank_cards: number;
  passports: number;
  snils: number;
  inns: number;
}

export interface RedactionInfo {
  enabled: boolean; // false → пользователь снял чекбокс
  processed: boolean; // false → ещё не выполнено (для audio до расшифровки)
  stage: string; // 'after_transcription' | 'before_preview'
  stats: RedactionStats;
}

// GET /imports/{id} → source_config
export interface ImportSourceConfig {
  redaction?: RedactionInfo;
  // Текст ошибки при status = transcription_failed
  transcription_error?: string;
}

// ============================================================
// Preview
// ============================================================

export interface ColumnInfo {
  name: string;
  sample_values: string[];
  suggested_field: string | null;
  confidence: number;
}

// ============================================================
// Системные поля для сопоставления колонок
// GET /imports/mapping-fields — единый источник списка полей (в т.ч. sender_role).
// Раньше список хранился на фронте и расходился с бэком.
// ============================================================
export interface MappingField {
  value: string; // техническое имя: dialog_id, sender_role, message, …
  label: string; // подпись для интерфейса
  required?: boolean;
}

export interface MappingFieldsResponse {
  source_type?: string;
  fields: MappingField[];
}

// ============================================================
// Справочники фильтров загрузок
// GET /imports/options
// ============================================================
export interface ImportOptionRead {
  value: string;
  label: string;
}

export interface ImportOptionsResponse {
  source_types: ImportOptionRead[];
  status_groups: ImportOptionRead[];
}

export interface PreviewRow {
  row_number: number;
  values: Record<string, string>;
}

// POST /imports/preview — Response
export interface ImportPreviewResponse {
  import_id: number;
  original_filename: string;
  status: ImportBatchStatus;
  rows_count: number;
  columns: ColumnInfo[];
  preview_rows: PreviewRow[];
  warnings: string[];
  // Если маскирование включено — статистика замен (метки уже в preview_rows)
  redaction?: RedactionInfo;
}
// ============================================================
// Role detection (экран «Роли»)
// POST /imports/{import_id}/role-values
// ============================================================

// Стратегия определения ролей отправителей
export type RoleStrategy =
  | "role_column" // в файле уже указаны роли
  | "direction_mapping" // входящие / исходящие сообщения
  | "manager_match" // сравнение автора сообщения с менеджером диалога
  | "selected_manager_values"; // выбор менеджеров вручную

// POST /imports/{import_id}/role-values — Request
// (режим manager_match этот эндпоинт не вызывает)
export interface RoleColumnValuesRequest {
  strategy: "role_column";
  source_column: string;
}

export interface DirectionMappingValuesRequest {
  strategy: "direction_mapping";
  source_column: string;
}

export interface SelectedManagerValuesRequest {
  strategy: "selected_manager_values";
  sender_name_column: string | null;
  sender_external_id_column: string | null;
}

export type RoleValuesRequest =
  | RoleColumnValuesRequest
  | DirectionMappingValuesRequest
  | SelectedManagerValuesRequest;

// Элемент списка значений / отправителей из /role-values
export interface RoleValueItem {
  value: string; // техническое значение для backend
  label: string; // подпись для интерфейса
  messages_count: number;
  suggested_role: SenderRole | null;
  sender_name: string | null;
  sender_external_id: string | null;
}

// POST /imports/{import_id}/role-values — Response
export interface RoleValuesResponse {
  import_id: number;
  strategy: RoleStrategy;
  items: RoleValueItem[];
  warnings: string[];
}

// Настройки определения ролей, отправляемые в validate-mapping
export interface RoleDetection {
  strategy: RoleStrategy;
  scope: "batch" | "dialog";
  // ключ — RoleValueItem.value, значение — роль (client/manager/system/unknown)
  value_mapping: Record<string, string>;
  default_role: SenderRole | null;
  dialog_value_mapping: Record<string, Record<string, string>>;
}

// ============================================================
// Validate Mapping
// ============================================================

// POST /imports/{import_id}/validate-mapping — Request
export interface ValidateMappingRequest {
  column_mapping: Record<string, string>;
  role_detection: RoleDetection;
}

// Значение роли, найденное при валидации (role_values_found).
// value — техническое значение (client/manager/…), suggested_role — назначенная роль
export interface RoleValueFound {
  value: string;
  messages_count: number;
  suggested_role: SenderRole | null;
}

export interface DialogPreviewMessage {
  sender_role: SenderRole;
  sender_name: string | null;
  sender_external_id: string | null;
  direction: string | null; // "incoming" | "outgoing" | null
  text: string;
}

export interface DialogPreview {
  dialog_external_id: string;
  // Может быть автоопределён backend по сообщениям с sender_role: manager,
  // даже если колонка менеджера не была выбрана в column_mapping
  manager_name: string;
  manager_external_id: string | null;
  channel: string;
  messages_count: number;
  messages: DialogPreviewMessage[];
}

export interface RowError {
  row_number: number;
  reason: string;
}

export interface ValidateMappingCounts {
  rows_count: number;
  dialogs_count: number;
  messages_count: number;
  errors_count: number;
}

// POST /imports/{import_id}/validate-mapping — Response
export interface ValidateMappingResponse {
  import_id: number;
  status: string;
  mapping_valid: boolean;
  counts: ValidateMappingCounts;
  required_fields_missing: string[];
  unknown_columns: string[];
  role_values_found: RoleValueFound[];
  dialog_previews: DialogPreview[];
  row_errors: RowError[];
  warnings: string[];
}

// ============================================================
// Confirm Import
// ============================================================

// POST /imports/{import_id}/confirm — Request
export interface ConfirmImportRequest {
  run_analysis: boolean;
}

// POST /imports/{import_id}/confirm — Response
export interface ConfirmImportResponse {
  import_id: number;
  status: ImportBatchStatus;
  dialogs_created: number;
  messages_created: number;
  errors_count: number;
  analysis_started: boolean;
}

// ============================================================
// Import Batch List & Detail
// ============================================================

// GET /imports — Response item
export interface ImportBatchListItem {
  id: number;
  original_filename: string | null;
  source_type: string;
  status: ImportBatchStatus;
  dialogs_count: number;
  messages_count: number;
  errors_count: number;
  created_at: string;
  // Для кольца на карточке загрузки. Наличие/имена полей нужно подтвердить у
  // бэкенда: progress_percent — прогресс анализа («Анализируется»);
  // average_quality_score — средняя оценка («Обработано»). Если backend их не
  // отдаёт, кольцо рисуется пустым.
  progress_percent?: number;
  average_quality_score?: number | null;
}

export interface ImportBatchListResponse {
  items: ImportBatchListItem[];
  total: number;
}

export interface ImportBatchListQuery {
  page?: number;
  page_size?: number;
  source_type?: ImportSourceType;
  status?: ImportBatchStatus;
  status_group?: ImportStatusGroup;
}

// GET /imports/{import_id} — Response (ImportBatchRead).
// original_filename может быть null → показывать «Без названия».
export interface ImportBatchRead {
  id: number;
  source_type: string;
  original_filename: string | null;
  status: ImportBatchStatus;
  rows_count: number;
  dialogs_count: number;
  messages_count: number;
  errors_count: number;
  created_at: string;
  updated_at: string;
  // Для audio: статус транскрибации отражается в status (transcription_*),
  // а ошибка/маскирование — в source_config
  source_config?: ImportSourceConfig;
}

// ============================================================
// Manual Dialog
// ============================================================

// POST /imports/manual-dialog — Request.
// Ручная вставка использует тот же парсер, что TXT/Markdown: если задан
// manager_name, автор с этим именем считается менеджером, остальные — клиентами.
export interface ManualDialogRequest {
  title?: string;
  manager_name: string;
  channel?: string; // не обязателен — backend подставит дефолт
  raw_text: string;
  run_analysis: boolean;
  // Маскировать ПДн в созданном диалоге (по умолчанию включено)
  redact_sensitive_data?: boolean;
}

// POST /imports/manual-dialog — Response.
// analysis_status может быть pending сразу после ответа (анализ асинхронный).
export interface ManualDialogResponse {
  import_id: number;
  dialog_id: number;
  analysis_started: boolean;
  analysis_status: DialogAnalysisStatus;
  messages_count: number;
}

// ============================================================
// TXT / Markdown (общий импорт)
// POST /imports/preview                      (source_type txt/markdown)
// POST /imports/{import_id}/roles/values     (без body)
// POST /imports/{import_id}/settings/validate ({ author_roles })
// ============================================================

// Участник диалога в preview (роль ещё не назначена)
export interface TxtParticipant {
  author: string;
  messages_count: number;
  sample_text: string;
}

// Сообщение в предпросмотре распознанного диалога
export interface TxtPreviewMessage {
  position: number;
  author: string;
  text: string;
  raw_timestamp: string | null;
}

// Распознанный диалог в preview
export interface TxtDialogPreview {
  external_dialog_id: string;
  title: string;
  messages_count: number;
  messages: TxtPreviewMessage[];
}

// POST /imports/preview — Response для TXT/Markdown (нет колонок, есть диалоги)
export interface TxtPreviewResponse {
  import_id: number;
  status: ImportBatchStatus;
  source_type: string; // "txt" | "markdown"
  original_filename: string | null;
  rows_count: number;
  dialogs_count: number;
  messages_count: number;
  participants: TxtParticipant[];
  dialog_previews: TxtDialogPreview[];
  warnings: string[];
  errors: string[];
  // Если маскирование включено — метки уже в текстах + статистика замен
  redaction?: RedactionInfo;
}

// Участник с назначенной ролью (roles/values и settings/validate)
export interface TxtRoleParticipant {
  author: string;
  role: SenderRole | null;
  messages_count: number;
  sample_text: string;
}

// POST /imports/{import_id}/roles/values — Response для TXT/Markdown (body не нужен)
export interface TxtRolesValuesResponse {
  import_id: number;
  source_type: string;
  participants: TxtRoleParticipant[];
  warnings: string[];
}

// POST /imports/{import_id}/settings/validate — Request для TXT/Markdown.
// ключ — имя автора, значение — роль (client/manager/system/unknown)
export interface TxtSettingsValidateRequest {
  author_roles: Record<string, string>;
}

// POST /imports/{import_id}/settings/validate — Response для TXT/Markdown
export interface TxtSettingsValidateResponse {
  import_id: number;
  status: ImportBatchStatus;
  source_type: string;
  role_detection: {
    strategy: "author_mapping";
    author_roles: Record<string, string>;
  };
  participants: TxtRoleParticipant[];
  warnings: string[];
}

// ============================================================
// Audio (асинхронная транскрибация)
// POST /imports/preview (multipart: file, default_channel, redact_sensitive_data)
//   → для audio возвращает «queued»-ответ, далее polling GET /imports/{id}
// GET  /imports/{id}/preview — предпросмотр аудио, когда status = preview_ready
// Роли (roles/values, settings/validate) и confirm — как у TXT/Markdown.
// ============================================================

// POST /imports/preview — ответ для audio (расшифровка поставлена в очередь).
// Preview ещё не готов: показываем loader и делаем polling GET /imports/{id}.
export interface AudioUploadQueuedResponse {
  import_id: number;
  status: ImportBatchStatus; // 'transcription_queued'
  source_type: string; // 'audio'
  original_filename: string | null;
  transcription_started: boolean;
  message: string;
  redaction: RedactionInfo;
}

// GET /imports/{id}/preview — предпросмотр аудио (участники + реплики + тайминги).
// Структура участников/диалогов совпадает с TXT (reuse TxtParticipant/TxtDialogPreview),
// у сообщений raw_timestamp в формате "HH:MM:SS".
export interface AudioPreviewResponse {
  import_id: number;
  status: ImportBatchStatus;
  source_type: string; // 'audio'
  original_filename: string | null;
  duration_seconds: number;
  speakers_count: number;
  segments_count: number;
  dialogs_count: number;
  messages_count: number;
  participants: TxtParticipant[];
  dialog_previews: TxtDialogPreview[];
  warnings: string[];
  errors: string[];
  redaction: RedactionInfo;
}
