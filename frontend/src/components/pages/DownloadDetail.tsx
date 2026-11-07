import { useState, useEffect, useCallback, useMemo } from "react";
import { usePolling } from "../../hooks/usePolling";
import {
  useParams,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import {
  getImportLoadDetailsAPI,
  getProgressAnalysisAPI,
  getDialogsListAPI,
  runImportAnalysisAsyncAPI,
  batchRunAnalysisAPI,
} from "../../utils/dialog-pulse-api";
import {
  DownloadDetailUI,
  type DownloadScreenState,
} from "../ui/DownloadDetailUI/DownloadDetailUI";
import type { ImportBatchRead } from "../../utils/types/imports.types";
import type { ImportAnalysisProgressResponse } from "../../utils/types/analysis.types";
import type { DialogsListResponse } from "../../utils/types/dialogs.types";

const PAGE_SIZE = 7;

// Состояние экрана по import.status + progress.status (логика из спецификации)
function computeState(
  batch: ImportBatchRead | null,
  progress: ImportAnalysisProgressResponse | null
): DownloadScreenState {
  const s = batch?.status;
  if (!progress) {
    if (s === "analysis_failed") return "analysis_failed";
    if (s === "analysis_processing") return "processing";
    if (s === "analysis_completed") return "completed";
    if (s === "analysis_completed_with_errors") return "completed_with_errors";
    return "pending";
  }
  if (progress.dialogs_count === 0 || progress.status === "empty") return "empty";
  if (s === "analysis_failed") return "analysis_failed";
  if (
    s === "analysis_processing" ||
    progress.status === "processing" ||
    progress.processing_count > 0
  )
    return "processing";
  if (
    s === "analysis_completed_with_errors" ||
    progress.status === "completed_with_errors"
  )
    return "completed_with_errors";
  if (s === "analysis_completed" || progress.status === "completed")
    return "completed";
  if (progress.status === "partially_completed") return "partially_completed";
  return "pending";
}

export const DownloadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const importId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();

  const [batch, setBatch] = useState<ImportBatchRead | null>(null);
  const [progress, setProgress] =
    useState<ImportAnalysisProgressResponse | null>(null);
  const [list, setList] = useState<DialogsListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [runLoading, setRunLoading] = useState(false);
  // Форсируем polling (после запуска анализа / если пришли сразу из confirm)
  const [polling, setPolling] = useState<boolean>(
    Boolean((location.state as { started?: boolean } | null)?.started)
  );

  const dialogQuery = useMemo(
    () => ({
      import_id: importId,
      page,
      page_size: PAGE_SIZE,
      sort_by: "created_at" as const,
      sort_order: "asc" as const,
    }),
    [importId, page]
  );

  // Первичная загрузка импорта + прогресса
  useEffect(() => {
    if (!Number.isFinite(importId)) return;
    let active = true;
    Promise.all([
      getImportLoadDetailsAPI(importId).catch(() => null),
      getProgressAnalysisAPI(importId).catch(() => null),
    ]).then(([b, p]) => {
      if (!active) return;
      setBatch(b);
      setProgress(p);
    });
    return () => {
      active = false;
    };
  }, [importId]);

  // Список диалогов (по id и странице)
  useEffect(() => {
    if (!Number.isFinite(importId)) return;
    let active = true;
    getDialogsListAPI(dialogQuery)
      .then((res) => {
        if (active) setList(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [dialogQuery, importId]);

  const state = computeState(batch, progress);

  // Пока анализ идёт — включаем polling
  useEffect(() => {
    if (state === "processing" || state === "partially_completed")
      setPolling(true);
  }, [state]);

  // Polling: прогресс каждые 3с, диалоги каждые 9с; стоп на терминальном статусе
  const pollActive = polling && Number.isFinite(importId);
  usePolling(
    () => {
      getProgressAnalysisAPI(importId)
        .then((p) => {
          setProgress(p);
          if (
            p.status === "completed" ||
            p.status === "completed_with_errors" ||
            p.status === "empty"
          ) {
            setPolling(false);
            getImportLoadDetailsAPI(importId)
              .then((b) => b && setBatch(b))
              .catch(() => {});
            getDialogsListAPI(dialogQuery)
              .then(setList)
              .catch(() => {});
          }
        })
        .catch(() => {});
    },
    3000,
    pollActive
  );
  usePolling(
    () => {
      getDialogsListAPI(dialogQuery).then(setList).catch(() => {});
    },
    9000,
    pollActive
  );

  // Запуск / продолжение / повтор анализа
  const handleRun = useCallback(async () => {
    setRunLoading(true);
    try {
      await runImportAnalysisAsyncAPI(importId, { only_pending: true });
    } catch {
      // 400 «уже выполняется» и т.п. — не критично, просто продолжаем polling
    }
    setRunLoading(false);
    setPolling(true);
    getProgressAnalysisAPI(importId)
      .then(setProgress)
      .catch(() => {});
    getImportLoadDetailsAPI(importId)
      .then((b) => b && setBatch(b))
      .catch(() => {});
  }, [importId]);

  // Повторный анализ выбранных диалогов (batch). only_pending:false — чтобы
  // перезапустить даже уже готовые.
  const handleReanalyze = useCallback(
    (ids: number[]) => {
      if (ids.length === 0) return;
      batchRunAnalysisAPI({ dialog_ids: ids, only_pending: false }).catch(
        () => {}
      );
      // Оптимистично переводим в «Анализируется», чтобы запустился polling
      setProgress((prev) =>
        prev
          ? {
              ...prev,
              status: "processing",
              processing_count: Math.max(prev.processing_count, ids.length),
            }
          : prev
      );
      setPolling(true);
      getImportLoadDetailsAPI(importId)
        .then((b) => b && setBatch(b))
        .catch(() => {});
    },
    [importId]
  );

  const currentDialogLabel = useMemo(() => {
    const p = list?.items.find((d) => d.analysis_status === "processing");
    return p ? `#${p.external_dialog_id ?? p.id}` : null;
  }, [list]);

  if (!Number.isFinite(importId)) {
    return <Navigate to="/downloads" replace />;
  }

  return (
    <DownloadDetailUI
      batch={batch}
      progress={progress}
      state={state}
      currentDialogLabel={currentDialogLabel}
      dialogs={list?.items ?? []}
      total={list?.total ?? 0}
      page={page}
      pageSize={list?.page_size ?? PAGE_SIZE}
      pages={list?.pages ?? 1}
      runLoading={runLoading}
      onBack={() => navigate("/downloads")}
      onDashboard={() => navigate(`/dashboard?import_id=${importId}`)}
      onDialogs={() => navigate(`/dialogs?import_id=${importId}`)}
      onRun={handleRun}
      onReanalyze={handleReanalyze}
      onRowClick={(dialogId) => navigate(`/dialogs/${dialogId}`)}
      onPage={setPage}
    />
  );
};
