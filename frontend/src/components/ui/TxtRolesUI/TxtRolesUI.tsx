import styles from "./TxtRolesUI.module.css";
// Футер «Назад/Далее» переиспользуем со страницы предпросмотра CSV
import csv from "../CsvPreviewUI/csvPreviewUI.module.css";
import arrow from "../../../assets/images/arrow.svg";
import { Dropdown } from "../Dropdown/Dropdown";

export type TxtRoleRow = {
  author: string;
  sampleText: string;
  role: string;
};

export type RoleOptionUI = { value: string; label: string };

interface Props {
  rows: TxtRoleRow[];
  loading: boolean;
  roleOptions: RoleOptionUI[];
  onRoleChange: (author: string, role: string) => void;
  submitting: boolean;
  errorMessage: string | null;
  onBack: () => void;
  onNext: () => void;
}

export const TxtRolesUI = ({
  rows,
  loading,
  roleOptions,
  onRoleChange,
  submitting,
  errorMessage,
  onBack,
  onNext,
}: Props) => {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Проверка ролей</h1>
        <p className={styles.description}>
          Укажите, какие значения соответствуют ролям в системе
        </p>
      </header>

      <div className={styles.tableCard}>
        <div className={styles.thead}>
          <span className={styles.thLeft}>Значение в файле</span>
          <span className={styles.thCenter}>Пример фразы</span>
          <span className={styles.thCenter}>Роль в системе</span>
        </div>

        {loading ? (
          <div className={styles.loadingRow}>Загрузка участников…</div>
        ) : (
          rows.map((row) => (
            <div className={styles.trow} key={row.author}>
              <span className={styles.tdAuthor}>{row.author}</span>
              <span className={styles.tdSample}>{row.sampleText}</span>
              <span className={styles.tdRole}>
                <Dropdown
                  value={row.role}
                  options={roleOptions}
                  onChange={(role) => onRoleChange(row.author, role)}
                  placeholder="Выберите роль"
                  className={styles.roleSelect}
                />
              </span>
            </div>
          ))
        )}
      </div>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <div className={`${csv.footer} ${styles.footer}`}>
        <button className={csv.backBtn} onClick={onBack} type="button">
          <span className={csv.backIcon}>
            <img src={arrow} alt="" />
          </span>
          Назад
        </button>
        <button
          className={csv.nextBtn}
          onClick={onNext}
          type="button"
          disabled={submitting}
        >
          {submitting ? (
            "Загрузка"
          ) : (
            <>
              Далее
              <span>
                <img src={arrow} alt="" />
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
