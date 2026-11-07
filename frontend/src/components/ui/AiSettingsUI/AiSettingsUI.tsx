import styles from "./AiSettingsUI.module.css";
import { Dropdown, type DropdownOption } from "../Dropdown/Dropdown";
import type { AiProviderOption } from "../../../utils/types/ai-settings.types";

export type CheckView = {
  label: string;
  variant: "success" | "error" | "neutral";
};

// ===== Радио-список провайдеров =====
function Providers({
  options,
  value,
  onChange,
  renderFields,
}: {
  options: AiProviderOption[];
  value: string;
  onChange: (v: string) => void;
  renderFields: (provider: string) => React.ReactNode;
}) {
  return (
    <div className={styles.providers}>
      {options.map((opt) => (
        <div key={opt.value}>
          <button
            type="button"
            className={styles.radioItem}
            disabled={!opt.enabled}
            onClick={() => opt.enabled && onChange(opt.value)}
          >
            <span
              className={`${styles.radioMark} ${
                value === opt.value ? styles.radioMarkActive : ""
              }`}
            />
            <span className={styles.radioLabel}>{opt.label}</span>
          </button>
          {value === opt.value && opt.enabled && (
            <div className={styles.providerFields}>{renderFields(opt.value)}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// Подчёркнутое текстовое поле
function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        className={styles.textInput}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// Параметр-выпадашка
function ParamSelect({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  options: DropdownOption[];
  onChange: (v: string) => void;
}) {
  return (
    <div className={styles.paramItem}>
      <div className={styles.paramLabel}>{label}</div>
      <div className={styles.paramHint}>{hint}</div>
      <Dropdown
        value={value}
        options={options}
        onChange={onChange}
        className={styles.paramSelect}
      />
    </div>
  );
}

function StatusLine({ check }: { check: CheckView }) {
  const cls =
    check.variant === "success"
      ? styles.statusSuccess
      : check.variant === "error"
        ? styles.statusError
        : styles.statusNeutral;
  return (
    <span className={styles.status}>
      Статус последней проверки:{" "}
      <span className={`${styles.statusValue} ${cls}`}>{check.label}</span>
    </span>
  );
}

export interface AnalysisBlockProps {
  providerOptions: AiProviderOption[];
  provider: string;
  onProvider: (v: string) => void;
  apiKey: string;
  onApiKey: (v: string) => void;
  hasApiKey: boolean;
  apiUrl: string;
  onApiUrl: (v: string) => void;
  model: string;
  onModel: (v: string) => void;
  temperature: string;
  onTemperature: (v: string) => void;
  temperatureOptions: DropdownOption[];
  maxTokens: string;
  onMaxTokens: (v: string) => void;
  maxTokensOptions: DropdownOption[];
  timeout: string;
  onTimeout: (v: string) => void;
  timeoutOptions: DropdownOption[];
}

export interface AudioBlockProps {
  providerOptions: AiProviderOption[];
  provider: string;
  onProvider: (v: string) => void;
  useAnalysisKey: boolean;
  onUseAnalysisKey: (v: boolean) => void;
  apiKey: string;
  onApiKey: (v: string) => void;
  hasApiKey: boolean;
  model: string;
  onModel: (v: string) => void;
  timeout: string;
  onTimeout: (v: string) => void;
  timeoutOptions: DropdownOption[];
  check: CheckView;
  onCheck: () => void;
  checking: boolean;
}

interface Props {
  loading: boolean;
  analysis: AnalysisBlockProps;
  audio: AudioBlockProps;
  analysisCheck: CheckView;
  onCheckAnalysis: () => void;
  checkingAnalysis: boolean;
  onSave: () => void;
  saving: boolean;
}

const keyPlaceholder = (hasKey: boolean) =>
  hasKey ? "Ключ уже сохранён" : "Введите API-ключ";

export const AiSettingsUI = ({
  loading,
  analysis,
  audio,
  analysisCheck,
  onCheckAnalysis,
  checkingAnalysis,
  onSave,
  saving,
}: Props) => {
  return (
    <div className={styles.page}>
      <div className={`${styles.scroll} customScroll`}>
        <header className={styles.header}>
          <h1 className={styles.h1}>AI-настройки</h1>
          <p className={styles.description}>
            Настройки модели, которая генерирует ответы на вопросы пользователей
          </p>
        </header>

        {loading ? (
          <div className={styles.loading}>Загрузка настроек…</div>
        ) : (
          <div className={styles.columns}>
            {/* ===== Блок анализа ===== */}
            <section className={styles.block}>
              <div className={styles.blockTitle}>Для анализа диалогов</div>

              <div className={styles.sectionTitle}>Активный провайдер</div>
              <Providers
                options={analysis.providerOptions}
                value={analysis.provider}
                onChange={analysis.onProvider}
                renderFields={(provider) => (
                  <>
                    {provider === "openai_compatible" && (
                      <TextField
                        label="API URL"
                        value={analysis.apiUrl}
                        onChange={analysis.onApiUrl}
                        placeholder="https://…"
                      />
                    )}
                    <TextField
                      label="API-ключ"
                      value={analysis.apiKey}
                      onChange={analysis.onApiKey}
                      placeholder={keyPlaceholder(analysis.hasApiKey)}
                    />
                    <TextField
                      label="Модель"
                      value={analysis.model}
                      onChange={analysis.onModel}
                      placeholder="Название модели"
                    />
                  </>
                )}
              />

              <div className={styles.sectionTitle}>Параметры анализа</div>
              <div className={styles.params}>
                <ParamSelect
                  label="Температура"
                  hint="Чем ниже значение, тем стабильнее анализ"
                  value={analysis.temperature}
                  options={analysis.temperatureOptions}
                  onChange={analysis.onTemperature}
                />
                <ParamSelect
                  label="Максимальная длина ответа"
                  hint="Ограничивает максимальный размер ответа модели"
                  value={analysis.maxTokens}
                  options={analysis.maxTokensOptions}
                  onChange={analysis.onMaxTokens}
                />
                <ParamSelect
                  label="Время ожидания ответа"
                  hint="Сколько ждать ответ модели перед ошибкой"
                  value={analysis.timeout}
                  options={analysis.timeoutOptions}
                  onChange={analysis.onTimeout}
                />
              </div>

              <div className={styles.inlineCheck}>
                <StatusLine check={analysisCheck} />
                <button
                  type="button"
                  className={styles.checkBtn}
                  onClick={onCheckAnalysis}
                  disabled={checkingAnalysis || loading}
                >
                  {checkingAnalysis ? "Проверяем…" : "Проверить модель анализа"}
                </button>
              </div>
            </section>

            {/* ===== Блок расшифровки аудио ===== */}
            <section className={`${styles.block} ${styles.blockRight}`}>
              <div className={styles.blockTitle}>Для расшифровки аудио</div>

              <div className={styles.sectionTitle}>Активный провайдер</div>
              <Providers
                options={audio.providerOptions}
                value={audio.provider}
                onChange={audio.onProvider}
                renderFields={() => (
                  <>
                    <label className={styles.checkRow}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={audio.useAnalysisKey}
                        onChange={(e) => audio.onUseAnalysisKey(e.target.checked)}
                      />
                      <span className={styles.checkLabel}>
                        Использовать API-ключ OpenAI из настроек анализа
                      </span>
                    </label>
                    {!audio.useAnalysisKey && (
                      <TextField
                        label="API-ключ"
                        value={audio.apiKey}
                        onChange={audio.onApiKey}
                        placeholder={keyPlaceholder(audio.hasApiKey)}
                      />
                    )}
                    <TextField
                      label="Модель расшифровки"
                      value={audio.model}
                      onChange={audio.onModel}
                      placeholder="Название модели"
                    />
                  </>
                )}
              />

              <div className={styles.sectionTitle}>Параметры расшифровки</div>
              <div className={styles.params}>
                <ParamSelect
                  label="Время ожидания ответа"
                  hint="Сколько ждать расшифровку перед ошибкой"
                  value={audio.timeout}
                  options={audio.timeoutOptions}
                  onChange={audio.onTimeout}
                />
              </div>

              <div className={styles.inlineCheck}>
                <StatusLine check={audio.check} />
                <button
                  type="button"
                  className={styles.checkBtn}
                  onClick={audio.onCheck}
                  disabled={audio.checking}
                >
                  {audio.checking ? "Проверяем…" : "Проверить расшифровку аудио"}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Плавающая кнопка сохранения — поверх контента, правый нижний угол */}
      <div className={styles.saveFloat}>
        <button
          type="button"
          className={styles.saveBtn}
          onClick={onSave}
          disabled={saving || loading}
        >
          {saving ? "Сохраняем…" : "Сохранить"}
        </button>
      </div>
    </div>
  );
};
