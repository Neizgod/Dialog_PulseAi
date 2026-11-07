import { useEffect, useState } from "react";
import { AiSettingsUI, type CheckView } from "../ui/AiSettingsUI/AiSettingsUI";
import type { DropdownOption } from "../ui/Dropdown/Dropdown";
import {
  getAiSettingsAPI,
  getAiSettingsOptionsAPI,
  updateAiSettingsAPI,
  checkAnalysisModelAPI,
  checkAudioModelAPI,
} from "../../utils/dialog-pulse-api";
import type {
  AiSettingsOptions,
  AiSettingsResponse,
  AiCheckResult,
  AiAnalysisSettingsUpdate,
  AiAudioSettingsUpdate,
} from "../../utils/types/ai-settings.types";

// Разумные пресеты для выпадающих списков
const TEMP_PRESETS = ["0", "0.1", "0.2", "0.3", "0.5", "0.7", "1"];
const TOKEN_PRESETS = ["1024", "2048", "4096", "8192"];
const TIMEOUT_PRESETS = ["30", "60", "120", "300", "600", "900"];
const AUDIO_TIMEOUT_PRESETS = ["300", "600", "900", "1200"];

// Если текущего значения нет в пресетах — добавляем его первым
const buildOptions = (
  presets: string[],
  current: string,
  suffix = ""
): DropdownOption[] => {
  const values = presets.includes(current) ? presets : [current, ...presets];
  return values.map((v) => ({ value: v, label: suffix ? `${v}${suffix}` : v }));
};

