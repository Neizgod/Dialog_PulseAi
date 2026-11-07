import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ManualImportUI } from "../ui/ManualImportUI/ManualImportUI";
import { postManualDialogAPI } from "../../utils/dialog-pulse-api";
import type { ImportDoneState } from "./ImportDone";
import type { StatItem } from "../ui/importDone/ImportDoneUI";

export const ManualImport = () => {
  const navigate = useNavigate();
  const [rawText, setRawText] = useState("");
  const [managerName, setManagerName] = useState("");
  const [masked, setMasked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Запоминаем последнее действие для кнопки «Попробовать снова»
  const [lastAnalysis, setLastAnalysis] = useState(false);

  // Ручная вставка создаёт диалог сразу (POST /imports/manual-dialog),
  // затем ведём на общий экран «Готово».
  const submit = async (runAnalysis: boolean) => {
    if (!rawText.trim() || loading) return;
    setLastAnalysis(runAnalysis);
    setLoading(true);
    setError(null);
    try {
      const res = await postManualDialogAPI({
        manager_name: managerName.trim(),
        raw_text: rawText,
        run_analysis: runAnalysis,
        redact_sensitive_data: masked,
      });
      const stats: StatItem[] = [
        { value: 1, label: "Диалог" },
        { value: res.messages_count, label: "Сообщений" },
      ];
      const state: ImportDoneState = {
        stats,
        isAnalysisStarted: res.analysis_started,
        import_id: res.import_id,
      };
      navigate("/import/done", { state });
    } catch (err) {
      console.error("Ошибка ручной вставки:", err);
      setError("Что-то пошло не так, попробуйте снова");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ManualImportUI
      rawText={rawText}
      onRawText={(v) => {
        setRawText(v);
        if (error) setError(null);
      }}
      managerName={managerName}
      onManagerName={setManagerName}
      masked={masked}
      onMaskedChange={setMasked}
      maskTooltip="Телефоны, email, паспортные данные, номера карт и другая чувствительная информация будет заменена на безопасные метки"
      onImport={() => submit(false)}
      onImportAndAnalyze={() => submit(true)}
      isLoading={loading}
      errorMessage={error}
      onRetry={() => submit(lastAnalysis)}
    />
  );
};
