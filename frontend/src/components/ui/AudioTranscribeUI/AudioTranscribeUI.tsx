import styles from "./AudioTranscribeUI.module.css";
// Кнопки «Назад/Далее» переиспользуем со страницы предпросмотра CSV
import csv from "../CsvPreviewUI/csvPreviewUI.module.css";
import arrow from "../../../assets/images/arrow.svg";
import warning from "../../../assets/images/warningicon.svg";

export type AudioTranscribeState = "processing" | "done" | "error";

interface Props {
  state: AudioTranscribeState;
  percent: number;
  onRetry: () => void;
  onBack: () => void;
  onUploadAnother: () => void;
  onNext: () => void;
}

export const AudioTranscribeUI = ({
  state,
  percent,
  onRetry,
  onBack,
  onUploadAnother,
  onNext,
}: Props) => {
  const isError = state === "error";
  // «Далее» доступна только когда расшифровка завершена
  const canProceed = state === "done";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Расшифровываем аудио</h1>
        <p className={styles.description}>
          Система распознаёт речь и собирает текст разговора
        </p>
      </header>

      {isError && (
        <div className={styles.errorBlock}>
          <span className={styles.errorTitle}>
            <img src={warning} alt="" />
            Не удалось расшифровать аудио
          </span>
          <p className={styles.errorHint}>
            Попробуйте загрузить другой файл или проверьте качество записи
          </p>
        </div>
      )}

      <div className={styles.progressRow}>
        <span className={`${styles.percent} ${isError ? styles.percentError : ""}`}>
          {isError ? "XX" : percent}
          <span className={styles.percentSign}>%</span>
        </span>

        <div className={styles.bar}>
          <div className={`${styles.hatch} ${isError ? styles.hatchError : ""}`} />
          {!isError && (
            <div className={styles.fill} style={{ width: `${percent}%` }} />
          )}
        </div>
      </div>

      {isError && (
        <button className={styles.retryBtn} onClick={onRetry} type="button">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 12a9 9 0 1 1 2.64 6.36M3 20v-5h5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Повторить
        </button>
      )}

      <div className={styles.footer}>
        <button
          className={csv.backBtn}
          onClick={isError ? onUploadAnother : onBack}
          type="button"
        >
          <span className={csv.backIcon}>
            <img src={arrow} alt="" />
          </span>
          {isError ? "Загрузить другой файл" : "Назад"}
        </button>
        <button
          className={csv.nextBtn}
          onClick={onNext}
          type="button"
          disabled={!canProceed}
        >
          Далее
          <span>
            <img src={arrow} alt="" />
          </span>
        </button>
      </div>
    </div>
  );
};
