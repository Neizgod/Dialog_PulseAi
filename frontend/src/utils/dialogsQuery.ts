// Парсинг/сборка фильтров списка диалогов из/в URLSearchParams.
// URL — источник истины для фильтров, сортировки и страницы.
import type {
  DialogsListQuery,
  DialogSortBy,
  SortOrder,
  DialogPreset,
} from "./types/dialogs.types";
import type {
  DialogAnalysisStatus,
  DialogOutcome,
  ClientTemperature,
} from "./types/common.types";

export const parseDialogsQuery = (sp: URLSearchParams): DialogsListQuery => {
  const num = (k: string): number | undefined => {
    const v = sp.get(k);
    if (v == null || v === "" || isNaN(Number(v))) return undefined;
    return Number(v);
  };
  const str = (k: string): string | undefined => sp.get(k) || undefined;

  return {
    page: num("page"),
    manager_id: num("manager_id"),
    channel: str("channel"),
    analysis_status: str("analysis_status") as DialogAnalysisStatus | undefined,
    outcome: str("outcome") as DialogOutcome | undefined,
    client_temperature: str("client_temperature") as
      | ClientTemperature
      | undefined,
    score_min: num("score_min"),
    score_max: num("score_max"),
    import_id: num("import_id"),
    date_from: str("date_from"),
    date_to: str("date_to"),
    preset: str("preset") as DialogPreset | undefined,
    objection: str("objection"),
    manager_error: str("manager_error"),
    has_manager_errors:
      sp.get("has_manager_errors") === "true" ? true : undefined,
    risk_flag: str("risk_flag"),
    search: str("search"),
    sort_by: str("sort_by") as DialogSortBy | undefined,
    sort_order: str("sort_order") as SortOrder | undefined,
  };
};

// Собираем URLSearchParams, пропуская пустые значения
export const dialogsQueryToParams = (q: DialogsListQuery): URLSearchParams => {
  const sp = new URLSearchParams();
  (Object.entries(q) as [string, unknown][]).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    sp.set(key, String(value));
  });
  return sp;
};
