import { useNavigate, Navigate } from "react-router-dom";
import {
  confirmImport,
  importSliceSelector,
} from "../../services/slices/importSlice";
import { ConfirmUI } from "../ui/CsvConfirmUI/ConfirmUI";
import { useAppDispatch, useAppSelector } from "../../services/store";
import { runImportAnalysisAsyncAPI } from "../../utils/dialog-pulse-api";
import type { ImportDoneState } from "../pages/ImportDone";

export const Confirm = () => {
  const navigate = useNavigate();
  const { mappingPreview, importRequest } = useAppSelector(importSliceSelector);
  const dispatch = useAppDispatch();

  if (!mappingPreview) {
    return <Navigate to="/import/csv" replace />;
  }

  const counts = mappingPreview.counts;

  const stats = [
    { value: counts.dialogs_count, label: "Диалога" },
    { value: counts.messages_count, label: "Сообщений" },
    { value: counts.rows_count, label: "Строк" },
    {
      value: counts.errors_count,
      label: "Ошибок",
      isError: counts.errors_count > 0,
    },
  ];

  const goToDone = (isAnalysisStarted: boolean) => {
    const state: ImportDoneState = {
      stats,
      isAnalysisStarted,
      import_id: mappingPreview.import_id,
    };
    navigate("/import/done", { state });
  };

  return (
    <ConfirmUI
      stats={stats}
      errorsCount={counts.errors_count}
      rowErrors={mappingPreview.row_errors ?? []}
      warnings={mappingPreview.warnings ?? []}
      dialogPreviews={mappingPreview.dialog_previews ?? []}
      onBack={() => navigate(-1)}
      onImport={async () => {
        await dispatch(
          confirmImport({
            import_id: mappingPreview.import_id,
            run_analysis: { run_analysis: false },
          })
        ).unwrap();
        goToDone(false);
      }}
      onImportAndAnalyze={async () => {
        // Импортируем диалоги (без авто-анализа), ставим AI-анализ в фоновую
        // очередь (run-async) и переходим на экран этой загрузки, где виден
        // прогресс (polling). started:true форсирует polling сразу после queued.
        await dispatch(
          confirmImport({
            import_id: mappingPreview.import_id,
            run_analysis: { run_analysis: false },
          })
        ).unwrap();
        runImportAnalysisAsyncAPI(mappingPreview.import_id, {
          only_pending: true,
        }).catch(() => {});
        navigate(`/downloads/${mappingPreview.import_id}`, {
          state: { started: true },
        });
      }}
      isLoading={importRequest}
      mapping_valid={mappingPreview.mapping_valid}
    />
  );
};
