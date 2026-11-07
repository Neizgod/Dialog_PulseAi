import { useEffect, useRef } from "react";
import styles from "./ManualImportUI.module.css";
// Кнопки «Импортировать / Импортировать и анализировать» — как на confirm
import confirm from "../CsvConfirmUI/ConfirmUI.module.css";
import sparkles from "../../../assets/images/sparkle.svg";
import warning from "../../../assets/images/warningicon.svg";

interface Props {
  rawText: string;
  onRawText: (v: string) => void;
  managerName: string;
  onManagerName: (v: string) => void;
  masked: boolean;
  onMaskedChange: (v: boolean) => void;
  maskTooltip: string;
  onImport: () => void;
  onImportAndAnalyze: () => void;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}

export const ManualImportUI = ({
  rawText,
  onRawText,
  managerName,
  onManagerName,
  masked,
  onMaskedChange,
  maskTooltip,
  onImport,
  onImportAndAnalyze,
  isLoading,
  errorMessage,
  onRetry,
}: Props) => {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const hasContent = rawText.trim().length > 0;

  // Автоувеличение высоты поля под контент (до max-height, дальше — скролл)
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [rawText]);

  const disabled = !hasContent || isLoading;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Ручная вставка</h1>
        <p className={styles.description}>
          Скопируйте и вставьте текст диалога
        </p>
      </header>

      <div className={styles.inputsRow}>
        <div className={styles.dialogField}>
          <textarea
            ref={taRef}
            className={`${styles.textarea} ${
              errorMessage ? styles.textareaError : ""
            } customScroll`}
            value={rawText}
            onChange={(e) => onRawText(e.target.value)}
            placeholder="Поле для вашего диалога"
          />
          {errorMessage && (
            <div className={styles.errorBlock}>
              <img src={warning} alt="" />
              {errorMessage}
            </div>
          )}
        </div>

        <div className={styles.floatField}>
          <input
            id="managerName"
            className={styles.floatInput}
            value={managerName}
            onChange={(e) => onManagerName(e.target.value)}
            placeholder=" "
          />
          <label htmlFor="managerName" className={styles.floatLabel}>
            Имя менеджера
          </label>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.hint}>
          <p className={styles.hintTitle}>Для более быстрого теста:</p>
          <p className={styles.hintText}>
            Используйте формат Клиент: / Менеджер:, чтобы сервису было проще
            распознать роли.
          </p>
        </div>

        <div className={styles.footerRight}>
          {errorMessage ? (
            <button
              type="button"
              className={styles.retryBtn}
              onClick={onRetry}
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 12a9 9 0 1 1 2.64 6.36M3 20v-5h5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {isLoading ? "Загрузка" : "Попробовать снова"}
            </button>
          ) : (
            <div className={confirm.importButtons}>
              <button
                type="button"
                className={confirm.importBtn}
                onClick={onImport}
                disabled={disabled}
              >
                {isLoading ? "Загрузка" : "Импортировать"}
              </button>
              <button
                type="button"
                className={confirm.importAnalyzeBtn}
                onClick={onImportAndAnalyze}
                disabled={disabled}
              >
                {isLoading ? "Загрузка" : "Импортировать и анализировать"}
                <span className={confirm.sparklesIcon}>
                  <img src={sparkles} alt="" />
                </span>
              </button>
            </div>
          )}

          {/* Маскирование — появляется, когда есть текст */}
          {hasContent && (
            <div className={styles.maskControl}>
              <input
                type="checkbox"
                id="maskManual"
                className={styles.maskCheckbox}
                checked={masked}
                onChange={(e) => onMaskedChange(e.target.checked)}
              />
              <label htmlFor="maskManual" className={styles.maskLabel}>
                Маскировать персональные данные перед анализом
              </label>
              <span className={styles.helpWrap}>
                <span className={styles.helpIcon}>?</span>
                <span className={styles.tooltip} role="tooltip">
                  {maskTooltip}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
