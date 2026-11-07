// ============================================================
// DialogPulse — Dashboard Types
// GET /dashboard/summary
// GET /dashboard/managers
// ============================================================

import type {
  DialogOutcome,
  ClientTemperature,
  LabeledCount,
} from './common.types';
import type { SortOrder } from './dialogs.types';

// ============================================================
// GET /dashboard/summary
// ============================================================

export interface DashboardSummaryQuery {
  manager_id?: number;
  channel?: string;
  import_id?: number;
  outcome?: DialogOutcome;
  date_from?: string;
  date_to?: string;
  top_limit?: number;
}

// GET /dashboard/options — Response
export interface DashboardOptionItem {
  value: string;
  label: string;
}

export interface DashboardOptionsResponse {
  outcomes: DashboardOptionItem[];
  channels: DashboardOptionItem[];
}

// Точка графика динамики (average_quality_score = null — пропуск точки)
export interface DashboardDynamicsPoint {
  date: string;
  dialogs_count: number;
  analyzed_count: number;
  lost_count: number;
  average_quality_score: number | null;
}

// Диалог в блоке «требующие внимания». Клик открывает GET /dialogs/{id}
export interface AttentionDialog {
  id: number;
  title: string;
  manager_id: number | null;
  manager_name: string;
  outcome: DialogOutcome;
  outcome_label: string;
  client_temperature: ClientTemperature;
  client_temperature_label: string;
  quality_score: number | null;
  reason: string;
  reason_label: string;
}

// Менеджер в сводке/списке. manager_id = null → группа «Не указан»
export interface DashboardManager {
  manager_id: number | null;
  manager_external_id: string | null;
  manager_name: string;
  dialogs_count: number;
  analyzed_count: number;
  lost_count: number;
  dialogs_with_errors_count: number;
  average_quality_score: number | null;
  most_frequent_error: LabeledCount | null;
}

// GET /dashboard/summary — Response
export interface DashboardSummaryResponse {
  // KPI
  dialogs_count: number;
  analyzed_count: number;
  lost_count: number;
  average_quality_score: number | null;
  dialogs_with_manager_errors_count: number;
  attention_required_count: number;
  analysis_errors_count: number;
  not_analyzed_count: number;
  processing_count: number;
  // Распределения и топы (backend отдаёт key + label + count)
  outcomes: LabeledCount[];
  client_temperatures: LabeledCount[];
  top_objections: LabeledCount[];
  top_manager_errors: LabeledCount[];
  top_risk_flags: LabeledCount[];
  // Динамика (график средней оценки и т.д.)
  dynamics: DashboardDynamicsPoint[];
  // Диалоги, требующие внимания
  attention_dialogs: AttentionDialog[];
  // Короткий блок менеджеров (полный список — GET /dashboard/managers)
  managers: DashboardManager[];
}

// ============================================================
// GET /dashboard/managers (полный список менеджеров)
// ============================================================

export type ManagersSortBy =
  | 'dialogs_count'
  | 'lost_count'
  | 'average_quality_score'
  | 'dialogs_with_errors_count';

export interface DashboardManagersQuery {
  channel?: string;
  import_id?: number;
  outcome?: DialogOutcome;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
  sort_by?: ManagersSortBy;
  sort_order?: SortOrder;
}

// GET /dashboard/managers — Response
export interface DashboardManagersResponse {
  items: DashboardManager[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
