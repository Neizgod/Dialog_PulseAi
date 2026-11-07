import { useState } from "react";
import styles from "./TxtPreviewUI.module.css";
// Инфо-карточку, карточку маскирования и футер переиспользуем с экрана CSV
import csv from "../CsvPreviewUI/csvPreviewUI.module.css";
import arrow from "../../../assets/images/arrow.svg";
import shield from "../../../assets/images/shield.svg";
import type {
  TxtDialogPreview,
  RedactionInfo,
} from "../../../utils/types/imports.types";

interface Props {
  fileName: string;
  dialogsCount: number;
  messagesCount: number;
  dialogs: TxtDialogPreview[];
  redaction?: RedactionInfo | null;
  onBack: () => void;
  onNext: () => void;
}

// Сколько сообщений показываем в свёрнутом состоянии карточки
const COLLAPSED_COUNT = 3;

const DialogCard = ({ dialog }: { dialog: TxtDialogPreview }) => {
  const [expanded, setExpanded] = useState(false);

  const canToggle = dialog.messages.length > COLLAPSED_COUNT;
  const visible = expanded
    ? dialog.messages
    : dialog.messages.slice(0, COLLAPSED_COUNT);

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>
        {dialog.title || `Диалог #${dialog.external_dialog_id}`}
      </h3>

      <div
        className={`${styles.messages} ${
          expanded ? styles.messagesScroll : ""
        } customScroll`}
      >
        {visible.map((message, index) => {
          // Сообщения ниже свёрнутого лимита появляются с анимацией «открывания»
          const isRevealed = expanded && index >= COLLAPSED_COUNT;
          return (
            <div
              key={message.position}
              className={`${styles.message} ${
                isRevealed ? styles.msgReveal : ""
              }`}
              style={
                isRevealed
                  ? { animationDelay: `${(index - COLLAPSED_COUNT) * 40}ms` }
                  : undefined
              }
            >
              <span className={styles.author}>{message.author}</span>
              {message.raw_timestamp && (
                <span className={styles.timestamp}>{message.raw_timestamp}</span>
              )}
              <span className={styles.text}>{message.text}</span>
            </div>
          );
        })}
      </div>

      {canToggle && (
        <button
          className={styles.toggle}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Скрыть" : "Показать все"}
        </button>
      )}
    </div>
  );
};

export const TxtPreviewUI = ({
  fileName,
  dialogsCount,
  messagesCount,
  dialogs,
  redaction,
  onBack,
  onNext,
}: Props) => {
  const s = redaction?.stats;
  // «Документы» — паспорта + СНИЛС + ИНН
  const documents = s ? s.passports + s.snils + s.inns : 0;
  return (
    <div className={`${styles.page} customScroll`}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Предпросмотр распознанных диалогов</h1>
        <p className={styles.description}>
          Проверьте, правильно ли система распознала реплики и участников
        </p>
      </header>

      <div className={styles.body}>
        {dialogs.length > 0 ? (
          <div className={styles.dialogs}>
            {dialogs.map((dialog) => (
              <DialogCard key={dialog.external_dialog_id} dialog={dialog} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>Не удалось распознать диалоги</div>
        )}

        <div className={styles.infoSticky}>
          <aside className={csv.infoCard}>
            <div className={csv.infoHeader}>
              <span className={csv.infoTitle}>Файлы прочитаны</span>
              <span className={csv.infoCheck}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="9"
                    stroke="#d3f86b"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M6 10.2 8.8 13l5.2-6"
                    stroke="#d3f86b"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
            <ul className={csv.infoList}>
              <li className={csv.infoItem}>
                Найдено диалогов: <strong>{dialogsCount}</strong>
              </li>
              <li className={csv.infoItem}>
                Найдено сообщений: <strong>{messagesCount}</strong>
              </li>
              <li className={csv.infoItem}>
                Имя файла:
                <br />
                <strong>{fileName}</strong>
              </li>
            </ul>
          </aside>

          {/* Статистика маскирования — если чекбокс был включён */}
          {redaction?.enabled && s && (
            <div className={csv.maskCard}>
              <div className={csv.maskHead}>
                <span className={csv.maskTitle}>Данные замаскированы</span>
                <img src={shield} className={csv.maskShield} alt="" />
              </div>
              <ul className={csv.maskList}>
                <li className={csv.maskItem}>
                  Телефоны — <strong>{s.phones}</strong>
                </li>
                <li className={csv.maskItem}>
                  Email — <strong>{s.emails}</strong>
                </li>
                <li className={csv.maskItem}>
                  Документы — <strong>{documents}</strong>
                </li>
                <li className={csv.maskItem}>
                  Банковские карты — <strong>{s.bank_cards}</strong>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className={`${csv.footer} ${styles.footer}`}>
        <button className={csv.backBtn} onClick={onBack}>
          <span className={csv.backIcon}>
            <img src={arrow} alt="" />
          </span>
          Назад
        </button>
        <button className={csv.nextBtn} onClick={onNext}>
          Далее
          <span>
            <img src={arrow} alt="" />
          </span>
        </button>
      </div>
    </div>
  );
};
