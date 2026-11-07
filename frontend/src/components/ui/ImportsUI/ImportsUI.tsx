import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Clock,
  Upload,
} from "lucide-react";
import styles from "./ImportsUI.module.css";
import { Dropdown, type DropdownOption } from "../Dropdown/Dropdown";
import type {
  ImportBatchListItem,
  ImportOptionRead,
} from "../../../utils/types/imports.types";
import type { ImportBatchStatus } from "../../../utils/types/common.types";
import { getScoreColor } from "../../../utils/color";
import { formatDate } from "../../../utils/utils";

const ALL_OPTION: DropdownOption = { value: "", label: "Все" };

// ===== Статусы загрузки → подпись + вариант цвета =====
type StatusVariant = "success" | "error" | "warning" | "info" | "neutral";

const STATUS: Record<
  ImportBatchStatus,
  { label: string; variant: StatusVariant }
> = {
  uploaded: { label: "Загружено", variant: "neutral" },
  // Аудио: асинхронная транскрибация
  transcription_queued: { label: "В очереди на расшифровку", variant: "info" },
  transcription_processing: { label: "Расшифровка", variant: "info" },
  transcription_failed: { label: "Ошибка расшифровки", variant: "error" },
  preview_ready: { label: "Ожидает подтверждения", variant: "neutral" },
  imported: { label: "Ожидает анализа", variant: "neutral" },
  import_failed: { label: "Ошибка импорта", variant: "error" },
  analysis_processing: { label: "Анализируется", variant: "info" },
  analysis_completed: { label: "Обработано", variant: "success" },
  analysis_completed_with_errors: {
    label: "Завершено с ошибками",
    variant: "warning",
  },
  analysis_failed: { label: "Ошибка", variant: "error" },
};

const badgeClass: Record<StatusVariant, string> = {
  success: styles.badge_success,
  error: styles.badge_error,
  warning: styles.badge_warning,
  info: styles.badge_info,
  neutral: styles.badge_neutral,
};

function StatusIcon({ variant }: { variant: StatusVariant }) {
  switch (variant) {
    case "success":
      return <CheckCircle2 />;
    case "info":
      return <Sparkles />;
    case "error":
    case "warning":
      return <AlertTriangle />;
    default:
      return <Clock />;
  }
}

// Плюрализация «диалог»
const pluralDialogs = (n: number): string => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "Диалог";
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "Диалога";
  return "Диалогов";
};


// ===== Кольцо =====
function Ring({
  fraction,
  color,
  label,
  sublabel,
}: {
  fraction: number;
  color: string;
  label: string;
  sublabel?: string;
}) {
  const R = 32;
  const C = 2 * Math.PI * R;
  const dash = Math.max(0, Math.min(1, fraction)) * C;
  return (
    <div className={styles.ring}>
      <svg viewBox="0 0 80 80" className={styles.ringSvg}>
        <circle cx="40" cy="40" r={R} className={styles.ringTrack} />
        {dash > 0 && (
          <circle
            cx="40"
            cy="40"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            transform="rotate(-90 40 40)"
          />
        )}
      </svg>
      {label && (
        <span className={styles.ringLabel} style={{ color }}>
          {label}
          {sublabel && <span className={styles.ringSub}>{sublabel}</span>}
        </span>
      )}
    </div>
  );
}

// Кольцо по статусу загрузки
function StatusRing({ item }: { item: ImportBatchListItem }) {
  const variant = STATUS[item.status].variant;

  if (item.status === "analysis_processing") {
    const p = item.progress_percent ?? 0;
    return <Ring fraction={p / 100} color="#92c1ff" label={String(p)} sublabel="%" />;
  }
  if (
    item.status === "analysis_completed" ||
    item.status === "analysis_completed_with_errors"
  ) {
    const score = item.average_quality_score ?? null;
    if (score == null) return <Ring fraction={0} color="#9b9ba3" label="—" />;
    return <Ring fraction={score / 100} color={getScoreColor(score)} label={String(score)} />;
  }
  // Ошибка — пустое красное кольцо; прочие статусы — только трек
  if (variant === "error") {
    return <Ring fraction={1} color="var(--color-error)" label="" />;
  }
  return <Ring fraction={0} color="#9b9ba3" label="" />;
}

// ===== Карточка =====
function ImportCard({
  item,
  onOpen,
}: {
  item: ImportBatchListItem;
  onOpen: (id: number) => void;
}) {
  const cfg = STATUS[item.status];
  const isError = cfg.variant === "error";
  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => onOpen(item.id)}
    >
      <div className={styles.cardTop}>
        <div className={styles.info}>
          <span className={styles.fileName}>
            {item.original_filename ?? "Без названия"}
          </span>
          <span className={styles.date}>{formatDate(item.created_at)}</span>
          <span className={`${styles.badge} ${badgeClass[cfg.variant]}`}>
            <StatusIcon variant={cfg.variant} />
            {cfg.label}
          </span>
        </div>
        <StatusRing item={item} />
      </div>

      <div className={styles.cardBottom}>
        <div className={styles.count}>
          <span className={styles.countValue}>{item.dialogs_count}</span>
          <span className={styles.countLabel}>
            {pluralDialogs(item.dialogs_count)}
          </span>
        </div>
        <span className={styles.openLink}>
          {isError ? "Посмотреть" : "Открыть"}
          <ArrowRight size={16} />
        </span>
      </div>
    </button>
  );
}

// ============================================================
// Главный компонент
// ============================================================

export interface ImportsUIProps {
  items: ImportBatchListItem[];
  loading: boolean;
  sourceTypeFilter: string;
  statusGroupFilter: string;
  sourceTypeOptions: ImportOptionRead[];
  statusGroupOptions: ImportOptionRead[];
  onSourceTypeFilterChange: (value: string) => void;
  onStatusGroupFilterChange: (value: string) => void;
  onOpen: (id: number) => void;
  onUpload: () => void;
}

export const ImportsUI = ({
  items,
  loading,
  sourceTypeFilter,
  statusGroupFilter,
  sourceTypeOptions,
  statusGroupOptions,
  onSourceTypeFilterChange,
  onStatusGroupFilterChange,
  onOpen,
  onUpload,
}: ImportsUIProps) => {
  const sourceTypeDropdownOptions = [ALL_OPTION, ...sourceTypeOptions];
  const statusGroupDropdownOptions = [ALL_OPTION, ...statusGroupOptions];
  return (
    <div className={`${styles.page} customScroll`}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Загрузки</h1>
        <p className={styles.subtitle}>
          Список всех импортированных файлов и их обработка
        </p>
      </header>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Тип загрузки</span>
          <Dropdown
            value={sourceTypeFilter}
            options={sourceTypeDropdownOptions}
            onChange={onSourceTypeFilterChange}
            className={styles.filterDropdown}
          />
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Статус обработки</span>
          <Dropdown
            value={statusGroupFilter}
            options={statusGroupDropdownOptions}
            onChange={onStatusGroupFilterChange}
            className={styles.filterDropdown}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.centerMessage}>Загрузка…</div>
      ) : items.length === 0 ? (
        <div className={styles.centerMessage}>
          Пока нет загрузок — импортируйте первый файл
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => (
            <ImportCard key={item.id} item={item} onOpen={onOpen} />
          ))}
        </div>
      )}

      <button type="button" className={styles.fab} onClick={onUpload}>
        <Upload size={18} />
        Загрузить файл
      </button>
    </div>
  );
};
