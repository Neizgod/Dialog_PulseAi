import { useState } from "react";
import styles from "./DialogCardUI.module.css";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Check,
  AlertCircle,
  AlertTriangle,
  MessageSquare,
  Lightbulb,
  FileText,
  Sparkles,
  BadgeCheck,
  Loader2,
} from "lucide-react";
import type {
  DialogDetail,
  DialogNavigationResponse,
  DialogMessage,
} from "../../../utils/types/dialogs.types";
import type { AnalysisTagItem } from "../../../utils/types/common.types";
import {
  formatChannel,
  formatDate,
  getOutcomeConfig,
  getTemperatureConfig,
  ANALYSIS_STATUS_LABELS,
  type OutcomeConfig,
} from "../../../utils/utils";

// ============================================================
// Метрики (Итог / Температура / Оценка качества)
// ============================================================

const variantClass: Record<OutcomeConfig["variant"], string> = {
  success: styles.vSuccess,
  error: styles.vError,
  warning: styles.vWarning,
  info: styles.vInfo,
  neutral: styles.vNeutral,
  lime: styles.vLime,
};

// Ширина полоски температуры по ключу
const TEMP_FILL: Record<string, number> = {
  hot: 92,
  warm: 60,
  cold: 32,
  unknown: 0,
};

// Категории: 80–100 высокий, 50–79 средний, 0–49 низкий
const scoreVariant = (score: number): OutcomeConfig["variant"] =>
  score >= 80 ? "lime" : score >= 50 ? "warning" : "error";

const TEMPERATURE_HINT =
  "Температура показывает, насколько клиент был близок к целевому действию. " +
  "Особенно важны случаи, когда клиент был тёплым или горячим, но диалог " +
  "закончился потерей заявки.";

