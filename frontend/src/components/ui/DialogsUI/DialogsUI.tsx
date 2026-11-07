import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./DialogsUI.module.css";
import tagRight from "../../../assets/images/tag-right.svg";
import humanTalk from "../../../assets/images/humantalk.svg";
import arrowIcon from "../../../assets/images/arrow.svg";
import { GlowCard } from "../glowCard/glowCard";
import { Dropdown, type DropdownOption } from "../Dropdown/Dropdown";
import {
  Check,
  AlertCircle,
  Loader2,
  MoreHorizontal,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import type {
  DialogListItem,
  DialogsSummaryResponse,
  DialogPreset,
  DialogSortBy,
  SortOrder,
} from "../../../utils/types/dialogs.types";
import type {
  DialogAnalysisStatus,
  DialogOutcome,
  AnalysisTagItem,
} from "../../../utils/types/common.types";
import {
  formatDate,
  formatScore,
  formatChannel,
  getOutcomeConfig,
  OBJECTION_LABELS,
  MANAGER_ERROR_LABELS,
  RISK_FLAG_LABELS,
  PRESET_LABELS,
  OUTCOME_LABELS,
  ANALYSIS_STATUS_LABELS,
} from "../../../utils/utils";

// ============================================================
// Вспомогательные под-компоненты
// ============================================================

const PRESETS: DialogPreset[] = [
  "problematic",
  "lost",
  "low_score",
  "analysis_errors",
  "not_analyzed",
];

const OUTCOMES: DialogOutcome[] = [
  "success",
  "lost",
  "pending",
  "complaint",
  "consultation",
  "unknown",
];

const ANALYSIS_STATUSES: DialogAnalysisStatus[] = [
  "pending",
  "processing",
  "done",
  "error",
];

const SORT_OPTIONS: DropdownOption[] = [
  { value: "created_at", label: "Дата создания" },
  { value: "started_at", label: "Дата диалога" },
  { value: "quality_score", label: "Оценка" },
  { value: "messages_count", label: "Сообщений" },
];

// Опции фильтров: первый пункт «Все» (value "") сбрасывает фильтр
const ALL_OPTION: DropdownOption = { value: "", label: "Все" };

const OUTCOME_FILTER_OPTIONS: DropdownOption[] = [
  ALL_OPTION,
  ...OUTCOMES.map((o) => ({ value: o, label: OUTCOME_LABELS[o] ?? o })),
];

const STATUS_FILTER_OPTIONS: DropdownOption[] = [
  ALL_OPTION,
  ...ANALYSIS_STATUSES.map((s) => ({
    value: s,
    label: ANALYSIS_STATUS_LABELS[s] ?? s,
  })),
];

const OBJECTION_FILTER_OPTIONS: DropdownOption[] = [
  ALL_OPTION,
  ...Object.entries(OBJECTION_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const MANAGER_ERROR_FILTER_OPTIONS: DropdownOption[] = [
  ALL_OPTION,
  ...Object.entries(MANAGER_ERROR_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const RISK_FILTER_OPTIONS: DropdownOption[] = [
  ALL_OPTION,
  ...Object.entries(RISK_FLAG_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

type OutcomeVariant = "success" | "error" | "warning" | "neutral" | "info" | "lime";

const variantClass: Record<OutcomeVariant, string> = {
  success: styles.badgeSuccess,
  error:   styles.badgeError,
  warning: styles.badgeWarning,
  info:    styles.badgeInfo,
  neutral: styles.badgeNeutral,
  lime:    styles.badgeLime,
};


function OutcomeBadge({ outcome }: { outcome: string | undefined }) {
  const cfg = getOutcomeConfig(outcome);
  return (
    <span className={`${styles.badge} ${variantClass[cfg.variant]}`}>
      {cfg.label}
    </span>
  );
}

function ScorePill({ score }: { score: number | null | undefined }) {
  if (score == null) {
    return <span className={styles.placeholder}>…</span>;
  }
  // Категории: 80–100 высокий, 50–79 средний, 0–49 низкий
  const color =
    score >= 80 ? "#7cc643" : score >= 50 ? "#f09413" : "var(--color-error)";
  return (
    <span className={styles.scorePill} style={{ color, borderColor: color }}>
      {formatScore(score)}
    </span>
  );
}

// Возражения / ошибки менеджера: берём готовые названия и пояснения из *_items
// (backend отдаёт label/detail), деталь — в тултипе
function TagsCell({
  items,
  maxVisible = 2,
  compact = false,
}: {
  items: AnalysisTagItem[];
  maxVisible?: number;
  compact?: boolean;
}) {
  if (!items || items.length === 0) {
    return <span className={styles.placeholder}>…</span>;
  }
  const visible = items.slice(0, maxVisible);
  const rest = items.length - visible.length;
  return (
    <div className={styles.tagsCell}>
      {visible.map((item) => (
        <span
          key={item.key}
          className={`${styles.tag} ${compact ? styles.tagCompact : ""}`}
          title={item.detail || item.label}
        >
          {item.label}
        </span>
      ))}
      {rest > 0 && <span className={styles.tagMore}>+{rest}</span>}
    </div>
  );
}


function StatusIcon({
  status,
  errorMessage,
}: {
  status: DialogAnalysisStatus;
  errorMessage?: string | null;
}) {
  switch (status) {
    case "done":
      return (
        <span className={`${styles.statusIcon} ${styles.statusDone}`}>
          <Check size={12} />
        </span>
      );
    case "processing":
      return (
        <span className={`${styles.statusIcon} ${styles.statusProcessing}`}>
          <Loader2 size={16} />
        </span>
      );
    case "error":
      return (
        <span
          className={`${styles.statusIcon} ${styles.statusError}`}
          title={errorMessage ?? "Ошибка анализа"}
        >
          <AlertCircle size={16} />
        </span>
      );
    case "pending":
    default:
      return (
        <span className={`${styles.statusIcon} ${styles.statusPending}`}>
          <MoreHorizontal size={16} />
        </span>
      );
  }
}

// ============================================================
// Слайдер диапазона оценки
// ============================================================

interface ScoreRangeProps {
  scoreMin: number;
  scoreMax: number;
  onScoreMin: (v: number) => void;
  onScoreMax: (v: number) => void;
}

// Локальное состояние делает перетаскивание отзывчивым, а коммит в стор
// (и, как следствие, запрос на бэкенд) происходит только на отпускании.
function ScoreRange({ scoreMin, scoreMax, onScoreMin, onScoreMax }: ScoreRangeProps) {
  const [localMin, setLocalMin] = useState(scoreMin);
  const [localMax, setLocalMax] = useState(scoreMax);

  // Синхронизация при внешнем изменении (например, сброс фильтров)
  useEffect(() => setLocalMin(scoreMin), [scoreMin]);
  useEffect(() => setLocalMax(scoreMax), [scoreMax]);

  const fillLeft = `${localMin}%`;
  const fillRight = `${100 - localMax}%`;

  return (
    <div className={`${styles.filterGroup} ${styles.rangeGroup}`}>
      <span className={styles.filterLabel}>Оценка</span>
      <div className={styles.rangeValues}>
        <span>{localMin}</span>
        <span>—</span>
        <span>{localMax}</span>
      </div>
      <div className={styles.rangeTrack}>
        <div
          className={styles.rangeFill}
          style={{ left: fillLeft, right: fillRight }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={localMin}
          className={styles.rangeInput}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v <= localMax) setLocalMin(v);
          }}
          onPointerUp={() => onScoreMin(localMin)}
          onKeyUp={() => onScoreMin(localMin)}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={localMax}
          className={styles.rangeInput}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v >= localMin) setLocalMax(v);
          }}
          onPointerUp={() => onScoreMax(localMax)}
          onKeyUp={() => onScoreMax(localMax)}
        />
      </div>
    </div>
  );
}

// ============================================================
// Пагинация
// ============================================================

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}

function Pagination({ page, pages, total, pageSize, onPage }: PaginationProps) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pageNumbers: (number | "...")[] = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (page > 3) pageNumbers.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) {
      pageNumbers.push(i);
    }
    if (page < pages - 2) pageNumbers.push("...");
    pageNumbers.push(pages);
  }

  return (
    <div className={styles.pagination}>
      <span className={styles.paginationInfo}>
        Показано {from}–{to} из {total}
      </span>
      <div className={styles.paginationControls}>
        <button
          className={`${styles.pageArrow} ${styles.pageArrowPrev}`}
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          type="button"
          aria-label="Предыдущая страница"
        >
          <img src={tagRight} alt="" />
        </button>
        {pageNumbers.map((n, idx) =>
          n === "..." ? (
            <span key={`dots-${idx}`} className={styles.pageDots}>
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              className={`${styles.pageBtn} ${
                n === page ? styles.pageBtnActive : ""
              }`}
              onClick={() => onPage(n as number)}
            >
              {n}
            </button>
          )
        )}
        <button
          className={styles.pageArrow}
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          type="button"
          aria-label="Следующая страница"
        >
          <img src={tagRight} alt="" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Тулбар: поиск + сортировка
// ============================================================

function Toolbar({
  search,
  onSearch,
  sortBy,
  sortOrder,
  onSort,
}: {
  search: string;
  onSearch: (v: string) => void;
  sortBy: DialogSortBy;
  sortOrder: SortOrder;
  onSort: (sortBy: DialogSortBy, sortOrder: SortOrder) => void;
}) {
  // Локальный ввод для отзывчивости; коммит (debounce) — в контейнере
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => setSearchInput(search), [search]);

  return (
    <div className={styles.toolbar}>
      <input
        type="text"
        className={styles.searchInput}
        placeholder="Поиск по диалогам…"
        value={searchInput}
        onChange={(e) => {
          setSearchInput(e.target.value);
          onSearch(e.target.value);
        }}
      />
      <div className={styles.sortControls}>
        <span className={styles.sortLabel}>Сортировка:</span>
        <Dropdown
          value={sortBy}
          options={SORT_OPTIONS}
          onChange={(v) => onSort(v as DialogSortBy, sortOrder)}
          className={styles.sortDropdown}
        />
        <button
          type="button"
          className={styles.sortOrderBtn}
          onClick={() => onSort(sortBy, sortOrder === "asc" ? "desc" : "asc")}
          title={sortOrder === "asc" ? "По возрастанию" : "По убыванию"}
        >
          {sortOrder === "asc" ? "↑" : "↓"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Главный компонент
// ============================================================

export interface DialogsUIProps {
  summary: DialogsSummaryResponse | null;
  summaryLoading: boolean;

  items: DialogListItem[];
  listLoading: boolean;
  total: number;
  page: number;
  pageSize: number;
  pages: number;

  preset: DialogPreset | null;
  onPreset: (p: DialogPreset | null) => void;

  search: string;
  onSearch: (v: string) => void;

  sortBy: DialogSortBy;
  sortOrder: SortOrder;
  onSort: (sortBy: DialogSortBy, sortOrder: SortOrder) => void;

  filterManager: string;
  onFilterManager: (v: string) => void;
  managerOptions: DropdownOption[];

  filterOutcome: string;
  onFilterOutcome: (v: string) => void;

  filterStatus: string;
  onFilterStatus: (v: string) => void;

  filterObjection: string;
  onFilterObjection: (v: string) => void;

  filterManagerError: string;
  onFilterManagerError: (v: string) => void;

  filterRisk: string;
  onFilterRisk: (v: string) => void;

  scoreMin: number;
  scoreMax: number;
  onScoreMin: (v: number) => void;
  onScoreMax: (v: number) => void;

  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onSelectAll: (ids: number[]) => void;

  batchLoading: boolean;
  onRunAnalysis: () => void;

  onPage: (p: number) => void;
  onRowClick: (id: number) => void;

  // Если заданы — показываем кнопку возврата (заход с дашборда / менеджеров)
  backLabel?: string;
  onBack?: () => void;
}

export const DialogsUI = ({
  summary,
  summaryLoading,
  items,
  listLoading,
  total,
  page,
  pageSize,
  pages,
  preset,
  onPreset,
  search,
  onSearch,
  sortBy,
  sortOrder,
  onSort,
  filterManager,
  onFilterManager,
  managerOptions,
  filterOutcome,
  onFilterOutcome,
  filterStatus,
  onFilterStatus,
  filterObjection,
  onFilterObjection,
  filterManagerError,
  onFilterManagerError,
  filterRisk,
  onFilterRisk,
  scoreMin,
  scoreMax,
  onScoreMin,
  onScoreMax,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  batchLoading,
  onRunAnalysis,
  onPage,
  onRowClick,
  backLabel,
  onBack,
}: DialogsUIProps) => {
  const allOnPageSelected =
    items.length > 0 && items.every((item) => selectedIds.includes(item.id));

  // Пустое состояние «нет диалогов» показываем только когда нет активных
  // фильтров (иначе это «ничего не найдено» — оставляем таблицу).
  const hasActiveFilters =
    preset !== null ||
    Boolean(search) ||
    Boolean(filterOutcome) ||
    Boolean(filterStatus) ||
    Boolean(filterObjection) ||
    Boolean(filterManagerError) ||
    Boolean(filterRisk) ||
    scoreMin > 0 ||
    scoreMax < 100;
  const showEmptyState =
    !listLoading && items.length === 0 && !hasActiveFilters;

  return (
    <div className={styles.page}>
      {/* ===== Заголовок ===== */}
      {onBack && backLabel && (
        <button type="button" className={styles.backLink} onClick={onBack}>
          <ArrowLeft size={18} />
          {backLabel}
        </button>
      )}
      <h1 className={styles.h1}>Диалоги</h1>

      {/* ===== Сводка ===== */}
      <div className={styles.summaryStrip}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {summaryLoading ? "…" : (summary?.dialogs_count ?? "—")}
          </span>
          <span className={styles.statLabel}>Диалогов</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {summaryLoading ? "…" : (summary?.analyzed_count ?? "—")}
          </span>
          <span className={styles.statLabel}>Проанализировано</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {summaryLoading ? "…" : (summary?.lost_count ?? "—")}
          </span>
          <span className={styles.statLabel}>Потерянных</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {summaryLoading
              ? "…"
              : summary?.average_quality_score != null
              ? summary.average_quality_score
              : "—"}
          </span>
          <span className={styles.statLabel}>Средняя оценка</span>
        </div>
        <div className={styles.statItem}>
          <span
            className={`${styles.statValue} ${
              (summary?.analysis_errors_count ?? 0) > 0
                ? styles.statValueError
                : ""
            }`}
          >
            {summaryLoading ? "…" : (summary?.analysis_errors_count ?? "—")}
          </span>
          <span
            className={`${styles.statLabel} ${
              (summary?.analysis_errors_count ?? 0) > 0
                ? styles.statLabelError
                : ""
            }`}
          >
            Ошибок анализа
          </span>
        </div>
      </div>

      {showEmptyState ? (
        /* ===== Пустое состояние: нет диалогов ===== */
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>
            У вас нет импортированных диалогов
          </h2>
          <Link to="/import" className={styles.emptyCardLink}>
            <GlowCard className={styles.emptyCard}>
              <span className={styles.emptyCardIcon}>
                <img src={humanTalk} alt="" />
              </span>
              <div className={styles.emptyCardBody}>
                <h3 className={styles.emptyCardTitle}>Начать импорт</h3>
                <div className={styles.emptyCardRow}>
                  <p className={styles.emptyCardDesc}>
                    Импортируйте диалог для подробного AI-анализа
                  </p>
                  <span className={styles.emptyCardArrow}>
                    <img src={arrowIcon} alt="" />
                  </span>
                </div>
              </div>
            </GlowCard>
          </Link>
        </div>
      ) : (
        <>
      {/* ===== Поиск + сортировка ===== */}
      <Toolbar
        search={search}
        onSearch={onSearch}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
      />

      {/* ===== Preset-чипы ===== */}
      <div className={styles.presets}>
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            className={`${styles.presetChip} ${
              preset === p ? styles.presetChipActive : ""
            }`}
            onClick={() => onPreset(preset === p ? null : p)}
          >
            {PRESET_LABELS[p]}
          </button>
        ))}
      </div>

      {/* ===== Фильтры ===== */}
      <div className={styles.filters}>
        {/* Менеджер */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Менеджер</span>
          <Dropdown
            value={filterManager}
            options={[ALL_OPTION, ...managerOptions]}
            onChange={onFilterManager}
            disabled={managerOptions.length === 0}
          />
        </div>

        {/* Итог */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Итог</span>
          <Dropdown
            value={filterOutcome}
            options={OUTCOME_FILTER_OPTIONS}
            onChange={onFilterOutcome}
          />
        </div>

        {/* Оценка (диапазон) */}
        <ScoreRange
          scoreMin={scoreMin}
          scoreMax={scoreMax}
          onScoreMin={onScoreMin}
          onScoreMax={onScoreMax}
        />

        {/* Возражения (по техническому ключу) */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Возражения</span>
          <Dropdown
            value={filterObjection}
            options={OBJECTION_FILTER_OPTIONS}
            onChange={onFilterObjection}
          />
        </div>

        {/* Ошибки менеджера (по техническому ключу) */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Ошибка менеджера</span>
          <Dropdown
            value={filterManagerError}
            options={MANAGER_ERROR_FILTER_OPTIONS}
            onChange={onFilterManagerError}
          />
        </div>

        {/* Риски (по техническому ключу) */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Риски</span>
          <Dropdown
            value={filterRisk}
            options={RISK_FILTER_OPTIONS}
            onChange={onFilterRisk}
          />
        </div>

        {/* Статус анализа */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Статус анализа</span>
          <Dropdown
            value={filterStatus}
            options={STATUS_FILTER_OPTIONS}
            onChange={onFilterStatus}
          />
        </div>
      </div>

      {/* ===== Таблица ===== */}
      <div className={styles.tableWrapper}>
        {listLoading ? (
          <div className={styles.tableMessage}>Загрузка…</div>
        ) : items.length === 0 ? (
          <div className={styles.tableMessage}>Диалоги не найдены</div>
        ) : (
          <>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thCheck}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={allOnPageSelected}
                  onChange={() => onSelectAll(items.map((i) => i.id))}
                />
              </th>
              <th>ID</th>
              <th>Менеджер</th>
              <th>Итог</th>
              <th>Оценка</th>
              <th>Возражения</th>
              <th>Дата</th>
              <th>Канал</th>
              <th className={styles.tdStatus}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
                const analysis = item.analysis;
                const isSelected = selectedIds.includes(item.id);
                return (
                  <tr
                    key={item.id}
                    className={`${styles.row} ${
                      isSelected ? styles.rowSelected : ""
                    }`}
                    onClick={() => onRowClick(item.id)}
                  >
                    <td
                      className={styles.tdCheck}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={isSelected}
                        onChange={() => onToggleSelect(item.id)}
                      />
                    </td>
                    <td className={styles.tdId}>{item.id}</td>
                    <td className={styles.tdManager}>
                      {item.manager?.name ?? "—"}
                    </td>
                    <td>
                      {analysis ? (
                        <OutcomeBadge outcome={analysis.outcome} />
                      ) : (
                        <span className={styles.placeholder}>…</span>
                      )}
                    </td>
                    <td>
                      {analysis ? (
                        <ScorePill score={analysis.quality_score} />
                      ) : (
                        <span className={styles.placeholder}>…</span>
                      )}
                    </td>
                    <td>
                      {analysis ? (
                        <TagsCell
                          items={analysis.objection_items}
                          maxVisible={1}
                          compact
                        />
                      ) : (
                        <span className={styles.placeholder}>…</span>
                      )}
                    </td>
                    <td className={styles.tdDate}>
                      {item.started_at ? formatDate(item.started_at) : "—"}
                    </td>
                    <td className={styles.tdChannel}>
                      {formatChannel(item.channel)}
                    </td>
                    <td className={styles.tdStatus}>
                      <div className={styles.statusCell}>
                        <StatusIcon
                          status={item.analysis_status}
                          errorMessage={analysis?.error_message}
                        />
                        <span className={styles.rowArrow}>
                          <img src={tagRight} alt="" />
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        <Pagination
          page={page}
          pages={pages}
          total={total}
          pageSize={pageSize}
          onPage={onPage}
        />
        </>
        )}
      </div>

      {/* ===== FAB «Запустить AI-анализ» ===== */}
      <button
        type="button"
        className={styles.fab}
        disabled={selectedIds.length === 0 || batchLoading}
        onClick={onRunAnalysis}
      >
        {batchLoading ? (
          <Loader2 size={18} className={styles.fabSpinner} />
        ) : (
          <Sparkles size={18} />
        )}
        Запустить AI-анализ
      </button>
        </>
      )}
    </div>
  );
};
