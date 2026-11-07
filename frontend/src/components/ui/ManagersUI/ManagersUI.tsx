import styles from "./ManagersUI.module.css";
import { ArrowLeft } from "lucide-react";
import { Dropdown, type DropdownOption } from "../Dropdown/Dropdown";
import type { DashboardManager } from "../../../utils/types/dashboard.types";

const ALL_OPTION: DropdownOption = { value: "", label: "Все" };

const SCORE_OPTIONS: DropdownOption[] = [
  { value: "asc", label: "Сначала низкая" },
  { value: "desc", label: "Сначала высокая" },
];

const LOST_OPTIONS: DropdownOption[] = [
  { value: "desc", label: "Сначала больше" },
  { value: "asc", label: "Сначала меньше" },
];

// Инициал-аватар менеджера
function ManagerAvatar({ name }: { name: string }) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";
  return <span className={styles.avatar}>{initial}</span>;
}

export interface ManagersUIProps {
  items: DashboardManager[];
  loading: boolean;
  scoreOrder: string;
  onScoreOrder: (v: string) => void;
  lostOrder: string;
  onLostOrder: (v: string) => void;
  managerValue: string;
  managerOptions: DropdownOption[];
  onManager: (v: string) => void;
  // Кнопка возврата опциональна: при заходе через сайдбар её не показываем
  backLabel?: string;
  onBack?: () => void;
  onCardClick: (id: number) => void;
}

export const ManagersUI = ({
  items,
  loading,
  scoreOrder,
  onScoreOrder,
  lostOrder,
  onLostOrder,
  managerValue,
  managerOptions,
  onManager,
  backLabel,
  onBack,
  onCardClick,
}: ManagersUIProps) => {
  return (
    <div className={`${styles.page} customScroll`}>
      {onBack && backLabel && (
        <button type="button" className={styles.backLink} onClick={onBack}>
          <ArrowLeft size={18} />
          {backLabel}
        </button>
      )}
      <h1 className={styles.h1}>Менеджеры</h1>

      {/* ===== Фильтры/сортировки ===== */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>По средней оценке</span>
          <Dropdown
            value={scoreOrder}
            options={SCORE_OPTIONS}
            onChange={onScoreOrder}
            className={styles.filterDropdown}
          />
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>По потерянным клиентам</span>
          <Dropdown
            value={lostOrder}
            options={LOST_OPTIONS}
            onChange={onLostOrder}
            className={styles.filterDropdown}
          />
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>По менеджеру</span>
          <Dropdown
            value={managerValue}
            options={[ALL_OPTION, ...managerOptions]}
            onChange={onManager}
            disabled={managerOptions.length === 0}
            className={styles.filterDropdown}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.centerMessage}>Загрузка…</div>
      ) : items.length === 0 ? (
        <div className={styles.centerMessage}>Менеджеры не найдены</div>
      ) : (
        <div className={styles.grid}>
          {items.map((m) => (
            <button
              key={m.manager_id ?? m.manager_name}
              type="button"
              className={styles.card}
              onClick={() => m.manager_id != null && onCardClick(m.manager_id)}
              disabled={m.manager_id == null}
            >
              <div className={styles.cardHead}>
                <ManagerAvatar name={m.manager_name} />
                <span className={styles.name}>{m.manager_name}</span>
              </div>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Диалоги</span>
                  <span className={styles.statValue}>{m.dialogs_count}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Потерянных</span>
                  <span className={`${styles.statValue} ${styles.lost}`}>
                    {m.lost_count}
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Средняя оценка</span>
                  <span className={`${styles.statValue} ${styles.score}`}>
                    {m.average_quality_score ?? "—"}
                    <span className={styles.scoreMax}> /100</span>
                  </span>
                </div>
              </div>
              <div className={styles.error}>
                <span className={styles.errorLabel}>Частая ошибка</span>
                <span className={styles.errorValue}>
                  {m.most_frequent_error?.label ?? "—"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
