// ============================================================
// DialogPulse — Reports Types
// POST /reports/generate
// GET  /reports/export
// ============================================================

import type {
  ExportFormat,
  DialogOutcome,
  ClientTemperature,
} from './common.types';

// POST /reports/generate — Request
export interface GenerateReportRequest {
  date_from: string;
  date_to: string;
  manager_id?: number | null;
  channel?: string | null;
}

export interface ReportMetrics {
  dialogs_total: number;
  success_count: number;
  lost_count: number;
  pending_count: number;
  complaint_count: number;
  average_quality_score: number;
}

export interface LossReason {
  title: string;
  description: string;
}

export interface DialogToReview {
  dialog_id: number;
  reason: string;
}

// POST /reports/generate — Response
export interface ReportResponse {
  title: string;
  period: string;
  summary: string;
  metrics: ReportMetrics;
  loss_reasons: LossReason[];
  common_objections: { label: string; count: number }[];
  common_manager_errors: { label: string; count: number }[];
  script_recommendations: string[];
  training_topics: string[];
  dialogs_to_review: DialogToReview[];
}

// GET /reports/export — Query параметры
export interface ExportReportQuery {
  format: ExportFormat;
  date_from: string;
  date_to: string;
  manager_id?: number;
}

// ============================================================
// GET /reports/manager — Отчёт для руководителя
// Отчёт агрегирует уже проанализированные диалоги (AI-модель не запускается).
// Все блоки строятся из готовых полей ответа; проценты/состояния не считаем на фронте.
// ============================================================

// Query параметры фильтрации
export interface ManagerReportQuery {
  manager_id?: number;
  channel?: string;
  import_id?: number;
  date_from?: string;
  date_to?: string;
}

// Состояние экрана определяется через state.key
export type ManagerReportStateKey =
  | 'ready' // полноценный отчёт
  | 'no_dialogs' // по фильтрам нет диалогов
  | 'no_analyzed' // диалоги есть, но AI-анализ не выполнен
  | 'insufficient_data'; // данных мало, но отчёт показываем (с предупреждением)

export interface ManagerReportState {
  key: ManagerReportStateKey;
  title: string;
  message: string;
}

// Применённые фильтры (header.filters). manager_name может прийти и в пустом срезе.
export interface ManagerReportFilters {
  manager_id: number | null;
  manager_name: string | null;
  channel: string | null;
  import_id: number | null;
  date_from: string | null;
  date_to: string | null;
}

export interface ManagerReportHeader {
  filters: ManagerReportFilters;
}

// Верхние KPI
export interface ManagerReportOverview {
  dialogs_count: number;
  analyzed_count: number;
  average_quality_score: number | null;
  lost_count: number;
  dialogs_with_manager_errors_count: number;
  attention_required_count: number;
}

// Универсальный элемент метрики: статусы диалогов, топ ошибок/возражений,
// частые ошибки менеджера. percent === null — нет базы для расчёта;
// сумма процентов не обязана быть 100% (доля проанализированных диалогов).
export interface ReportMetricItem {
  key: string;
  label: string;
  count: number;
  percent: number | null;
  related_dialog_ids: number[];
}

// Базовый блок «тема» (training_topics / script_fixes)
export interface ReportTopicItem {
  title: string;
  description: string;
  count: number | null;
  related_dialog_ids: number[];
}

// Причины потери заявок
export interface ReportLossReason extends ReportTopicItem {
  key: string | null;
}

// Рекомендации (next_actions)
export interface ReportNextAction extends ReportTopicItem {
  key: string;
}

// Менеджер в блоке развития команды
export interface ReportManagerGrowth {
  manager_id: number | null;
  manager_name: string;
  dialogs_count: number;
  analyzed_count: number;
  lost_count: number;
  dialogs_with_errors_count: number;
  average_quality_score: number | null;
  frequent_errors: ReportMetricItem[];
  growth_zones: string[];
  main_growth_zone: string | null;
}

// Диалог для ручного разбора
export interface ReportReviewDialog {
  id: number;
  title: string;
  manager_id: number | null;
  manager_name: string | null;
  outcome: DialogOutcome | null;
  outcome_label: string | null;
  client_temperature: ClientTemperature | null;
  client_temperature_label: string | null;
  quality_score: number | null;
  reason: string;
  reason_label: string;
}

// GET /reports/manager — Response
export interface ManagerReportResponse {
  state: ManagerReportState;
  header: ManagerReportHeader;
  overview: ManagerReportOverview;
  outcomes: ReportMetricItem[];
  executive_summary: string[];
  loss_reasons: ReportLossReason[];
  next_actions: ReportNextAction[];
  training_topics: ReportTopicItem[];
  script_fixes: ReportTopicItem[];
  top_manager_errors: ReportMetricItem[];
  top_objections: ReportMetricItem[];
  managers_growth: ReportManagerGrowth[];
  review_dialogs: ReportReviewDialog[];
  warnings: string[];
}
