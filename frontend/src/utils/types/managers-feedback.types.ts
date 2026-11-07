// ============================================================
// DialogPulse — Managers & Feedback Types (расширенный функционал)
// GET  /managers/analytics
// POST /dialogs/{dialog_id}/analysis/feedback
// ============================================================

import type { FeedbackRating, TaggedItemWithCount } from './common.types';

// ============================================================
// Managers API
// ============================================================

export interface ManagerAnalyticsItem {
  manager_id: number;
  manager_name: string;
  dialogs_count: number;
  average_quality_score: number;
  success_count: number;
  lost_count: number;
  main_errors: TaggedItemWithCount[];
  main_objections: TaggedItemWithCount[];
}

// GET /managers/analytics — Response
export interface ManagersAnalyticsResponse {
  items: ManagerAnalyticsItem[];
}

// ============================================================
// GET /managers/options — список менеджеров для фильтра.
// Параметры (channel/import_id/date_from/date_to) сужают список под срез.
// ============================================================

export interface ManagersOptionsQuery {
  channel?: string;
  import_id?: number;
  date_from?: string;
  date_to?: string;
}

export interface ManagerOption {
  id: number;
  external_id: string | null;
  name: string;
  dialogs_count: number;
}

export interface ManagersOptionsResponse {
  items: ManagerOption[];
}

// ============================================================
// Feedback API
// ============================================================

// POST /dialogs/{dialog_id}/analysis/feedback — Request
export interface FeedbackRequest {
  rating: FeedbackRating;
  comment?: string;
}

// POST /dialogs/{dialog_id}/analysis/feedback — Response
export interface FeedbackResponse {
  dialog_id: number;
  rating: FeedbackRating;
  comment: string;
  created_at: string;
}
