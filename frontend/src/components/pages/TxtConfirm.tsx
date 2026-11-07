import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ConfirmUI } from "../ui/CsvConfirmUI/ConfirmUI";
import { useAppSelector } from "../../services/store";
import { importSliceSelector } from "../../services/slices/importSlice";
import {
  confirmImportAPI,
  runImportAnalysisAsyncAPI,
} from "../../utils/dialog-pulse-api";
import type { ImportDoneState } from "./ImportDone";
import type {
  DialogPreview,
  TxtPreviewResponse,
} from "../../utils/types/imports.types";
import type { SenderRole } from "../../utils/types/common.types";

export const TxtConfirm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Экран общий для TXT и аудио — база пути берётся из текущего URL
  const base = location.pathname.startsWith("/import/audio")
    ? "/import/audio"
    : "/import/txt";
  const { dialogsImportPreview } = useAppSelector(importSliceSelector);
  // preview хранит TxtPreviewResponse (для аудио — совместимый AudioPreviewResponse)
  const preview = dialogsImportPreview as unknown as TxtPreviewResponse | null;
  // Роли авторов приходят со страницы «Роли» через navigate state
  const authorRoles =
    (location.state as { authorRoles?: Record<string, string> } | null)
      ?.authorRoles ?? {};

  const [loading, setLoading] = useState(false);

  if (!preview) {
    return <Navigate to={base} replace />;
  }

  const errorsCount = preview.errors.length;

  const stats = [
    { value: preview.dialogs_count, label: "Диалога" },
    { value: preview.messages_count, label: "Сообщений" },
    { value: preview.rows_count, label: "Строк" },
    { value: errorsCount, label: "Ошибок", isError: errorsCount > 0 },
  ];

  // Автор, назначенный менеджером (для подписи карточки)
  const managerAuthor = Object.keys(authorRoles).find(
    (author) => authorRoles[author] === "manager"
  );

  // Приводим TXT-превью к форме DialogPreview, которую ждёт ConfirmUI.
  // Роль каждого сообщения берём из назначенных ролей авторов; канала у TXT нет.
  const dialogPreviews: DialogPreview[] = preview.dialog_previews.map((d) => ({
    dialog_external_id: d.external_dialog_id,
    manager_name: managerAuthor ?? d.title,
    manager_external_id: null,
    channel: "",
    messages_count: d.messages_count,
    messages: d.messages.map((m) => ({
      sender_role: (authorRoles[m.author] as SenderRole) ?? "unknown",
      sender_name: m.author,
      sender_external_id: null,
      direction: null,
      text: m.text,
    })),
  }));

  const goToDone = (isAnalysisStarted: boolean) => {
    const state: ImportDoneState = {
      stats,
      isAnalysisStarted,
      import_id: preview.import_id,
    };
    navigate("/import/done", { state });
  };

  return (
    <ConfirmUI
      stats={stats}
      errorsCount={errorsCount}
      rowErrors={preview.errors.map((reason, i) => ({
        row_number: i + 1,
        reason,
      }))}
      warnings={preview.warnings ?? []}
      dialogPreviews={dialogPreviews}
      onBack={() => navigate(`${base}/roles`)}
      onImport={async () => {
        setLoading(true);
        try {
          await confirmImportAPI(preview.import_id, { run_analysis: false });
          goToDone(false);
        } catch (error) {
          console.error("Ошибка импорта:", error);
        } finally {
          setLoading(false);
        }
      }}
      onImportAndAnalyze={async () => {
        // Импортируем без авто-анализа, ставим AI-анализ в фоновую очередь
        // (run-async) и ведём на экран этой загрузки с прогрессом.
        setLoading(true);
        try {
          await confirmImportAPI(preview.import_id, { run_analysis: false });
          runImportAnalysisAsyncAPI(preview.import_id, {
            only_pending: true,
          }).catch(() => {});
          navigate(`/downloads/${preview.import_id}`, {
            state: { started: true },
          });
        } catch (error) {
          console.error("Ошибка импорта:", error);
          setLoading(false);
        }
      }}
      isLoading={loading}
      mapping_valid={true}
    />
  );
};
