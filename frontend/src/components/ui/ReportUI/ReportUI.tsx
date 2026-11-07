import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  AlertTriangle,
  BadgeCheck,
  Lightbulb,
  ChevronDown,
} from "lucide-react";
// Общие блоки (page/header/kpi/donut/бары/секции/менеджеры) переиспользуем из дашборда
import d from "../DashboardUI/DashboardUI.module.css";
import s from "./ReportUI.module.css";
import graphickIcon from "../../../assets/images/graphick.svg";
import checkIcon from "../../../assets/images/checkiconinwindow.svg";
import { GlowCard } from "../glowCard/glowCard";
import { getScoreColor } from "../../../utils/color";
import type {
  ManagerReportResponse,
  ManagerReportOverview,
  ReportMetricItem,
  ReportLossReason,
  ReportManagerGrowth,
  ReportReviewDialog,
} from "../../../utils/types/reports.types";

// Цвета секторов donut по ключу итога
const OUTCOME_COLOR: Record<string, string> = {
  success: "#7cc643",
  lost: "#ff4b4b",
  pending: "#92c1ff",
  complaint: "#ff8c42",
  consultation: "#d3f86b",
  unknown: "#9b9ba3",
};

const OUTCOME_BG: Record<string, string> = {
  success: "rgba(31, 43, 40, 0.4)",
  pending: "rgba(35, 39, 48, 0.4)",
  consultation: "rgba(35, 37, 29, 0.4)",
  lost: "rgba(40, 33, 43, 0.4)",
  complaint: "rgba(37, 35, 37, 0.4)",
};

const OUTCOME_LEGEND_LABEL: Record<string, string> = {
  success: "Успешные",
  pending: "В процессе",
  consultation: "Консультации",
  lost: "Потерянные",
  complaint: "Жалобы",
  unknown: "Неизвестно",
};

const pctLabel = (percent: number | null): string =>
  percent == null ? "" : `(${percent}%)`;

// ============================================================
// KPI
// ============================================================

function Kpi({
  value,
  label,
  variant,
  meter,
  meterColor,
}: {
  value: React.ReactNode;
  label: string;
  variant?: "error";
  meter?: number | null;
  meterColor?: string;
}) {
  return (
    <div className={d.kpi}>
      <span
        className={`${d.kpiValue} ${variant === "error" ? d.kpiError : ""}`}
        style={meter != null && meterColor ? { color: meterColor } : undefined}
      >
        {value}
        {meter != null && <span className={d.kpiMax}> / 100</span>}
      </span>
      {meter != null && (
        <div className={d.kpiMeter}>
          <div
            className={d.kpiMeterFill}
            style={{ width: `${meter}%`, background: meterColor }}
          />
        </div>
      )}
      <span className={`${d.kpiLabel} ${variant === "error" ? d.kpiError : ""}`}>
        {label}
      </span>
    </div>
  );
}

function KpiBar({ overview }: { overview: ManagerReportOverview | null }) {
  const v = (n: number | null | undefined): React.ReactNode => (n == null ? "—" : n);
  const avg = overview?.average_quality_score ?? null;
  return (
    <div className={d.kpiBar}>
      <Kpi value={v(overview?.dialogs_count)} label="Всего диалогов" />
      <Kpi value={v(overview?.analyzed_count)} label="Проанализировано" />
      <Kpi
        value={avg ?? "—"}
        label="Средняя оценка"
        meter={avg}
        meterColor={getScoreColor(avg)}
      />
      <Kpi value={v(overview?.lost_count)} label="Потерянных лидов" />
      <Kpi
        value={v(overview?.dialogs_with_manager_errors_count)}
        label="Диалогов с ошибками менеджера"
        variant="error"
      />
      <Kpi
        value={v(overview?.attention_required_count)}
        label="Диалогов требующих внимания"
      />
    </div>
  );
}

// ============================================================
// Donut «Статусы диалогов»
// ============================================================

