import styles from "./csvPreviewUI.module.css";
import arrow from "../../../assets/images/arrow.svg";
import shield from "../../../assets/images/shield.svg";
import type { RedactionInfo } from "../../../utils/types/imports.types";

interface PreviewTableRow {
  number: number;
  cells: string[];
}

interface Props {
  fileName: string;
  rowsCount: number;
  columnsCount: number;
  headers: string[];
  rows: PreviewTableRow[];
  // Статистика маскирования (показываем, если маскирование было включено)
  redaction?: RedactionInfo | null;
  onBack: () => void;
  onNext: () => void;
}

export const CsvPreviewUI = ({
  fileName,
  rowsCount,
  columnsCount,
  headers,
  rows,
  redaction,
  onBack,
  onNext,
}: Props) => {
  const s = redaction?.stats;
  // «Документы» — паспорта + СНИЛС + ИНН
  const documents = s ? s.passports + s.snils + s.inns : 0;
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Предпросмотр первых строк</h1>
        <p className={styles.description}>
          Проверьте, правильно ли распознаны данные и
          их структура у <span className={styles.strong}>первых 10 строк</span>
        </p>
      </header>

      <div className={styles.body}>
        <div className={`${styles.tableWrapper} customScroll`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.numCol}>№</th>
                {headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.number}>
                  <td className={styles.numCol}>{row.number}</td>
                  {row.cells.map((cell, cellIndex) => (
                    <td key={headers[cellIndex]}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.rightCol}>
          <aside className={styles.infoCard}>
            <div className={styles.infoHeader}>
              <span className={styles.infoTitle}>Файлы прочитаны</span>
              <span className={styles.infoCheck}>
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
            <ul className={styles.infoList}>
              <li className={styles.infoItem}>
                Найдено колонок: <strong>{columnsCount}</strong>
              </li>
              <li className={styles.infoItem}>
                Найдено строк: <strong>{rowsCount}</strong>
              </li>
              <li className={styles.infoItem}>
                Имя файла:
                <br />
                <strong>{fileName}</strong>
              </li>
            </ul>
          </aside>

          {/* Статистика маскирования — если чекбокс был включён */}
          {redaction?.enabled && s && (
            <div className={styles.maskCard}>
              <div className={styles.maskHead}>
                <span className={styles.maskTitle}>Данные замаскированы</span>
                <img src={shield} className={styles.maskShield} alt="" />
              </div>
              <ul className={styles.maskList}>
                <li className={styles.maskItem}>
                  Телефоны — <strong>{s.phones}</strong>
                </li>
                <li className={styles.maskItem}>
                  Email — <strong>{s.emails}</strong>
                </li>
                <li className={styles.maskItem}>
                  Документы — <strong>{documents}</strong>
                </li>
                <li className={styles.maskItem}>
                  Банковские карты — <strong>{s.bank_cards}</strong>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.backBtn} onClick={onBack}>
          <span className={styles.backIcon}>
            <img src={arrow} alt="" />
          </span>
          Назад
        </button>
        <button className={styles.nextBtn} onClick={onNext}>
          Далее
          <span>
            <img src={arrow} alt="" />
          </span>
        </button>
      </div>
    </div>
  );
};