function MetricsBar({ detail }: { detail: DialogDetail }) {
  const analysis = detail.analysis;
  const ready = detail.analysis_status === "done" && analysis != null;
  const processing = detail.analysis_status === "processing";

  const placeholder = processing ? (
    <span className={styles.metricDots}>···</span>
  ) : (
    <span className={styles.metricDash}>—</span>
  );

  const outcomeCfg = analysis ? getOutcomeConfig(analysis.outcome) : null;
  const tempCfg = analysis ? getTemperatureConfig(analysis.client_temperature) : null;
  const score = analysis?.quality_score ?? null;

  return (
    <div className={styles.metrics}>
      {/* Итог */}
      <div className={styles.metric}>
        {ready && outcomeCfg ? (
          <span className={`${styles.metricValue} ${variantClass[outcomeCfg.variant]}`}>
            {analysis!.outcome_label || outcomeCfg.label}
          </span>
        ) : (
          placeholder
        )}
        <span className={styles.metricLabel}>Итог</span>
      </div>

      {/* Температура клиента */}
      <div className={`${styles.metric} ${styles.metricBordered}`}>
        <span className={styles.hintMark}>
          ?
          <span className={styles.tooltip}>{TEMPERATURE_HINT}</span>
        </span>
        {ready && tempCfg ? (
          <>
            <span className={`${styles.metricValue} ${variantClass[tempCfg.variant]}`}>
              {analysis!.client_temperature_label || tempCfg.label}
            </span>
            <div className={styles.meter}>
              <div
                className={`${styles.meterFill} ${variantClass[tempCfg.variant]}`}
                style={{ width: `${TEMP_FILL[analysis!.client_temperature] ?? 0}%` }}
              />
            </div>
          </>
        ) : (
          placeholder
        )}
        <span className={styles.metricLabel}>Температура клиента</span>
      </div>

      {/* Оценка качества */}
      <div className={`${styles.metric} ${styles.metricBordered}`}>
        {ready && score != null ? (
          <>
            <span className={styles.metricValue}>
              <span className={variantClass[scoreVariant(score)]}>{score}</span>
              <span className={styles.scoreMax}> / 100</span>
            </span>
            <div className={styles.meter}>
              <div
                className={`${styles.meterFill} ${variantClass[scoreVariant(score)]}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </>
        ) : (
          placeholder
        )}
        <span className={styles.metricLabel}>Оценка качества</span>
      </div>
    </div>
  );
}

// ============================================================
// Лента сообщений
// ============================================================

function MessagesPanel({
  messages,
  highlighted,
}: {
  messages: DialogMessage[];
  highlighted: Set<number>;
}) {
  return (
    <aside className={styles.dialogPanel}>
      <h2 className={styles.dialogTitle}>Исходный диалог</h2>
      <div className={styles.messages}>
        {messages.map((m) => {
          const isManager = m.sender_role === "manager";
          const roleLabel = isManager
            ? "Менеджер"
            : m.sender_role === "client"
            ? "Клиент"
            : m.sender_name || "Система";
          return (
            <div
              key={m.id}
              className={`${styles.msgRow} ${isManager ? styles.msgRight : ""}`}
            >
              <div
                className={`${styles.bubble} ${
                  isManager ? styles.bubbleManager : styles.bubbleClient
                } ${highlighted.has(m.position) ? styles.bubbleHighlight : ""}`}
              >
                <span className={styles.bubbleRole}>{roleLabel}</span>
                <span className={styles.bubbleText}>{m.content}</span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ============================================================
// Блок-карточка анализа + аккордеон
// ============================================================

function Block({
  icon,
  title,
  tone = "neutral",
  className,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone?: "neutral" | "danger" | "accent" | "warning" | "info";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${styles.block} ${styles[`tone_${tone}`]} ${className ?? ""}`}>
      <div className={styles.blockHead}>
        <span className={styles.blockIcon}>{icon}</span>
        <h3 className={styles.blockTitle}>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function AccordionItem({ item }: { item: AnalysisTagItem }) {
  const [open, setOpen] = useState(false);
  const hasDetail = Boolean(item.detail);
  return (
    <div className={`${styles.acc} ${open ? styles.accOpen : ""}`}>
      <button
        type="button"
        className={styles.accHead}
        onClick={() => hasDetail && setOpen((v) => !v)}
        disabled={!hasDetail}
      >
        {hasDetail && <ChevronDown size={14} className={styles.accChevron} />}
        <span className={styles.accLabel}>{item.label}</span>
      </button>
      {open && hasDetail && <p className={styles.accBody}>{item.detail}</p>}
    </div>
  );
}

function ItemsAccordion({ items }: { items: AnalysisTagItem[] }) {
  return (
    <div className={styles.accList}>
      {items.map((it) => (
        <AccordionItem key={it.key} item={it} />
      ))}
    </div>
  );
}

// ============================================================
// Состояния правой области
// ============================================================

// Подпись отправителя по роли сообщения
const senderLabel = (m: DialogMessage): string =>
  m.sender_role === "manager"
    ? "Менеджер"
    : m.sender_role === "client"
    ? "Клиент"
    : m.sender_name || "Система";

function DoneAnalysis({ detail }: { detail: DialogDetail }) {
  const a = detail.analysis;
  if (!a) return null;

  const isLost = a.outcome === "lost";

  // Сопоставляем evidence с сообщениями по position, чтобы показать автора реплики
  const msgByPos = new Map(detail.messages.map((m) => [m.position, m]));

  return (
    <div className={styles.analysisArea}>
      <h2 className={styles.analysisTitle}>AI-анализ диалога</h2>

      <div className={styles.grid}>
        {isLost && a.loss_reasons.length > 0 && (
          <Block
            icon={<AlertCircle size={18} />}
            title="Вероятные причины потери"
            tone="danger"
          >
            <ul className={styles.reasonList}>
              {a.loss_reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </Block>
        )}

        <Block icon={<BadgeCheck size={18} />} title="Краткое резюме" tone="info">
          <p className={styles.blockTextGradient}>{a.summary}</p>
        </Block>

        {a.manager_error_items.length > 0 && (
          <Block
            icon={<AlertTriangle size={18} />}
            title="Ошибки менеджера"
            tone="warning"
          >
            <ItemsAccordion items={a.manager_error_items} />
          </Block>
        )}

        {a.objection_items.length > 0 && (
          <Block icon={<MessageSquare size={18} />} title="Возражения клиента">
            <ItemsAccordion items={a.objection_items} />
          </Block>
        )}

        {a.recommendation && (
          <Block icon={<Lightbulb size={18} />} title="Рекомендация" tone="accent">
            <p className={styles.blockTextGradient}>{a.recommendation}</p>
          </Block>
        )}

        {a.better_reply && (
          <Block
            icon={<Check size={18} />}
            title="Возможный улучшенный ответ"
            tone="accent"
          >
            <p className={styles.blockTextGradient}>{a.better_reply}</p>
          </Block>
        )}

        {a.evidence.length > 0 && (
          <Block
            icon={<FileText size={18} />}
            title="Примеры из диалога"
            tone="info"
            className={styles.blockWide}
          >
            <div className={styles.evidence}>
              {a.evidence.map((e, i) => {
                const msg = msgByPos.get(e.message_position);
                return (
                  <div key={i} className={styles.evidenceRow}>
                    <span className={styles.evidenceQuote}>
                      {msg && (
                        <span className={styles.evidenceSender}>
                          {senderLabel(msg)}:{" "}
                        </span>
                      )}
                      «{e.quote}»
                    </span>
                    <ArrowRight size={16} className={styles.evidenceArrow} />
                    <span className={styles.evidenceReason}>{e.reason}</span>
                  </div>
                );
              })}
            </div>
          </Block>
        )}
      </div>
    </div>
  );
}

function ProcessingState() {
  return (
    <div className={styles.analysisArea}>
      <h2 className={styles.analysisTitle}>AI-анализ диалога</h2>
      <div className={styles.centerState}>
        <span className={styles.ring}>
          <Loader2 size={48} className={styles.ringSpin} />
        </span>
        <Block icon={<Sparkles size={18} />} title="Анализ выполняется" tone="accent">
          <p className={styles.blockText}>
            Вы можете просмотреть исходный диалог, результат появится после
            завершения обработки.
          </p>
        </Block>
      </div>
    </div>
  );
}

function PendingState({
  onRun,
  runLoading,
}: {
  onRun: () => void;
  runLoading: boolean;
}) {
  return (
    <div className={styles.analysisArea}>
      <h2 className={styles.analysisTitle}>AI-анализ диалога</h2>
      <div className={styles.centerState}>
        <Block icon={<Sparkles size={18} />} title="Анализ ещё не выполнен" tone="accent">
          <p className={styles.blockText}>
            Запустите AI-анализ, чтобы получить итог диалога, ошибки менеджера,
            возражения клиента и рекомендации.
          </p>
          <button
            type="button"
            className={styles.inlineRun}
            onClick={onRun}
            disabled={runLoading}
          >
            {runLoading ? <Loader2 size={16} className={styles.spin} /> : <Sparkles size={16} />}
            Запустить AI-анализ
          </button>
        </Block>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string | null }) {
  return (
    <div className={styles.analysisArea}>
      <h2 className={styles.analysisErrorTitle}>
        Не удалось выполнить AI-анализ этого диалога
      </h2>
      <Block
        icon={<AlertTriangle size={18} />}
        title="Вероятные причины"
        tone="danger"
        className={styles.errorBlock}
      >
        {message && <p className={styles.blockText}>{message}</p>}
        <ul className={styles.reasonList}>
          <li>Некорректная структура диалога</li>
          <li>Модель не вернула валидный результат</li>
          <li>Временная ошибка сервиса</li>
        </ul>
      </Block>
    </div>
  );
}

// ============================================================
// Главный компонент
// ============================================================

export interface DialogCardUIProps {
  detail: DialogDetail | null;
  loading: boolean;
  error: string | null;
  navigation: DialogNavigationResponse | null;
  runLoading: boolean;
  // Подпись кнопки «назад» зависит от того, откуда зашли (список / дашборд)
  backLabel: string;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onRun: () => void;
}

export const DialogCardUI = ({
  detail,
  loading,
  error,
  navigation,
  runLoading,
  backLabel,
  onBack,
  onPrev,
  onNext,
  onRun,
}: DialogCardUIProps) => {
  // Шапка-навигация (общая для всех состояний)
  const nav = (
    <div className={styles.navGroup}>
      <button
        type="button"
        className={styles.navBtn}
        onClick={onPrev}
        disabled={navigation?.previous_dialog_id == null}
      >
        <ArrowLeft size={16} />
        Предыдущий
      </button>
      <span className={styles.navCounter}>
        {navigation?.current_position != null
          ? `${navigation.current_position} из ${navigation.total_dialogs}`
          : "—"}
      </span>
      <button
        type="button"
        className={styles.navBtn}
        onClick={onNext}
        disabled={navigation?.next_dialog_id == null}
      >
        Следующий
        <ArrowRight size={16} />
      </button>
    </div>
  );

  const header = (
    <header className={styles.header}>
      <button type="button" className={styles.backLink} onClick={onBack}>
        <ArrowLeft size={18} />
        {backLabel}
      </button>
      {nav}
    </header>
  );

  if (loading || (!detail && !error)) {
    return (
      <div className={`${styles.page} customScroll`}>
        {header}
        <div className={styles.centerMessage}>Загрузка…</div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className={`${styles.page} customScroll`}>
        {header}
        <div className={styles.centerMessage}>
          {error ?? "Не удалось загрузить диалог"}
        </div>
      </div>
    );
  }

  const status = detail.analysis_status;
  const highlighted = new Set(
    (detail.analysis?.evidence ?? []).map((e) => e.message_position)
  );

  return (
    <div className={`${styles.page} customScroll`}>
      {header}

      {/* Слева — заголовок и мета (в 2 строки), справа — метрики-summary */}
      <div className={styles.topRow}>
        <div className={styles.titleBlock}>
          <h1 className={styles.h1}>Диалог #{detail.id}</h1>
          <div className={styles.meta}>
            <span>
              Менеджер: <b>{detail.manager?.name ?? "—"}</b>
            </span>
            <span>
              Дата: {detail.started_at ? formatDate(detail.started_at) : "—"}
            </span>
            <span>Канал: {formatChannel(detail.channel)}</span>
            <span>
              Статус анализа: {ANALYSIS_STATUS_LABELS[status] ?? status}
            </span>
          </div>
        </div>
        <MetricsBar detail={detail} />
      </div>

      {/* Основная область: диалог + анализ */}
      <div className={styles.body}>
        <MessagesPanel messages={detail.messages} highlighted={highlighted} />

        {status === "done" && <DoneAnalysis detail={detail} />}
        {status === "processing" && <ProcessingState />}
        {status === "pending" && (
          <PendingState onRun={onRun} runLoading={runLoading} />
        )}
        {status === "error" && (
          <ErrorState message={detail.analysis?.error_message ?? null} />
        )}
      </div>

      {/* Кнопка повтора/запуска (кроме состояния processing) */}
      {status !== "processing" && (
        <button
          type="button"
          className={styles.fab}
          onClick={onRun}
          disabled={runLoading}
        >
          {runLoading ? (
            <Loader2 size={18} className={styles.spin} />
          ) : (
            <Sparkles size={18} />
          )}
          {status === "pending" ? "Запустить AI-анализ" : "Повторить AI-анализ"}
        </button>
      )}
    </div>
  );
};
