// Парсинг/сборка фильтров дашборда из/в URLSearchParams (URL — источник истины).
import type { DashboardSummaryQuery } from "./types/dashboard.types";
import type { DialogOutcome } from "./types/common.types";

export const parseDashboardQuery = (
  sp: URLSearchParams
): DashboardSummaryQuery => {
  const num = (k: string): number | undefined => {
    const v = sp.get(k);
    if (v == null || v === "" || isNaN(Number(v))) return undefined;
    return Number(v);
  };
  const str = (k: string): string | undefined => sp.get(k) || undefined;

  return {
    manager_id: num("manager_id"),
    channel: str("channel"),
    import_id: num("import_id"),
    outcome: str("outcome") as DialogOutcome | undefined,
    date_from: str("date_from"),
    date_to: str("date_to"),
    top_limit: num("top_limit"),
  };
};

export const dashboardQueryToParams = (
  q: DashboardSummaryQuery
): URLSearchParams => {
  const sp = new URLSearchParams();
  (Object.entries(q) as [string, unknown][]).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    sp.set(key, String(value));
  });
  return sp;
};