function Donut({ items }: { items: ReportMetricItem[] }) {
  const total = items.reduce((sum, i) => sum + i.count, 0);
  const visible = items.filter((it) => it.count > 0);
  const R = 70;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className={d.donutBlock}>
      <div className={d.donutWrap}>
        <svg viewBox="0 0 180 180" className={d.donutSvg}>
          <circle cx="90" cy="90" r={R} className={d.donutTrack} />
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
        <div className={d.donutCenter}>
          <span className={d.donutTotal}>{total}</span>
          <span className={d.donutTotalLabel}>Всего</span>
        </div>
      </div>
      <div className={d.legend}>
        {items.map((it) => {
          const c = OUTCOME_COLOR[it.key] ?? "#9b9ba3";
          return (
            <div
              key={it.key}
              className={d.legendItem}
              style={{
                color: c,
                background:
                  OUTCOME_BG[it.key] ??
                  `color-mix(in srgb, ${c} 16%, transparent)`,
              }}
            >
              <span className={d.legendLabel}>
                {OUTCOME_LEGEND_LABEL[it.key] ?? it.label}
              </span>
              <span className={d.legendCount}>{it.count}</span>
              <span className={d.legendPct}>{pctLabel(it.percent)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Бары (топ ошибок / возражений)
// ============================================================

function Bars({
  items,
  palette,
}: {
  items: ReportMetricItem[];
  palette: "warm" | "violet";
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className={d.bars}>
      {items.map((it, idx) => (
        <div key={it.key} className={d.barRow}>
          <span
            className={`${d.bar} ${palette === "warm" ? d.barWarm : d.barViolet}`}
            style={{
              width: `${Math.max(18, (it.count / max) * 100)}%`,
              ...(palette === "warm" ? { ["--bar-i" as string]: String(idx) } : {}),
            }}
          >
            <span className={d.barLabel}>{it.label}</span>
          </span>
          <span className={d.barCount}>
            {it.count} <span className={d.barPct}>{pctLabel(it.percent)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Аккордеон причин потери
// ============================================================

function LossItem({ item }: { item: ReportLossReason }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`${s.lossItem} ${open ? s.lossItemOpen : ""}`}>
      <button
        type="button"
        className={s.lossHead}
        onClick={() => setOpen((o) => !o)}
      >
        <ChevronDown size={14} className={s.lossChevron} />
        <span>{item.title}</span>
        {item.count != null && <span className={s.lossCount}>{item.count}</span>}
      </button>
      {open && <p className={s.lossDesc}>{item.description}</p>}
    </div>
  );
}

// ============================================================
// Карточка менеджера (зоны роста)
// ============================================================

function ManagerCard({
  m,
  onClick,
}: {
  m: ReportManagerGrowth;
  onClick: () => void;
}) {
  const initial = m.manager_name?.trim()?.[0]?.toUpperCase() ?? "?";
  const topError = m.frequent_errors[0]?.label ?? "—";
  return (
    <button
      type="button"
      className={d.mgrCard}
      onClick={onClick}
      disabled={m.manager_id == null}
    >
      <div className={s.mgrTop}>
        <div className={d.mgrHead}>
          <span className={d.mgrAvatar}>{initial}</span>
          <span className={d.mgrName}>{m.manager_name}</span>
        </div>
        <div className={s.mgrScoreBox}>
          <span className={s.mgrScoreLabel}>Средняя оценка</span>
          <span
            className={s.mgrScoreVal}
            style={{ color: getScoreColor(m.average_quality_score) }}
          >
            {m.average_quality_score ?? "—"}
            <span className={s.mgrScoreMax}>/100</span>
          </span>
        </div>
      </div>
      <div className={s.mgrZone}>
        <span className={s.mgrZoneLabel}>Частая ошибка</span>
        <span className={s.mgrZoneVal}>{topError}</span>
      </div>
    </button>
  );
}

// ============================================================
// Карточка диалога для разбора
// ============================================================

function ReviewCard({
  r,
  onOpen,
}: {
  r: ReportReviewDialog;
  onOpen: () => void;
}) {
  const meta = [r.manager_name, r.outcome_label].filter(Boolean).join(" · ");
  // Номер диалога показываем отдельной меткой (#id). Бэкенд иногда дублирует его
  // в начале title («Диалог #101 — …», «#101 …») — срезаем ведущий префикс с этим
  // же номером, чтобы он не выводился дважды.
  const idPrefix = new RegExp(`^\\s*(?:Диалог\\s*)?#?${r.id}\\b[\\s:.\\u2013\\u2014-]*`, "i");
  const title = r.title.replace(idPrefix, "").trim() || r.title;
  return (
    <button type="button" className={s.reviewCard} onClick={onOpen}>
      <span className={s.reviewId}>#{r.id}</span>
      <span className={s.reviewTitle}>{title}</span>
      {meta && <span className={s.reviewMeta}>{meta}</span>}
      {r.reason_label && <span className={s.reviewMeta}>{r.reason_label}</span>}
      <span className={s.reviewOpen}>
        {r.quality_score == null ? "Посмотреть" : "Открыть"}
        <ArrowRight size={15} />
      </span>
    </button>
  );
}

// ============================================================
// Состояния экрана
// ============================================================

function NoAnalyzed({ title, message }: { title: string; message: string }) {
  return (
    <div className={d.emptyImport}>
      <h2 className={d.emptyTitle}>
        {title || "У вас нет проанализированных диалогов"}
      </h2>
      <Link to="/dialogs" className={d.emptyCardLink}>
        <GlowCard className={d.emptyCard}>
          <span className={d.emptyCardIcon}>
            <Sparkles size={22} />
          </span>
          <div className={d.emptyCardBody}>
            <h3 className={d.emptyCardTitle}>Начните AI-анализ</h3>
            <div className={d.emptyCardRow}>
              <p className={d.emptyCardDesc}>
                {message || "Начните AI-анализ диалогов прямо сейчас"}
              </p>
              <span className={d.emptyCardArrow}>
                <ArrowRight size={18} />
              </span>
            </div>
          </div>
        </GlowCard>
      </Link>
    </div>
  );
}

function ErrorState() {
  return (
    <>
      <h2 className={s.errorTitle}>Не удалось выполнить формирование отчёта</h2>
      <div className={s.errorBlock}>
        <div className={s.blockHead}>
          <span className={s.blockIcon} style={{ color: "var(--color-error)" }}>
            <AlertTriangle size={18} />
          </span>
          <h3 className={s.blockTitle} style={{ color: "var(--color-error)" }}>
            Вероятные причины
          </h3>
        </div>
        <ul className={s.errorList}>
          <li>Некорректная структура диалога</li>
          <li>Модель не вернула валидный результат</li>
          <li>Временная ошибка сервиса</li>
        </ul>
      </div>
    </>
  );
}

// ============================================================
// Полный отчёт (state = ready / insufficient_data)
// ============================================================

function FullReport({
  report,
  onSeeAllManagers,
  onOpenDialog,
  onOpenManager,
}: {
  report: ManagerReportResponse;
  onSeeAllManagers: () => void;
  onOpenDialog: (id: number) => void;
  onOpenManager: (id: number) => void;
}) {
  const r = report;
  return (
    <>
      {r.state.key === "insufficient_data" && (
        <div className={s.warning}>
          <span className={s.warningTitle}>
            {r.state.title || "Данных недостаточно"}
          </span>
          {r.state.message && (
            <span className={s.warningText}>{r.state.message}</span>
          )}
        </div>
      )}

      {/* Карточки в две независимые колонки (масонри): каждая колонка
          складывается плотно и заполняет пустоту под короткими карточками */}
      <div className={s.cols}>
        {/* ===== Левая колонка ===== */}
        <div className={s.col}>
          {/* Статусы диалогов */}
          <div className={`${d.card} ${s.statusCard}`}>
            <p className={d.cardTitle}>Статусы диалогов</p>
            <Donut items={r.outcomes} />
          </div>

          {/* Краткое резюме */}
          {r.executive_summary.length > 0 && (
            <div className={`${s.block} ${s.blockAccent}`}>
              <div className={s.blockHead}>
                <span className={`${s.blockIcon} ${s.blockIconBlue}`}>
                  <BadgeCheck size={18} />
                </span>
                <h3 className={`${s.blockTitle} ${s.blockTitleBlue}`}>
                  Краткое резюме
                </h3>
              </div>
              <div className={s.innerCard}>
                {r.executive_summary.map((p, i) => (
                  <p key={i} className={s.summaryText}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Темы для развития команды */}
          <div className={`${s.block} ${s.blockMuted}`}>
            <div className={s.blockHead}>
              <span className={s.blockIcon}>
                <img src={graphickIcon} width={18} height={18} alt="" />
              </span>
              <div className={s.blockHeadText}>
                <h3 className={`${s.blockTitle} ${s.blockTitleBlue}`}>
                  Темы для развития команды
                </h3>
                <span className={s.blockSubtitle}>
                  На основе частых ошибок и возражений стоит отработать с
                  менеджерами:
                </span>
              </div>
            </div>
            {r.training_topics.length > 0 ? (
              <ul className={s.bulletList}>
                {r.training_topics.map((t, i) => (
                  <li key={i}>{t.title}</li>
                ))}
              </ul>
            ) : (
              <div className={s.blockEmpty}>
                Недостаточно данных для уверенных рекомендаций
              </div>
            )}
          </div>

          {/* Топ ошибок менеджеров */}
          {r.top_manager_errors.length > 0 && (
            <div className={d.card}>
              <p className={d.cardTitle}>Топ ошибок менеджеров:</p>
              <Bars items={r.top_manager_errors} palette="warm" />
            </div>
          )}
        </div>

        {/* ===== Правая колонка ===== */}
        <div className={s.col}>
          {/* Главные причины потери заявок */}
          {r.loss_reasons.length > 0 && (
            <div className={s.block}>
              <div className={s.blockHead}>
                <span className={`${s.blockIcon} ${s.blockIconWarn}`}>
                  <AlertTriangle size={18} />
                </span>
                <h3 className={s.blockTitle}>Главные причины потери заявок</h3>
              </div>
              <div className={s.lossList}>
                {r.loss_reasons.map((l, i) => (
                  <LossItem key={l.key ?? i} item={l} />
                ))}
              </div>
            </div>
          )}

          {/* Рекомендация */}
          {r.next_actions.length > 0 && (
            <div className={`${s.block} ${s.blockAccent}`}>
              <div className={s.blockHead}>
                <span className={`${s.blockIcon} ${s.blockIconAccent}`}>
                  <Lightbulb size={18} />
                </span>
                <h3 className={`${s.blockTitle} ${s.blockTitleAccent}`}>
                  Рекомендация
                </h3>
              </div>
              <div className={`${s.innerCard} ${s.innerCardRec}`}>
                <ol className={s.numList}>
                  {r.next_actions.slice(0, 5).map((a, i) => (
                    <li key={a.key ?? i}>{a.title}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* Что стоит добавить в скрипт продаж */}
          {r.script_fixes.length > 0 && (
            <div className={`${s.block} ${s.blockMuted}`}>
              <div className={s.blockHead}>
                <span className={s.blockIcon}>
                  <img src={checkIcon} width={18} height={18} alt="" />
                </span>
                <h3 className={`${s.blockTitle} ${s.blockTitleBlue}`}>
                  Что стоит добавить в скрипт продаж
                </h3>
              </div>
              <ul className={s.bulletList}>
                {r.script_fixes.map((t, i) => (
                  <li key={i}>{t.title}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Топ возражений */}
          {r.top_objections.length > 0 && (
            <div className={d.card}>
              <p className={d.cardTitle}>Топ возражений:</p>
              <Bars items={r.top_objections} palette="violet" />
            </div>
          )}
        </div>
      </div>

      {/* Менеджеры */}
      {r.managers_growth.length > 0 && (
        <>
          <h2 className={d.sectionTitle}>Менеджеры</h2>
          <div className={`${d.managersRow} ${s.managersRow}`}>
            {r.managers_growth.map((m) => (
              <ManagerCard
                key={m.manager_id ?? m.manager_name}
                m={m}
                onClick={() =>
                  m.manager_id != null && onOpenManager(m.manager_id)
                }
              />
            ))}
          </div>
          <button type="button" className={d.seeAll} onClick={onSeeAllManagers}>
            Смотреть всех менеджеров
            <ArrowRight size={16} />
          </button>
        </>
      )}

      {/* Диалоги для ручного разбора */}
      {r.review_dialogs.length > 0 && (
        <>
          <h2 className={d.sectionTitle}>Диалоги для ручного разбора</h2>
          <div className={s.reviewRow}>
            {r.review_dialogs.map((rd) => (
              <ReviewCard key={rd.id} r={rd} onOpen={() => onOpenDialog(rd.id)} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ============================================================
// Главный компонент
// ============================================================

export interface ReportUIProps {
  report: ManagerReportResponse | null;
  loading: boolean;
  error: string | null;
  onOpenDialog: (id: number) => void;
  onOpenManager: (id: number) => void;
  onSeeAllManagers: () => void;
}

export const ReportUI = ({
  report,
  loading,
  error,
  onOpenDialog,
  onOpenManager,
  onSeeAllManagers,
}: ReportUIProps) => {
  return (
    <div className={d.page}>
      <header className={d.header}>
        <div>
          <h1 className={d.h1}>Отчёт</h1>
          <p className={d.subtitle}>Управленческая выжимка по диалогам</p>
        </div>
      </header>

      <KpiBar overview={report?.overview ?? null} />

      {loading ? (
        <div className={d.centerMessage}>Загрузка…</div>
      ) : error ? (
        <ErrorState />
      ) : !report ? (
        <div className={d.centerMessage}>Нет данных</div>
      ) : report.state.key === "no_dialogs" ? (
        <div className={d.emptyState}>
          {report.state.title || "У вас нет диалогов за этот период"}
        </div>
      ) : report.state.key === "no_analyzed" ? (
        <NoAnalyzed title={report.state.title} message={report.state.message} />
      ) : (
        <FullReport
          report={report}
          onSeeAllManagers={onSeeAllManagers}
          onOpenDialog={onOpenDialog}
          onOpenManager={onOpenManager}
        />
      )}
    </div>
  );
};
