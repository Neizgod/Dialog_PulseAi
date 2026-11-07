import { useState, useRef } from "react";
import styles from "./DashboardUI.module.css";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import { Link } from "react-router-dom";
import { Download, ArrowRight, MessageSquare } from "lucide-react";
import { Dropdown, type DropdownOption } from "../Dropdown/Dropdown";
import { GlowCard } from "../glowCard/glowCard";
import type {
  DashboardSummaryResponse,
  DashboardDynamicsPoint,
} from "../../../utils/types/dashboard.types";
import type { DialogsListQuery } from "../../../utils/types/dialogs.types";
import type { LabeledCount } from "../../../utils/types/common.types";
import { getScoreColor } from "../../../utils/color";

const ALL_OPTION: DropdownOption = { value: "", label: "Все" };

// Цвета секторов donut по ключу итога
const OUTCOME_COLOR: Record<string, string> = {
  success: "#7cc643",
  lost: "#ff4b4b",
  pending: "#92c1ff",
  complaint: "#ff8c42",
  consultation: "#d3f86b",
  unknown: "#9b9ba3",
};

// Фон пилюль легенды «Статусы диалогов» по ключу итога
const OUTCOME_BG: Record<string, string> = {
  success: "rgba(31, 43, 40, 0.4)",
  pending: "rgba(35, 39, 48, 0.4)",
  consultation: "rgba(35, 37, 29, 0.4)",
  lost: "rgba(40, 33, 43, 0.4)",
  complaint: "rgba(37, 35, 37, 0.4)",
};

// Подписи статусов в легенде — во множественном числе
const OUTCOME_LEGEND_LABEL: Record<string, string> = {
  success: "Успешные",
  pending: "Зависшие",
  consultation: "Консультации",
  lost: "Потерянные",
  complaint: "Жалобы",
  unknown: "Не определенные",
};

const pct = (count: number, total: number): string =>
  total > 0 ? `${((count / total) * 100).toFixed(1)}%` : "0%";

// ============================================================
// KPI
// ============================================================

