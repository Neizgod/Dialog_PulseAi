import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearData } from "../../services/slices/importSlice";

import type { AppDispatch } from "../../services/store";
import type { ActionCard, StatItem } from "../ui/importDone/ImportDoneUI";

import analyticsIcon from "../../assets/images/sparkleicon.svg";
import dialogsIcon from "../../assets/images/dialogsIcon.svg";
import reportsIcon from "../../assets/images/foldericon.svg";
import { ImportDoneUI } from "../ui/importDone/ImportDoneUI";
import { runImportAnalysisAsyncAPI } from "../../utils/dialog-pulse-api";

// Данные, которые каждый флоу импорта передаёт через navigate(path, { state })
export type ImportDoneState = {
  stats: StatItem[];
  isAnalysisStarted: boolean;
  // id импорта — нужен, чтобы запустить AI-анализ с этого экрана
  import_id: number;
};

const DIALOGS_CARD: ActionCard = {
  to: "/dialogs",
  icon: dialogsIcon,
  title: "К диалогам",
  description: "Просмотрите все импортированные диалоги",
};

const REPORTS_CARD: ActionCard = {
  to: "/reports",
  icon: reportsIcon,
  title: "Просмотрите отчеты",
  description: "Просмотрите существующие отчеты и метрики",
};

export const ImportDone = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const state = location.state as ImportDoneState | null;

  if (!state) {
    return <Navigate to="/import" replace />;
  }

  const { isAnalysisStarted, stats, import_id } = state;

  const title = isAnalysisStarted
    ? "Импорт завершён, начали AI-анализ диалога!"
    : "Импорт завершён успешно!";

  const description = isAnalysisStarted
    ? "Файл был успешно обработан и данные импортированы в систему. AI-анализ запущен, по окончании работы можете посмотреть анализ"
    : "Файл был успешно обработан и данные импортированы в систему. Запустите AI-анализ сейчас, чтоб получить отчеты по диалогам";

  // Ставим AI-анализ всего импорта в фоновую очередь (run-async) и ведём в диалоги;
  // ответ приходит сразу (queued), прогресс виден там через polling статуса processing.
  const handleRunAnalysis = () => {
    runImportAnalysisAsyncAPI(import_id, { only_pending: true }).catch(() => {});
    navigate("/dialogs");
  };

  const ANALYSIS_CARD: ActionCard = {
    onClick: handleRunAnalysis,
    icon: analyticsIcon,
    title: "Запустить AI-анализ",
    description: "Начните AI-анализ диалогов прямо сейчас",
  };

  // Если анализ уже запущен — кнопку "Запустить AI-анализ" не показываем
  const actionCards = isAnalysisStarted
    ? [DIALOGS_CARD, REPORTS_CARD]
    : [ANALYSIS_CARD, DIALOGS_CARD, REPORTS_CARD];

  const handleUploadMore = () => {
    dispatch(clearData());
    navigate("/import");
  };

  return (
    <ImportDoneUI
      title={title}
      description={description}
      stats={stats}
      actionCards={actionCards}
      onUploadMore={handleUploadMore}
    />
  );
};
