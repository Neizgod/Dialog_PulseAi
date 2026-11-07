import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getManagerReportAPI } from "../../utils/dialog-pulse-api";
import { dialogsQueryToParams } from "../../utils/dialogsQuery";
import { ReportUI } from "../ui/ReportUI/ReportUI";
import type {
  ManagerReportResponse,
  ManagerReportQuery,
} from "../../utils/types/reports.types";
import type { ApiError } from "../../utils/types/common.types";

export const Reports = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [report, setReport] = useState<ManagerReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Фильтры отчёта берём из URL (как на дашборде)
  const query = useMemo<ManagerReportQuery>(() => {
    const num = (k: string): number | undefined => {
      const v = searchParams.get(k);
      return v && !isNaN(Number(v)) ? Number(v) : undefined;
    };
    const str = (k: string): string | undefined => searchParams.get(k) || undefined;
    return {
      manager_id: num("manager_id"),
      channel: str("channel"),
      import_id: num("import_id"),
      date_from: str("date_from"),
      date_to: str("date_to"),
    };
  }, [searchParams]);

  const fetchKey = searchParams.toString();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getManagerReportAPI(query)
      .then((res) => {
        if (active) setReport(res);
      })
      .catch((e) => {
        if (active) {
          setReport(null);
          setError((e as ApiError)?.detail?.message ?? "Ошибка");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey]);

  // Открыть конкретный диалог (from=report → кнопка «К отчёту» в карточке)
  const handleOpenDialog = useCallback(
    (id: number) => navigate(`/dialogs/${id}?from=report`),
    [navigate]
  );

  // Открыть диалоги выбранного менеджера
  const handleOpenManager = useCallback(
    (id: number) => {
      const qs = dialogsQueryToParams({ manager_id: id }).toString();
      navigate(`/dialogs?${qs}`);
    },
    [navigate]
  );

  // Все менеджеры — та же страница, что у дашборда, но по адресу /reports/managers
  const handleSeeAllManagers = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.set("back", "1"); // показать кнопку «К отчёту»
    navigate(`/reports/managers?${params.toString()}`);
  }, [navigate, searchParams]);

  return (
    <ReportUI
      report={report}
      loading={loading}
      error={error}
      onOpenDialog={handleOpenDialog}
      onOpenManager={handleOpenManager}
      onSeeAllManagers={handleSeeAllManagers}
    />
  );
};