function Kpi({
  value,
  label,
  onClick,
  variant,
  meter,
  meterColor,
}: {
  value: React.ReactNode;
  label: React.ReactNode;
  onClick?: () => void;
  variant?: "error";
  meter?: number | null;
  meterColor?: string;
}) {
  return (
    <button
      type="button"
      className={`${styles.kpi} ${onClick ? styles.kpiClickable : ""}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <span
        className={`${styles.kpiValue} ${variant === "error" ? styles.kpiError : ""}`}
        style={meterColor ? { color: meterColor } : undefined}
      >
        {value}
        {meter != null && <span className={styles.kpiMax}> / 100</span>}
      </span>
      {meter != null && (
        <div className={styles.kpiMeter}>
          <div
            className={styles.kpiMeterFill}
            style={{ width: `${meter}%`, background: meterColor }}
          />
        </div>
      )}
      <span
        className={`${styles.kpiLabel} ${variant === "error" ? styles.kpiError : ""}`}
      >
        {label}
      </span>
    </button>
  );
}

// ============================================================
// Бары распределения (топ ошибок / возражений)
// ============================================================

function BarsCard({
  title,
  items,
  palette,
  onItemClick,
}: {
  title: string;
  items: LabeledCount[];
  palette: "warm" | "violet";
  onItemClick: (key: string) => void;
}) {
  const total = items.reduce((s, i) => s + i.count, 0);
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className={styles.card}>
      <p className={styles.cardTitle}>{title}</p>
      <div className={styles.bars}>
        {items.map((it, idx) => (
          <button
            key={it.key}
            type="button"
            className={styles.barRow}
            onClick={() => onItemClick(it.key)}
            disabled={it.count === 0}
          >
            <span
              className={`${styles.bar} ${
                palette === "warm" ? styles.barWarm : styles.barViolet
              }`}
              style={{
                width: `${Math.max(18, (it.count / max) * 100)}%`,
                ...(palette === "warm"
                  ? { ["--bar-i" as string]: String(idx) }
                  : {}),
              }}
            >
              <span className={styles.barLabel}>{it.label}</span>
            </span>
            <span className={styles.barCount}>
              {it.count} <span className={styles.barPct}>({pct(it.count, total)})</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Donut «Статусы диалогов»
// ============================================================

function Donut({
  items,
  onSectorClick,
}: {
  items: LabeledCount[];
  onSectorClick: (key: string) => void;
}) {
  const total = items.reduce((s, i) => s + i.count, 0);
  // Пустые статусы (count = 0) не рисуем: иначе round-cap оставляет «точку»
  const visible = items.filter((it) => it.count > 0);
  const R = 70;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className={styles.donutBlock}>
      <div className={styles.donutWrap}>
        <svg viewBox="0 0 180 180" className={styles.donutSvg}>
          <circle cx="90" cy="90" r={R} className={styles.donutTrack} />
          {visible.map((it) => {
            const frac = total > 0 ? it.count / total : 0;
            const dash = frac * C;
            const seg = (
              <circle
                key={it.key}
                cx="90"
                cy="90"
                r={R}
                fill="none"
                stroke={OUTCOME_COLOR[it.key] ?? "#9b9ba3"}
                strokeWidth="14"
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 90 90)"
                strokeLinecap="round"
              />
            );
            offset += dash;
            return seg;
          })}
        </svg>
        <div className={styles.donutCenter}>
          <span className={styles.donutTotal}>{total}</span>
          <span className={styles.donutTotalLabel}>Всего</span>
        </div>
      </div>
      <div className={styles.legend}>
        {items.map((it) => {
          const c = OUTCOME_COLOR[it.key] ?? "#9b9ba3";
          return (
            <button
              key={it.key}
              type="button"
              className={styles.legendItem}
              style={{
                color: c,
                background:
                  OUTCOME_BG[it.key] ??
                  `color-mix(in srgb, ${c} 16%, transparent)`,
              }}
              onClick={() => onSectorClick(it.key)}
              disabled={it.count === 0}
            >
              <span className={styles.legendLabel}>
                {OUTCOME_LEGEND_LABEL[it.key] ?? it.label}
              </span>
              <span className={styles.legendCount}>{it.count}</span>
              <span className={styles.legendPct}>({pct(it.count, total)})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Динамика (бары по дням)
// ============================================================

// Дни недели в порядке отображения (ПН..ВС); dow = Date.getDay()
const WEEK = [
  { dow: 1, label: "ПН" },
  { dow: 2, label: "ВТ" },
  { dow: 3, label: "СР" },
  { dow: 4, label: "ЧТ" },
  { dow: 5, label: "ПТ" },
  { dow: 6, label: "СБ" },
  { dow: 0, label: "ВС" },
];

// Ключ даты "YYYY-MM-DD" → "DD.MM.YYYY" (без сдвига таймзоны)
const fmtDateKey = (key: string): string => {
  const [y, m, d] = key.split("-");
  return d && m && y ? `${d}.${m}.${y}` : key;
};

function Dynamics({
  summary,
}: {
  summary: DashboardSummaryResponse;
}) {
  // Период — только вёрстка (в API один диапазон дат на всю сводку, отдельного
  // параметра для динамики нет). 30-дневный вид рендерит то, что уже пришло в
  // summary.dynamics; данные за 30 дней подтянутся, когда бэкенд их отдаст.
  const [period, setPeriod] = useState<"7" | "30">("7");

  // 7-дневный вид: точки по дню недели; недостающие дни покажем как 0
  const byDay = new Map<number, DashboardDynamicsPoint>();
  (summary.dynamics ?? []).forEach((p) => {
    const d = new Date(p.date);
    if (!isNaN(d.getTime())) byDay.set(d.getDay(), p);
  });

  // 30-дневная ось: 30 подряд идущих дней, заканчивая последней датой с данными
  // (или сегодня, если данных нет). Дни без данных — пустые столбцы.
  const scoreByDate = new Map<string, number | null>();
  (summary.dynamics ?? []).forEach((p) => {
    if (!isNaN(new Date(p.date).getTime())) {
      scoreByDate.set(p.date.slice(0, 10), p.average_quality_score);
    }
  });
  const dataKeys = [...scoreByDate.keys()].sort();
  const endKey = dataKeys.length
    ? dataKeys[dataKeys.length - 1]
    : new Date().toISOString().slice(0, 10);
  const endDate = new Date(`${endKey}T00:00:00Z`);
  const days30: { key: string; score: number | null }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(endDate);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    days30.push({
      key,
      score: scoreByDate.has(key) ? scoreByDate.get(key)! : null,
    });
  }
  const rangeLabel = `${fmtDateKey(days30[0].key)} – ${fmtDateKey(
    days30[days30.length - 1].key
  )}`;

  return (
    <div className={styles.dynamicsCard}>
      <div className={styles.dynamicsHead}>
        <span className={styles.cardTitle}>Динамика средней оценки</span>
        <Dropdown
          value={period}
          options={[
            { value: "7", label: "7 дней" },
            { value: "30", label: "30 дней" },
          ]}
          onChange={(v) => setPeriod(v as "7" | "30")}
          className={styles.periodDropdown}
        />
      </div>

      {period === "7" ? (
        <div className={styles.dynamicsBars}>
          {WEEK.map(({ dow, label }) => {
            const s = byDay.get(dow)?.average_quality_score ?? 0;
            return (
              <div key={dow} className={styles.dynBarCol}>
                {/* Трек со штриховкой на всю высоту; заливка снизу по баллам */}
                <div className={styles.dynBarTrack}>
                  <div className={styles.dynBarFill} style={{ height: `${s}%` }}>
                    {/* У низких столбцов число не помещается внутри — выносим над ним */}
                    <span
                      className={`${styles.dynBarValue} ${
                        s < 18 ? styles.dynBarValueAbove : ""
                      }`}
                    >
                      {s}
                    </span>
                  </div>
                </div>
                <div className={styles.dynBarDay}>{label}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.dynamics30}>
          <div className={`${styles.dynamicsBars30} customScroll`}>
            {days30.map((day) => {
              const hasData = day.score != null;
              const s = day.score ?? 0;
              return (
                <div
                  key={day.key}
                  className={styles.dynBarCol30}
                  title={`${fmtDateKey(day.key)}: ${day.score ?? "—"}`}
                >
                  <div className={styles.dynBarTrack30}>
                    {/* Дни без данных — пустой столбец (только штриховка) */}
                    {hasData && (
                      <div
                        className={styles.dynBarFill30}
                        style={{ height: `${s}%` }}
                      >
                        {/* Число внутри столбца, если помещается по высоте;
                            иначе — над столбцом */}
                        <span
                          className={`${styles.dynBarValue30} ${
                            s < 10 ? styles.dynBarValue30Above : ""
                          }`}
                        >
                          {s}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles.dynRange}>{rangeLabel}</div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Кольцо оценки (карточки «требующие внимания»)
// ============================================================

function ScoreRing({ score }: { score: number | null }) {
  const R = 26;
  const C = 2 * Math.PI * R;
  const frac = score != null ? Math.max(0, Math.min(100, score)) / 100 : 0;
  return (
    <div className={styles.ring}>
      <svg viewBox="0 0 64 64" className={styles.ringSvg}>
        <circle cx="32" cy="32" r={R} className={styles.ringTrack} />
        {score != null && (
          <circle
            cx="32"
            cy="32"
            r={R}
            className={styles.ringFill}
            strokeDasharray={`${frac * C} ${C}`}
            transform="rotate(-90 32 32)"
          />
        )}
      </svg>
      <span className={styles.ringValue}>{score ?? ""}</span>
    </div>
  );
}

// Инициал-аватар менеджера
function ManagerAvatar({ name }: { name: string }) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";
  return <span className={styles.mgrAvatar}>{initial}</span>;
}

// ============================================================
// Кнопка «Сформировать отчёт» с выпадающим окном фильтров
// ============================================================

export interface ReportFilters {
  from: string;
  to: string;
  manager: string;
  channel: string;
}

function ReportButton({
  managerOptions,
  channelOptions,
  error,
  onSubmit,
}: {
  managerOptions: DropdownOption[];
  channelOptions: DropdownOption[];
  // Текст ошибки отчёта (например, «Нет диалогов за этот период»). Появится,
  // когда подключим API запроса отчёта; сейчас не передаётся → не показывается.
  error?: string | null;
  onSubmit: (filters: ReportFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [manager, setManager] = useState("");
  const [channel, setChannel] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Клик вне блока (или Escape) закрывает окно фильтров отчёта
  useOutsideClick(ref, () => setOpen(false), open);

  const handleClick = () => {
    if (!open) {
      setOpen(true);
      return;
    }
    // Второе нажатие — формируем отчёт с выбранными фильтрами
    onSubmit({ from, to, manager, channel });
    setOpen(false);
  };

  const trigger = (
    <button type="button" className={styles.reportBtn} onClick={handleClick}>
      <Download size={18} />
      Сформировать отчёт
    </button>
  );

  return (
    <div className={styles.reportWrap} ref={ref}>
      {open ? (
        <div className={styles.reportCard}>
          {trigger}
          <p className={styles.reportMenuTitle}>Выберите фильтры</p>
          {error && <p className={styles.reportError}>{error}</p>}

          <div className={styles.reportGroup}>
            <span className={styles.filterLabel}>Период</span>
            <div className={styles.reportPeriod}>
              <input
                type="date"
                className={`${styles.dateInput} ${styles.reportDate}`}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <span className={styles.periodDash}>—</span>
              <input
                type="date"
                className={`${styles.dateInput} ${styles.reportDate}`}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.reportGroup}>
            <span className={styles.filterLabel}>Менеджер</span>
            <Dropdown
              value={manager}
              options={[ALL_OPTION, ...managerOptions]}
              onChange={setManager}
              disabled={managerOptions.length === 0}
              className={styles.filterDropdown}
            />
          </div>

          <div className={styles.reportGroup}>
            <span className={styles.filterLabel}>Канал</span>
            <Dropdown
              value={channel}
              options={[ALL_OPTION, ...channelOptions]}
              onChange={setChannel}
              className={styles.filterDropdown}
            />
          </div>
        </div>
      ) : (
        trigger
      )}
    </div>
  );
}

// ============================================================
// Главный компонент
// ============================================================

export interface DashboardUIProps {
  summary: DashboardSummaryResponse | null;
  loading: boolean;

  periodFrom: string;
  periodTo: string;
  onPeriodFrom: (v: string) => void;
  onPeriodTo: (v: string) => void;

  managerValue: string;
  managerOptions: DropdownOption[];
  onManager: (v: string) => void;

  channelValue: string;
  channelOptions: DropdownOption[];
  onChannel: (v: string) => void;

  outcomeValue: string;
  outcomeOptions: DropdownOption[];
  onOutcome: (v: string) => void;

  importValue: string;
  importOptions: DropdownOption[];
  onImport: (v: string) => void;

  filtersDisabled?: boolean;

  onDialogsFilter: (extra: Partial<DialogsListQuery>) => void;
  onOpenDialog: (id: number) => void;
  onSeeAllManagers: () => void;
  onGenerateReport: (filters: ReportFilters) => void;
}

export const DashboardUI = ({
  summary,
  loading,
  periodFrom,
  periodTo,
  onPeriodFrom,
  onPeriodTo,
  managerValue,
  managerOptions,
  onManager,
  channelValue,
  channelOptions,
  onChannel,
  outcomeValue,
  outcomeOptions,
  onOutcome,
  importValue,
  importOptions,
  onImport,
  filtersDisabled = false,
  onDialogsFilter,
  onOpenDialog,
  onSeeAllManagers,
  onGenerateReport,
}: DashboardUIProps) => {
  const fmtScore = (s: number | null | undefined) => (s == null ? "—" : s);
  const hasFilters = Boolean(
    periodFrom ||
      periodTo ||
      managerValue ||
      channelValue ||
      outcomeValue ||
      importValue
  );

  return (
    <div className={`${styles.page} customScroll`}>
      {/* ===== Заголовок ===== */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.h1}>Дашборд</h1>
          <p className={styles.subtitle}>
            Общая картина по всем диалогам и менеджерам
          </p>
        </div>
        <ReportButton
          managerOptions={managerOptions}
          channelOptions={channelOptions}
          onSubmit={onGenerateReport}
        />
      </header>

      {/* ===== KPI ===== */}
      <div className={styles.kpiBar}>
        <Kpi
          value={fmtScore(summary?.dialogs_count)}
          label="Всего диалогов"
          onClick={
            summary?.dialogs_count ? () => onDialogsFilter({}) : undefined
          }
        />
        <Kpi
          value={fmtScore(summary?.analyzed_count)}
          label="Проанализировано"
          onClick={
            summary?.analyzed_count
              ? () => onDialogsFilter({ analysis_status: "done" })
              : undefined
          }
        />
        <Kpi
          value={fmtScore(summary?.average_quality_score)}
          label="Средняя оценка"
          meter={summary?.average_quality_score ?? null}
          meterColor={getScoreColor(summary?.average_quality_score ?? null)}
        />
        <Kpi
          value={fmtScore(summary?.lost_count)}
          label="Потерянных лидов"
          onClick={
            summary?.lost_count
              ? () => onDialogsFilter({ outcome: "lost" })
              : undefined
          }
        />
        <Kpi
          value={fmtScore(summary?.dialogs_with_manager_errors_count)}
          label="Диалогов с ошибками менеджера"
          variant="error"
          onClick={
            summary?.dialogs_with_manager_errors_count
              ? () => onDialogsFilter({ has_manager_errors: true })
              : undefined
          }
        />
        <Kpi
          value={fmtScore(summary?.attention_required_count)}
          label="Диалогов требующих внимания"
          onClick={
            summary?.attention_required_count
              ? () => onDialogsFilter({ preset: "problematic" })
              : undefined
          }
        />
      </div>

      {/* ===== Фильтры ===== */}
      <div className={styles.filters}>
        <div className={`${styles.filterGroup} ${styles.periodGroup}`}>
          <span className={styles.filterLabel}>Период</span>
          <div className={styles.periodInputs}>
            <input
              type="date"
              className={styles.dateInput}
              value={periodFrom}
              onChange={(e) => onPeriodFrom(e.target.value)}
              disabled={filtersDisabled}
            />
            <span className={styles.periodDash}>—</span>
            <input
              type="date"
              className={styles.dateInput}
              value={periodTo}
              onChange={(e) => onPeriodTo(e.target.value)}
              disabled={filtersDisabled}
            />
          </div>
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Менеджер</span>
          <Dropdown
            value={managerValue}
            options={[ALL_OPTION, ...managerOptions]}
            onChange={onManager}
            disabled={filtersDisabled || managerOptions.length === 0}
            className={styles.filterDropdown}
          />
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Канал</span>
          <Dropdown
            value={channelValue}
            options={[ALL_OPTION, ...channelOptions]}
            onChange={onChannel}
            disabled={filtersDisabled || channelOptions.length === 0}
            className={styles.filterDropdown}
          />
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Итог диалога</span>
          <Dropdown
            value={outcomeValue}
            options={[ALL_OPTION, ...outcomeOptions]}
            onChange={onOutcome}
            disabled={filtersDisabled || outcomeOptions.length === 0}
            className={styles.filterDropdown}
          />
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Загрузка</span>
          <Dropdown
            value={importValue}
            options={[ALL_OPTION, ...importOptions]}
            onChange={onImport}
            disabled={filtersDisabled || importOptions.length === 0}
            className={styles.filterDropdown}
          />
        </div>
      </div>

      {loading || !summary ? (
        <div className={styles.centerMessage}>Загрузка…</div>
      ) : summary.dialogs_count === 0 ? (
        hasFilters ? (
          <div className={styles.emptyState}>
            У вас нет диалогов за этот период
          </div>
        ) : (
          <div className={styles.emptyImport}>
            <h2 className={styles.emptyTitle}>
              У вас нет импортированных диалогов
            </h2>
            <Link to="/import" className={styles.emptyCardLink}>
              <GlowCard className={styles.emptyCard}>
                <span className={styles.emptyCardIcon}>
                  <MessageSquare size={22} />
                </span>
                <div className={styles.emptyCardBody}>
                  <h3 className={styles.emptyCardTitle}>Начать импорт</h3>
                  <div className={styles.emptyCardRow}>
                    <p className={styles.emptyCardDesc}>
                      Импортируйте диалог для подробного AI-анализа
                    </p>
                    <span className={styles.emptyCardArrow}>
                      <ArrowRight size={18} />
                    </span>
                  </div>
                </div>
              </GlowCard>
            </Link>
          </div>
        )
      ) : (
        <>
          {/* ===== Почему теряем клиентов ===== */}
          <h2 className={styles.sectionTitle}>Почему теряем клиентов</h2>
          <div className={styles.twoCols}>
            <BarsCard
              title="Топ ошибок менеджеров:"
              items={summary.top_manager_errors}
              palette="warm"
              onItemClick={(key) => onDialogsFilter({ manager_error: key })}
            />
            <BarsCard
              title="Топ возражений:"
              items={summary.top_objections}
              palette="violet"
              onItemClick={(key) => onDialogsFilter({ objection: key })}
            />
          </div>

          {/* ===== Статистика ===== */}
          <h2 className={styles.sectionTitle}>Статистика</h2>
          <div className={`${styles.card} ${styles.statusesCard}`}>
            <p className={styles.cardTitle}>Статусы диалогов</p>
            <Donut
              items={summary.outcomes}
              onSectorClick={(key) =>
                onDialogsFilter({ outcome: key as DialogsListQuery["outcome"] })
              }
            />
          </div>

          <div className={styles.dynamicsRow}>
            <div className={styles.dynamicsInfo}>
              <span
                className={styles.dynamicsScore}
                style={{ color: getScoreColor(summary.average_quality_score) }}
              >
                {summary.average_quality_score ?? "—"}
                <span className={styles.dynamicsScoreMax}> / 100</span>
              </span>
              <span className={styles.dynamicsLevel}>Средний уровень</span>
            </div>
            <Dynamics summary={summary} />
          </div>

          {/* ===== Диалоги требующие внимания ===== */}
          <h2 className={styles.sectionTitle}>Диалоги требующие внимания</h2>
          <div className={styles.attentionRow}>
            {summary.attention_dialogs.slice(0, 6).map((d) => (
              <button
                key={d.id}
                type="button"
                className={styles.attentionCard}
                onClick={() => onOpenDialog(d.id)}
              >
                <div className={styles.attentionMain}>
                  <div className={styles.attentionId}>#{d.id}</div>
                  <div className={styles.attentionTitle}>{d.title}</div>
                  <div className={styles.attentionManager}>{d.manager_name}</div>
                </div>
                <ScoreRing score={d.quality_score} />
                <span className={styles.attentionOpen}>
                  {d.quality_score == null ? "Посмотреть" : "Открыть"}
                  <ArrowRight size={15} />
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.seeAll}
            onClick={() => onDialogsFilter({ preset: "problematic" })}
          >
            Смотреть все диалоги
            <ArrowRight size={16} />
          </button>

          {/* ===== Менеджеры ===== */}
          <h2 className={styles.sectionTitle}>Менеджеры</h2>
          <div className={styles.managersRow}>
            {summary.managers.slice(0, 6).map((m) => (
              <button
                key={m.manager_id ?? m.manager_name}
                type="button"
                className={styles.mgrCard}
                onClick={() =>
                  m.manager_id != null &&
                  onDialogsFilter({ manager_id: m.manager_id })
                }
              >
                <div className={styles.mgrHead}>
                  <ManagerAvatar name={m.manager_name} />
                  <span className={styles.mgrName}>{m.manager_name}</span>
                </div>
                <div className={styles.mgrStats}>
                  <div className={styles.mgrStat}>
                    <span className={styles.mgrStatLabel}>Диалоги</span>
                    <span className={styles.mgrStatValue}>{m.dialogs_count}</span>
                  </div>
                  <div className={styles.mgrStat}>
                    <span className={styles.mgrStatLabel}>Потерянных</span>
                    <span className={`${styles.mgrStatValue} ${styles.mgrLost}`}>
                      {m.lost_count}
                    </span>
                  </div>
                  <div className={styles.mgrStat}>
                    <span className={styles.mgrStatLabel}>Средняя оценка</span>
                    <span
                      className={`${styles.mgrStatValue} ${styles.mgrScore}`}
                      style={{
                        color: getScoreColor(m.average_quality_score),
                      }}
                    >
                      {m.average_quality_score ?? "—"}
                      <span className={styles.mgrScoreMax}>/100</span>
                    </span>
                  </div>
                </div>
                <div className={styles.mgrError}>
                  <span className={styles.mgrErrorLabel}>Частая ошибка</span>
                  <span className={styles.mgrErrorValue}>
                    {m.most_frequent_error?.label ?? "—"}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.seeAll}
            onClick={onSeeAllManagers}
          >
            Смотреть всех менеджеров
            <ArrowRight size={16} />
          </button>
        </>
      )}
    </div>
  );
};
