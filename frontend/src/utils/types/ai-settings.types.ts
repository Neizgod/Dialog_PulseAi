// ============================================================
// DialogPulse — AI Settings Types (экран доступен только администратору)
// GET   /ai-settings/options
// GET   /ai-settings
// PATCH /ai-settings
// POST  /ai-settings/check-analysis
// POST  /ai-settings/check-audio
// GET   /imports/templates/{source_type}
// ============================================================

export type AnalysisProvider =
  | 'openai'
  | 'openai_compatible'
  | 'claude'
  | 'gemini';
export type AudioProvider = 'openai' | 'yandex_speechkit';

// Опция провайдера в форме. enabled=false → показываем в списке, но disabled.
export interface AiProviderOption {
  value: string;
  label: string;
  enabled: boolean;
}

// GET /ai-settings/options — опции для отрисовки формы
export interface AiSettingsOptions {
  analysis_providers: AiProviderOption[];
  audio_providers: AiProviderOption[];
  analysis_models: string[];
  audio_models: string[];
}

// Статус проверки подключения модели
export type AiCheckStatus = 'not_checked' | 'success' | 'error';

// Результат проверки: last_check в настройках и ответ check-analysis/check-audio
export interface AiCheckResult {
  status: AiCheckStatus;
  message: string;
  checked_at: string | null;
}

// Блок «Модель для анализа диалогов». Ключ backend не отдаёт — только has_api_key.
export interface AiAnalysisSettings {
  provider: string; // AnalysisProvider
  api_url: string | null; // нужен для openai_compatible
  model: string;
  temperature: number;
  max_output_tokens: number;
  timeout_seconds: number;
  has_api_key: boolean; // true → показываем «Ключ уже сохранён»
  last_check: AiCheckResult | null;
}

// Блок «Модель для расшифровки аудио»
export interface AiAudioSettings {
  provider: string; // AudioProvider
  use_analysis_api_key: boolean; // взять ключ из блока анализа
  model: string;
  timeout_seconds: number;
  has_api_key: boolean;
  last_check: AiCheckResult | null;
}

// GET /ai-settings — Response
export interface AiSettingsResponse {
  analysis: AiAnalysisSettings;
  audio: AiAudioSettings;
}

// PATCH /ai-settings — Request.
// api_key отправляем ТОЛЬКО если пользователь ввёл новый ключ (иначе не передаём —
// backend не затирает старый). При смене настроек last_check сбрасывается в not_checked.
export interface AiAnalysisSettingsUpdate {
  provider: string;
  api_key?: string;
  api_url?: string | null;
  model: string;
  temperature: number;
  max_output_tokens: number;
  timeout_seconds: number;
}

export interface AiAudioSettingsUpdate {
  provider: string;
  use_analysis_api_key: boolean;
  api_key?: string; // только если чекбокс выключен и введён новый ключ
  model: string;
  timeout_seconds: number;
}

export interface AiSettingsUpdateRequest {
  analysis: AiAnalysisSettingsUpdate;
  audio: AiAudioSettingsUpdate;
}

// GET /imports/templates/{source_type} — тип шаблона (audio без шаблона)
export type TemplateSourceType = 'csv' | 'txt' | 'markdown';
