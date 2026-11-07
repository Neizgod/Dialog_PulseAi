import styles from "./ConfirmUI.module.css";
import arrow from "../../../assets/images/arrow.svg";
import sparkles from "../../../assets/images/sparkle.svg";
import telegram from "../../../assets/images/telegramIcon.svg";
import whatsapp from "../../../assets/images/whatsappIcon.svg";
import vk from "../../../assets/images/vkIcon.svg";
import warning from "../../../assets/images/warningicon.svg";

import type {
  DialogPreview,
  RowError,
} from "../../../utils/types/imports.types";
import { formatChannel } from "../../../utils/utils";


const CHANNEL_ICONS: Record<string, string> = {
  telegram: telegram,
  whatsapp: whatsapp,
  vk: vk,
};

type StatItem = {
  value: number;
  label: string;
  isError?: boolean;
};

type ConfirmUIProps = {
  stats: StatItem[];
  errorsCount: number;
  rowErrors: RowError[];
  warnings: string[];
  dialogPreviews: DialogPreview[];
  onBack: () => void;
  onImport: () => void;
  onImportAndAnalyze: () => void;
  isLoading: boolean;
  mapping_valid: boolean;
};

export const ConfirmUI = ({
  stats,
  errorsCount,
  rowErrors,
  warnings,
  dialogPreviews,
  onBack,
  onImport,
  onImportAndAnalyze,
  isLoading,
  mapping_valid,
}: ConfirmUIProps) => {
  const uniqueReasons = [...new Set(rowErrors.map((e) => e.reason))];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Подтверждение импорта</h1>
        <p className={styles.description}>
          Проверьте собранные диалоги и подтвердите импорт
        </p>
      </header>

      <div className={styles.statsRow}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.statItem}>
            <span
              className={`${styles.statValue} ${stat.isError ? styles.statValueError : ""}`}
            >
              {stat.value.toLocaleString("ru-RU")}
            </span>
            <span
              className={`${styles.statLabel} ${stat.isError ? styles.statLabelError : ""}`}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {!mapping_valid && (
        <div className={styles.invalidBlock}>
          <span className={styles.errorIcon}>
            <img src={warning} />
          </span>
          <span>
            Сопоставление не прошло проверку. Импорт недоступен — вернитесь на
            шаг «Роли» и исправьте настройки.
          </span>
        </div>
      )}

      {warnings.length > 0 && (
        <div className={styles.warnBlock}>
          <span className={styles.warnIcon}>
            <img src={warning} />
          </span>
          <ul className={styles.warnList}>
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {errorsCount > 0 && (
        <div className={styles.errorBlock}>
          <div className={styles.errorBlockLeft}>
            <div className={styles.errorTitle}>
              <span className={styles.errorIcon}><img src={warning} /></span>
              <span>{errorsCount} строк не будут импортированы</span>
            </div>
            {uniqueReasons.length > 0 && (
              <div className={styles.errorReasons}>
                <span className={styles.errorReasonsLabel}>Причины:</span>
                <ul className={styles.errorReasonsList}>
                  {uniqueReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button className={styles.errorRowsBtn} type="button">
            Строки с ошибками
            <span className={styles.errorRowsArrow}>›</span>
          </button>
        </div>
      )}

      {dialogPreviews.length > 0 && (
        <div className={styles.previewSection}>
          <p className={styles.previewTitle}>Примеры собранных диалогов</p>
          <div className={`${styles.previewCards} customScroll`}>
            {dialogPreviews.map((dialog) => {
              const channelKey = dialog.channel?.toLowerCase() ?? "";
              const channelIcon = CHANNEL_ICONS[channelKey] ? <img src={CHANNEL_ICONS[channelKey]} /> : "💬";

              return (
                <div key={dialog.dialog_external_id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardChannelIcon}>
                      {channelIcon}
                    </span>
                    <span className={styles.cardTitle}>
                      Диалог #{dialog.dialog_external_id}
                    </span>
                  </div>
                  <div className={styles.cardMeta}>
                    {dialog.manager_name}
                    {dialog.channel
                      ? ` • ${formatChannel(dialog.channel)}`
                      : ""}
                  </div>
                  <div className={styles.cardMessages}>
                    {dialog.messages.slice(0, 3).map((msg, i) => (
                      <p key={i} className={styles.cardMessage}>
                        <span className={styles.cardMessageRole}>
                          {msg.sender_role === "manager"
                            ? "Менеджер"
                            : "Клиент"}
                          :
                        </span>{" "}
                        {msg.text.replace(/^"|"$/g, "")}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.buttonsWrapper}>
        <button className={styles.backBtn} onClick={onBack} type="button">
          <span className={styles.backIcon}>
            <img src={arrow} alt="" />
          </span>
          Назад
        </button>
        <div className={styles.importButtons}>
          <button
            className={styles.importBtn}
            onClick={onImport}
            type="button"
            disabled={isLoading || !mapping_valid}
          >
            {isLoading ? "Загрузка" : "Импортировать"}
          </button>
          <button
            className={styles.importAnalyzeBtn}
            onClick={onImportAndAnalyze}
            type="button"
            disabled={isLoading || !mapping_valid}
          >
            {isLoading ? "Загрузка" : "Импортировать и анализировать"}
            <span className={styles.sparklesIcon}>
              <img src={sparkles} alt="" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
