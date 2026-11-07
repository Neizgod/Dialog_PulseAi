import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { getDashboardManagersAPI } from "../../utils/dialog-pulse-api";
import { dialogsQueryToParams } from "../../utils/dialogsQuery";
import { ManagersUI } from "../ui/ManagersUI/ManagersUI";
import type {
  DashboardManager,
  ManagersSortBy,
} from "../../utils/types/dashboard.types";
import type { DialogOutcome } from "../../utils/types/common.types";
import type { SortOrder } from "../../utils/types/dialogs.types";

const PAGE_SIZE = 30;

export const Managers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  // Та же страница используется и в дашборде (/dashboard/managers), и в отчёте
  // (/reports/managers) — отличается только адресом возврата.
  const isReports = location.pathname.startsWith("/reports");
  // Кнопку «Назад» показываем только если пришли из дашборда/отчёта (?back=1).
  // При заходе через сайдбар параметра нет — кнопки не будет.
  const showBack = searchParams.get("back") === "1";
  const [items, setItems] = useState<DashboardManager[]>([]);
  const [loading, setLoading] = useState(true);

  // Источник истины — URL
  const sortBy = (searchParams.get("sort_by") ??
    "average_quality_score") as ManagersSortBy;
  const sortOrder = (searchParams.get("sort_order") ?? "asc") as SortOrder;
  const managerFilter = searchParams.get("manager") ?? "";
  // Срез может прийти из дашборда (канал/импорт/период)
  const channel = searchParams.get("channel") ?? undefined;
  const importId = searchParams.get("import_id") ?? undefined;
  const outcome = searchParams.get("outcome") as DialogOutcome | null;
  const dateFrom = searchParams.get("date_from") ?? undefined;
  const dateTo = searchParams.get("date_to") ?? undefined;

  // Значения дропдаунов (оба заполнены; активна сортировка по sort_by)
  const scoreOrder =
    sortBy === "average_quality_score" ? sortOrder : "asc";
  const lostOrder = sortBy === "lost_count" ? sortOrder : "desc";

  const fetchKey = [
    sortBy,
    sortOrder,
    channel ?? "",
    importId ?? "",
    outcome ?? "",
    dateFrom ?? "",
    dateTo ?? "",
  ].join("|");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getDashboardManagersAPI({
      sort_by: sortBy,
      sort_order: sortOrder,
      channel,
      import_id: importId ? Number(importId) : undefined,
      outcome: outcome ?? undefined,
      date_from: dateFrom,
      date_to: dateTo,
      page_size: PAGE_SIZE,
    })
      .then((res) => {
        if (active) setItems(res.items);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey]);

  // Обновление URL
  const setParam = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([k, v]) => {
        if (v) next.set(k, v);
        else next.delete(k);
      });
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const handleScoreOrder = useCallback(
    (v: string) => setParam({ sort_by: "average_quality_score", sort_order: v }),
    [setParam]
  );
  const handleLostOrder = useCallback(
    (v: string) => setParam({ sort_by: "lost_count", sort_order: v }),
    [setParam]
  );
  const handleManager = useCallback(
    (v: string) => setParam({ manager: v || undefined }),
    [setParam]
  );

  // Клиентский фильтр по выбранному менеджеру
  const visible = useMemo(
    () =>
      managerFilter
        ? items.filter((m) => String(m.manager_id) === managerFilter)
        : items,
    [items, managerFilter]
  );

  const managerOptions = useMemo(
    () =>
      items
        .filter((m) => m.manager_id != null)
        .map((m) => ({ value: String(m.manager_id), label: m.manager_name })),
    [items]
  );

  const handleCardClick = useCallback(
    (id: number) => {
      const params = dialogsQueryToParams({
        manager_id: id,
        channel,
        import_id: importId ? Number(importId) : undefined,
        outcome: outcome ?? undefined,
        date_from: dateFrom,
        date_to: dateTo,
      });
      // from → в списке покажем кнопку «К списку менеджеров» с возвратом сюда же
      params.set("from", isReports ? "report-managers" : "managers");
      navigate(`/dialogs?${params.toString()}`);
    },
    [navigate, isReports, channel, importId, outcome, dateFrom, dateTo]
  );

  return (
    <ManagersUI
      items={visible}
      loading={loading}
      scoreOrder={scoreOrder}
      onScoreOrder={handleScoreOrder}
      lostOrder={lostOrder}
      onLostOrder={handleLostOrder}
      managerValue={managerFilter}
      managerOptions={managerOptions}
      onManager={handleManager}
      backLabel={showBack ? (isReports ? "К отчёту" : "К дашборду") : undefined}
      onBack={
        showBack
          ? () => navigate(isReports ? "/reports" : "/dashboard")
          : undefined
      }
      onCardClick={handleCardClick}
    />
  );
};
