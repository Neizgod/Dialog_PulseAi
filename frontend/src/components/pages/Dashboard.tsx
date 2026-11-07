import { useEffect, useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../services/store";
import {
  dashboardSelector,
  fetchDashboardSummary,
} from "../../services/slices/dashboardSlice";
import {
  dialogsSliceSelector,
  fetchManagers,
} from "../../services/slices/dialogsSlice";
import { DashboardUI } from "../ui/DashboardUI/DashboardUI";
import { dialogsQueryToParams } from "../../utils/dialogsQuery";
import {
  parseDashboardQuery,
  dashboardQueryToParams,
} from "../../utils/dashboardQuery";
import type { DashboardSummaryQuery } from "../../utils/types/dashboard.types";
import type { DialogsListQuery } from "../../utils/types/dialogs.types";
import type { DialogOutcome } from "../../utils/types/common.types";
import type { DropdownOption } from "../ui/Dropdown/Dropdown";
import {
  getDashboardOptionsAPI,
  getImports,
} from "../../utils/dialog-pulse-api";

export const Dashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { summary, summaryRequest } = useAppSelector(dashboardSelector);
  const { managers } = useAppSelector(dialogsSliceSelector);
  const [outcomeOptions, setOutcomeOptions] = useState<DropdownOption[]>([]);
  const [channelOptions, setChannelOptions] = useState<DropdownOption[]>([]);
  const [importOptions, setImportOptions] = useState<DropdownOption[]>([]);

  // Фильтры дашборда — из URL (источник истины)
  const filters = useMemo(
    () => parseDashboardQuery(searchParams),
    [searchParams]
  );

  // Загрузка сводки при смене фильтров (URL)
  useEffect(() => {
    dispatch(fetchDashboardSummary(filters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, searchParams]);

  // Опции фильтра менеджеров — полный список (без среза), чтобы при выборе
  // канала/менеджера/периода остальные варианты не пропадали из списка
  useEffect(() => {
    dispatch(fetchManagers());
  }, [dispatch]);

  useEffect(() => {
    let active = true;

    getDashboardOptionsAPI()
      .then((res) => {
        if (!active) return;
        setOutcomeOptions(res.outcomes);
        setChannelOptions(res.channels);
      })
      .catch(() => {
        if (!active) return;
        setOutcomeOptions([]);
        setChannelOptions([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    getImports({ page: 1, page_size: 100 })
      .then((res) => {
        if (!active) return;
        setImportOptions(
          res.items.map((item) => ({
            value: String(item.id),
            label: item.original_filename
              ? `${item.original_filename} · #${item.id}`
              : `Загрузка #${item.id}`,
          }))
        );
      })
      .catch(() => {
        if (!active) return;
        setImportOptions([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const setFilters = useCallback(
    (patch: DashboardSummaryQuery) =>
      setSearchParams(dashboardQueryToParams({ ...filters, ...patch })),
    [setSearchParams, filters]
  );

  // input[type=date] даёт YYYY-MM-DD → разворачиваем в начало/конец дня
  const handlePeriodFrom = useCallback(
    (v: string) => setFilters({ date_from: v ? `${v}T00:00:00` : undefined }),
    [setFilters]
  );
  const handlePeriodTo = useCallback(
    (v: string) => setFilters({ date_to: v ? `${v}T23:59:59` : undefined }),
    [setFilters]
  );
  const handleManager = useCallback(
    (v: string) => setFilters({ manager_id: v ? Number(v) : undefined }),
    [setFilters]
  );
  const handleChannel = useCallback(
    (v: string) => setFilters({ channel: v || undefined }),
    [setFilters]
  );
  const handleOutcome = useCallback(
    (v: string) =>
      setFilters({ outcome: (v || undefined) as DialogOutcome | undefined }),
    [setFilters]
  );
  const handleImport = useCallback(
    (v: string) => setFilters({ import_id: v ? Number(v) : undefined }),
    [setFilters]
  );

  // Любой клик по KPI/сектору/ошибке: глобальные фильтры дашборда + фильтр клика
  // → формируем query и переходим на /dialogs (URL — источник истины фильтров)
  const handleDialogsFilter = useCallback(
    (extra: Partial<DialogsListQuery>) => {
      const base: DialogsListQuery = {
        manager_id: filters.manager_id,
        channel: filters.channel,
        import_id: filters.import_id,
        outcome: filters.outcome,
        date_from: filters.date_from,
        date_to: filters.date_to,
      };
      const params = dialogsQueryToParams({ ...base, ...extra });
      // from=dashboard → в списке покажем кнопку «К дашборду»
      params.set("from", "dashboard");
      navigate(`/dialogs?${params.toString()}`);
    },
    [navigate, filters]
  );

  // from=dashboard → в карточке кнопка «назад» будет вести на дашборд
  const handleOpenDialog = useCallback(
    (id: number) => navigate(`/dialogs/${id}?from=dashboard`),
    [navigate]
  );

  // «Сформировать отчёт» → переход на /reports с выбранными в окне фильтрами
  const handleGenerateReport = useCallback(
    (f: { from: string; to: string; manager: string; channel: string }) => {
      const params = new URLSearchParams();
      if (f.from) params.set("date_from", `${f.from}T00:00:00`);
      if (f.to) params.set("date_to", `${f.to}T23:59:59`);
      if (f.manager) params.set("manager_id", f.manager);
      if (f.channel) params.set("channel", f.channel);
      const qs = params.toString();
      navigate(`/reports${qs ? `?${qs}` : ""}`);
    },
    [navigate]
  );

  const managerOptions = useMemo(
    () => managers.map((m) => ({ value: String(m.id), label: m.name })),
    [managers]
  );

  const filtersDisabled = importOptions.length === 0;

  // Дата для input[type=date] — берём только YYYY-MM-DD из ISO
  const periodFrom = filters.date_from?.slice(0, 10) ?? "";
  const periodTo = filters.date_to?.slice(0, 10) ?? "";

  return (
    <DashboardUI
      summary={summary}
      loading={summaryRequest && summary === null}
      periodFrom={periodFrom}
      periodTo={periodTo}
      onPeriodFrom={handlePeriodFrom}
      onPeriodTo={handlePeriodTo}
      managerValue={filters.manager_id != null ? String(filters.manager_id) : ""}
      managerOptions={managerOptions}
      onManager={handleManager}
      channelValue={filters.channel ?? ""}
      channelOptions={channelOptions}
      onChannel={handleChannel}
      outcomeValue={filters.outcome ?? ""}
      outcomeOptions={outcomeOptions}
      onOutcome={handleOutcome}
      importValue={filters.import_id != null ? String(filters.import_id) : ""}
      importOptions={importOptions}
      onImport={handleImport}
      filtersDisabled={filtersDisabled}
      onDialogsFilter={handleDialogsFilter}
      onOpenDialog={handleOpenDialog}
      onGenerateReport={handleGenerateReport}
      onSeeAllManagers={() => {
        const params = new URLSearchParams(searchParams);
        params.set("back", "1"); // показать кнопку «К дашборду»
        navigate(`/dashboard/managers?${params.toString()}`);
      }}
    />
  );
};
