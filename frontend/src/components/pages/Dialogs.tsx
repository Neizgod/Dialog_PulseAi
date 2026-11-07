import { useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../services/store";
import {
  dialogsSliceSelector,
  fetchDialogsSummary,
  fetchDialogsList,
  fetchManagers,
  runBatchAnalysis,
  toggleSelect,
  selectAllOnPage,
  clearSelection,
} from "../../services/slices/dialogsSlice";
import { DialogsUI } from "../ui/DialogsUI/DialogsUI";
import {
  parseDialogsQuery,
  dialogsQueryToParams,
} from "../../utils/dialogsQuery";
import type {
  DialogPreset,
  DialogSortBy,
  SortOrder,
  DialogsListQuery,
} from "../../utils/types/dialogs.types";
import type {
  DialogAnalysisStatus,
  DialogOutcome,
} from "../../utils/types/common.types";

const PAGE_SIZE = 5;
const DEFAULT_SORT_BY: DialogSortBy = "created_at";
const DEFAULT_SORT_ORDER: SortOrder = "desc";

export const Dialogs = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { summary, summaryRequest, list, listRequest, selectedIds, batchRequest, managers } =
    useAppSelector(dialogsSliceSelector);

  // Фильтры/сортировка/страница — из URL (источник истины)
  const query = useMemo(() => parseDialogsQuery(searchParams), [searchParams]);
  const page = query.page ?? 1;
  const sortBy = query.sort_by ?? DEFAULT_SORT_BY;
  const sortOrder = query.sort_order ?? DEFAULT_SORT_ORDER;
  const preset = query.preset ?? null;

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Откуда зашли (?from=dashboard | managers) — показываем кнопку возврата.
  // parseDialogsQuery игнорирует ключ from, поэтому сохраняем его отдельно.
  const from = searchParams.get("from");
  const backNav =
    from === "dashboard"
      ? { label: "К дашборду", to: "/dashboard" }
      : from === "managers"
      ? { label: "К списку менеджеров", to: "/dashboard/managers?back=1" }
      : from === "report"
      ? { label: "К отчёту", to: "/reports" }
      : from === "report-managers"
      ? { label: "К списку менеджеров", to: "/reports/managers?back=1" }
      : null;

  // Обновление URL. По умолчанию сбрасываем страницу и выбор (как при смене фильтра).
  const setParams = useCallback(
    (
      patch: Partial<DialogsListQuery>,
      opts?: { keepPage?: boolean; keepSelection?: boolean }
    ) => {
      const next: DialogsListQuery = { ...query, ...patch };
      if (!opts?.keepPage) delete next.page;
      if (!opts?.keepSelection) dispatch(clearSelection());
      const params = dialogsQueryToParams(next);
      // Сохраняем признак захода (дашборд/менеджеры) при смене фильтров
      if (from) params.set("from", from);
      setSearchParams(params);
    },
    [query, setSearchParams, dispatch, from]
  );

  // Query для списка (с дефолтами сортировки/страницы) и для сводки (без них)
  const listQuery = useMemo<DialogsListQuery>(
    () => ({
      ...query,
      sort_by: sortBy,
      sort_order: sortOrder,
      page,
      page_size: PAGE_SIZE,
    }),
    [query, sortBy, sortOrder, page]
  );
  const summaryQuery = useMemo<DialogsListQuery>(() => {
    const rest = { ...query };
    delete rest.page;
    delete rest.sort_by;
    delete rest.sort_order;
    return rest;
  }, [query]);

  const listKey = searchParams.toString();
  const summaryKey = useMemo(() => JSON.stringify(summaryQuery), [summaryQuery]);

  // Список — при любом изменении URL
  useEffect(() => {
    dispatch(fetchDialogsList(listQuery));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, listKey]);

  // Сводка — только при смене фильтров (без page/сортировки)
  useEffect(() => {
    dispatch(fetchDialogsSummary(summaryQuery));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, summaryKey]);

  // Список менеджеров для фильтра — полный список (без среза), чтобы варианты
  // не пропадали при выбранном канале/периоде
  useEffect(() => {
    dispatch(fetchManagers());
  }, [dispatch]);

  // Polling, пока есть диалоги в статусе "processing"
  const hasProcessing = (list?.items ?? []).some(
    (item) => item.analysis_status === "processing"
  );

  useEffect(() => {
    if (!hasProcessing) return;
    const POLL_INTERVAL = 4000;
    const MAX_TICKS = 75;
    let ticks = 0;
    const interval = setInterval(() => {
      ticks += 1;
      dispatch(fetchDialogsList(listQuery));
      dispatch(fetchDialogsSummary(summaryQuery));
      if (ticks >= MAX_TICKS) clearInterval(interval);
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasProcessing, listKey, summaryKey]);

  // ===== Обработчики фильтров (пишут в URL) =====
  const handlePreset = useCallback(
    (p: DialogPreset | null) => setParams({ preset: p ?? undefined }),
    [setParams]
  );
  const handleFilterOutcome = useCallback(
    (v: string) => setParams({ outcome: v ? (v as DialogOutcome) : undefined }),
    [setParams]
  );
  const handleFilterStatus = useCallback(
    (v: string) =>
      setParams({ analysis_status: v ? (v as DialogAnalysisStatus) : undefined }),
    [setParams]
  );
  const handleFilterObjection = useCallback(
    (v: string) => setParams({ objection: v || undefined }),
    [setParams]
  );
  const handleFilterManagerError = useCallback(
    (v: string) => setParams({ manager_error: v || undefined }),
    [setParams]
  );
  const handleFilterRisk = useCallback(
    (v: string) => setParams({ risk_flag: v || undefined }),
    [setParams]
  );
  const handleFilterManager = useCallback(
    (v: string) => setParams({ manager_id: v ? Number(v) : undefined }),
    [setParams]
  );
  const handleScoreMin = useCallback(
    (v: number) => setParams({ score_min: v > 0 ? v : undefined }),
    [setParams]
  );
  const handleScoreMax = useCallback(
    (v: number) => setParams({ score_max: v < 100 ? v : undefined }),
    [setParams]
  );
  const handleSort = useCallback(
    (nextSortBy: DialogSortBy, nextSortOrder: SortOrder) =>
      setParams({ sort_by: nextSortBy, sort_order: nextSortOrder }),
    [setParams]
  );
  const handlePage = useCallback(
    (p: number) => setParams({ page: p }, { keepPage: true, keepSelection: true }),
    [setParams]
  );
  const handleSearch = useCallback(
    (value: string) => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        setParams({ search: value.trim() || undefined });
      }, 400);
    },
    [setParams]
  );

  // Переход в карточку — передаём текущий срез, чтобы навигация работала по выборке
  const handleRowClick = useCallback(
    (id: number) => {
      const qs = searchParams.toString();
      navigate(`/dialogs/${id}${qs ? `?${qs}` : ""}`);
    },
    [navigate, searchParams]
  );

  const handleToggleSelect = useCallback(
    (id: number) => dispatch(toggleSelect(id)),
    [dispatch]
  );
  // «Выбрать все на странице» копит выбор между страницами: добавляем id
  // страницы к накопленному, а при повторном клике снимаем только их.
  const handleSelectAll = useCallback(
    (pageIds: number[]) => {
      const allSelected =
        pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
      const next = allSelected
        ? selectedIds.filter((id) => !pageIds.includes(id))
        : Array.from(new Set([...selectedIds, ...pageIds]));
      dispatch(selectAllOnPage(next));
    },
    [dispatch, selectedIds]
  );

  const handleRunAnalysis = useCallback(() => {
    const processingIds = new Set(
      (list?.items ?? [])
        .filter((item) => item.analysis_status === "processing")
        .map((item) => item.id)
    );
    const idsToRun = selectedIds.filter((id) => !processingIds.has(id));
    if (idsToRun.length === 0) return;
    dispatch(runBatchAnalysis({ dialog_ids: idsToRun, only_pending: false }));
  }, [dispatch, selectedIds, list]);

  const items = list?.items ?? [];
  const total = list?.total ?? 0;
  const pages = list?.pages ?? 1;
  const currentPageSize = list?.page_size ?? PAGE_SIZE;

  const managerOptions = managers.map((m) => ({
    value: String(m.id),
    label: m.name,
  }));

  return (
    <DialogsUI
      summary={summary}
      summaryLoading={summaryRequest && summary === null}
      items={items}
      listLoading={listRequest && list === null}
      total={total}
      page={page}
      pageSize={currentPageSize}
      pages={pages}
      preset={preset}
      onPreset={handlePreset}
      search={query.search ?? ""}
      onSearch={handleSearch}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={handleSort}
      filterManager={query.manager_id != null ? String(query.manager_id) : ""}
      onFilterManager={handleFilterManager}
      managerOptions={managerOptions}
      filterOutcome={query.outcome ?? ""}
      onFilterOutcome={handleFilterOutcome}
      filterStatus={query.analysis_status ?? ""}
      onFilterStatus={handleFilterStatus}
      filterObjection={query.objection ?? ""}
      onFilterObjection={handleFilterObjection}
      filterManagerError={query.manager_error ?? ""}
      onFilterManagerError={handleFilterManagerError}
      filterRisk={query.risk_flag ?? ""}
      onFilterRisk={handleFilterRisk}
      scoreMin={query.score_min ?? 0}
      scoreMax={query.score_max ?? 100}
      onScoreMin={handleScoreMin}
      onScoreMax={handleScoreMax}
      selectedIds={selectedIds}
      onToggleSelect={handleToggleSelect}
      onSelectAll={handleSelectAll}
      batchLoading={batchRequest}
      onRunAnalysis={handleRunAnalysis}
      onPage={handlePage}
      onRowClick={handleRowClick}
      backLabel={backNav?.label}
      onBack={backNav ? () => navigate(backNav.to) : undefined}
    />
  );
};