const relTime = (iso: string | null): string => {
  if (!iso) return "Подключение работает";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "Подключение работает";
  const min = Math.floor(Math.max(0, Date.now() - t) / 60000);
  if (min < 1) return "Только что";
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.floor(h / 24)} дн назад`;
};

const checkView = (check: AiCheckResult | null): CheckView => {
  if (!check || check.status === "not_checked")
    return { label: "Не проверялось", variant: "neutral" };
  if (check.status === "error")
    return { label: "Ошибка подключения", variant: "error" };
  return { label: relTime(check.checked_at), variant: "success" };
};

type AnalysisForm = {
  provider: string;
  apiKey: string;
  apiUrl: string;
  model: string;
  temperature: string;
  maxTokens: string;
  timeout: string;
};

type AudioForm = {
  provider: string;
  useAnalysisKey: boolean;
  apiKey: string;
  model: string;
  timeout: string;
};

export const AiSettings = () => {
  const [options, setOptions] = useState<AiSettingsOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingAnalysis, setCheckingAnalysis] = useState(false);
  const [checkingAudio, setCheckingAudio] = useState(false);

  const [analysis, setAnalysis] = useState<AnalysisForm>({
    provider: "openai",
    apiKey: "",
    apiUrl: "",
    model: "",
    temperature: "0.2",
    maxTokens: "4096",
    timeout: "120",
  });
  const [hasAnalysisKey, setHasAnalysisKey] = useState(false);
  const [analysisCheck, setAnalysisCheck] = useState<AiCheckResult | null>(null);

  const [audio, setAudio] = useState<AudioForm>({
    provider: "openai",
    useAnalysisKey: true,
    apiKey: "",
    model: "",
    timeout: "900",
  });
  const [hasAudioKey, setHasAudioKey] = useState(false);
  const [audioCheck, setAudioCheck] = useState<AiCheckResult | null>(null);

  // Заполняем формы из ответа (при загрузке и после сохранения)
  const applyResponse = (s: AiSettingsResponse) => {
    setAnalysis({
      provider: s.analysis.provider,
      apiKey: "",
      apiUrl: s.analysis.api_url ?? "",
      model: s.analysis.model,
      temperature: String(s.analysis.temperature),
      maxTokens: String(s.analysis.max_output_tokens),
      timeout: String(s.analysis.timeout_seconds),
    });
    setHasAnalysisKey(s.analysis.has_api_key);
    setAnalysisCheck(s.analysis.last_check);
    setAudio({
      provider: s.audio.provider,
      useAnalysisKey: s.audio.use_analysis_api_key,
      apiKey: "",
      model: s.audio.model,
      timeout: String(s.audio.timeout_seconds),
    });
    setHasAudioKey(s.audio.has_api_key);
    setAudioCheck(s.audio.last_check);
  };

  // Сначала опции формы, затем текущие настройки
  useEffect(() => {
    let active = true;
    Promise.all([getAiSettingsOptionsAPI(), getAiSettingsAPI()])
      .then(([opts, settings]) => {
        if (!active) return;
        setOptions(opts);
        applyResponse(settings);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const analysisUpdate: AiAnalysisSettingsUpdate = {
        provider: analysis.provider,
        api_url:
          analysis.provider === "openai_compatible"
            ? analysis.apiUrl || null
            : null,
        model: analysis.model,
        temperature: Number(analysis.temperature),
        max_output_tokens: Number(analysis.maxTokens),
        timeout_seconds: Number(analysis.timeout),
      };
      // Ключ отправляем только если пользователь ввёл новый
      if (analysis.apiKey.trim()) analysisUpdate.api_key = analysis.apiKey.trim();

      const audioUpdate: AiAudioSettingsUpdate = {
        provider: audio.provider,
        use_analysis_api_key: audio.useAnalysisKey,
        model: audio.model,
        timeout_seconds: Number(audio.timeout),
      };
      if (!audio.useAnalysisKey && audio.apiKey.trim())
        audioUpdate.api_key = audio.apiKey.trim();

      const res = await updateAiSettingsAPI({
        analysis: analysisUpdate,
        audio: audioUpdate,
      });
      applyResponse(res);
    } catch (error) {
      console.error("Не удалось сохранить настройки:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCheckAnalysis = async () => {
    setCheckingAnalysis(true);
    try {
      setAnalysisCheck(await checkAnalysisModelAPI());
    } catch (error) {
      console.error(error);
    } finally {
      setCheckingAnalysis(false);
    }
  };

  const handleCheckAudio = async () => {
    setCheckingAudio(true);
    try {
      setAudioCheck(await checkAudioModelAPI());
    } catch (error) {
      console.error(error);
    } finally {
      setCheckingAudio(false);
    }
  };

  return (
    <AiSettingsUI
      loading={loading}
      analysis={{
        providerOptions: options?.analysis_providers ?? [],
        provider: analysis.provider,
        onProvider: (v) => setAnalysis((f) => ({ ...f, provider: v })),
        apiKey: analysis.apiKey,
        onApiKey: (v) => setAnalysis((f) => ({ ...f, apiKey: v })),
        hasApiKey: hasAnalysisKey,
        apiUrl: analysis.apiUrl,
        onApiUrl: (v) => setAnalysis((f) => ({ ...f, apiUrl: v })),
        model: analysis.model,
        onModel: (v) => setAnalysis((f) => ({ ...f, model: v })),
        temperature: analysis.temperature,
        onTemperature: (v) => setAnalysis((f) => ({ ...f, temperature: v })),
        temperatureOptions: buildOptions(TEMP_PRESETS, analysis.temperature),
        maxTokens: analysis.maxTokens,
        onMaxTokens: (v) => setAnalysis((f) => ({ ...f, maxTokens: v })),
        maxTokensOptions: buildOptions(TOKEN_PRESETS, analysis.maxTokens),
        timeout: analysis.timeout,
        onTimeout: (v) => setAnalysis((f) => ({ ...f, timeout: v })),
        timeoutOptions: buildOptions(
          TIMEOUT_PRESETS,
          analysis.timeout,
          " секунд"
        ),
      }}
      audio={{
        providerOptions: options?.audio_providers ?? [],
        provider: audio.provider,
        onProvider: (v) => setAudio((f) => ({ ...f, provider: v })),
        useAnalysisKey: audio.useAnalysisKey,
        onUseAnalysisKey: (v) => setAudio((f) => ({ ...f, useAnalysisKey: v })),
        apiKey: audio.apiKey,
        onApiKey: (v) => setAudio((f) => ({ ...f, apiKey: v })),
        hasApiKey: hasAudioKey,
        model: audio.model,
        onModel: (v) => setAudio((f) => ({ ...f, model: v })),
        timeout: audio.timeout,
        onTimeout: (v) => setAudio((f) => ({ ...f, timeout: v })),
        timeoutOptions: buildOptions(
          AUDIO_TIMEOUT_PRESETS,
          audio.timeout,
          " секунд"
        ),
        check: checkView(audioCheck),
        onCheck: handleCheckAudio,
        checking: checkingAudio,
      }}
      analysisCheck={checkView(analysisCheck)}
      onCheckAnalysis={handleCheckAnalysis}
      checkingAnalysis={checkingAnalysis}
      onSave={handleSave}
      saving={saving}
    />
  );
};
