import { useEffect, useCallback, useMemo } from "react";
import { usePolling } from "../../hooks/usePolling";
import {
  useParams,
  useNavigate,
  Navigate,
  useSearchParams,
} from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../services/store";
import {
  dialogCardSelector,
  fetchDialogDetail,
  fetchDialogNavigation,
  runDialogCardAnalysis,
  clearDialogCard,
} from "../../services/slices/dialogCardSlice";
import { DialogCardUI } from "../ui/DialogCardUI/DialogCardUI";
import { parseDialogsQuery } from "../../utils/dialogsQuery";

export const DialogCard = () => {
  const { id } = useParams<{ id: string }>();
  const dialogId = Number(id);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { detail, detailRequest, detailError, navigation, runRequest } =
    useAppSelector(dialogCardSelector);

  // Срез берём из URL карточки (его передали из списка) — чтобы навигация
  // (предыдущий/следующий) строилась по той же выборке.
  const navQuery = useMemo(
    () => parseDialogsQuery(searchParams),
    [searchParams]
  );

  // Загрузка карточки и навигации при заходе и при смене id (prev/next).
  // navQuery намеренно не в зависимостях: фильтры фиксируются на момент захода.
  useEffect(() => {
    if (!Number.isFinite(dialogId)) return;
    dispatch(fetchDialogDetail(dialogId));
    dispatch(fetchDialogNavigation({ dialog_id: dialogId, query: navQuery }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, dialogId]);

  // Сброс при уходе со страницы
  useEffect(() => () => void dispatch(clearDialogCard()), [dispatch]);

  // Polling, пока анализ выполняется
  const status = detail?.analysis_status;
  usePolling(
    () => dispatch(fetchDialogDetail(dialogId)),
    4000,
    status === "processing"
  );

  // Сохраняем срез (query) при возврате в список и при переходах prev/next
  const qs = searchParams.toString();
  const suffix = qs ? `?${qs}` : "";

  // Откуда зашли (?from=...) — кнопка «назад» ведёт туда. Иначе — в список
  // диалогов (с сохранением среза в suffix при prev/next).
  const from = searchParams.get("from");
  const backNav =
    from === "dashboard"
      ? { label: "К дашборду", to: "/dashboard" }
      : from === "report"
      ? { label: "К отчёту", to: "/reports" }
      : null;
  const backLabel = backNav?.label ?? "К списку диалогов";

  const handleBack = useCallback(
    () => navigate(backNav ? backNav.to : `/dialogs${suffix}`),
    [navigate, suffix, backNav]
  );

  const handlePrev = useCallback(() => {
    if (navigation?.previous_dialog_id != null) {
      navigate(`/dialogs/${navigation.previous_dialog_id}${suffix}`);
    }
  }, [navigate, navigation, suffix]);

  const handleNext = useCallback(() => {
    if (navigation?.next_dialog_id != null) {
      navigate(`/dialogs/${navigation.next_dialog_id}${suffix}`);
    }
  }, [navigate, navigation, suffix]);

  const handleRun = useCallback(() => {
    if (Number.isFinite(dialogId)) dispatch(runDialogCardAnalysis(dialogId));
  }, [dispatch, dialogId]);

  if (!Number.isFinite(dialogId)) {
    return <Navigate to="/dialogs" replace />;
  }

  // Загрузка показывается при первом заходе и при смене id (старый detail ещё от
  // предыдущего диалога), но не во время polling, когда detail уже актуален.
  const loading = detailRequest && detail?.id !== dialogId;

  return (
    <DialogCardUI
      detail={detail?.id === dialogId ? detail : null}
      loading={loading}
      error={detailError?.message ?? null}
      navigation={navigation}
      runLoading={runRequest}
      backLabel={backLabel}
      onBack={handleBack}
      onPrev={handlePrev}
      onNext={handleNext}
      onRun={handleRun}
    />
  );
};
