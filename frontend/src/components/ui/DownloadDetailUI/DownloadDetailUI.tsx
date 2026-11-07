import { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Check,
  AlertCircle,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import styles from "./DownloadDetailUI.module.css";
// Таблицу оформляем теми же классами, что и на странице «Диалоги»
import dlg from "../DialogsUI/DialogsUI.module.css";
import tagRight from "../../../assets/images/tag-right.svg";
import type { ImportBatchRead } from "../../../utils/types/imports.types";
import type { ImportAnalysisProgressResponse } from "../../../utils/types/analysis.types";
import type { DialogListItem } from "../../../utils/types/dialogs.types";
import {
  getOutcomeConfig,
  formatChannel,
  formatDate,
  type OutcomeConfig,
} from "../../../utils/utils";
import { getScoreColor } from "../../../utils/color";

// Состояние экрана (вычисляется в контейнере по import.status + progress.status)
export type DownloadScreenState =
  | "pending"
  | "processing"
  | "partially_completed"
  | "completed"
  | "completed_with_errors"
  | "empty"
  | "analysis_failed";

const STATUS_LINE: Record<DownloadScreenState, string> = {
  pending: "Ожидает анализа",
  processing: "Анализируется",
  partially_completed: "Частично обработано",
  completed: "Готово",
  completed_with_errors: "Завершено с ошибками",
  empty: "—",
  analysis_failed: "—",
};

const variantClass: Record<OutcomeConfig["variant"], string> = {
  success: dlg.badgeSuccess,
  error: dlg.badgeError,
  warning: dlg.badgeWarning,
  info: dlg.badgeInfo,
  neutral: dlg.badgeNeutral,
  lime: dlg.badgeLime,
};


// ===== Ячейки таблицы =====
function OutcomeCell({ item }: { item: DialogListItem }) {
  const st = item.analysis_status;
  if (st === "done") {
    const cfg = getOutcomeConfig(item.analysis?.outcome);
    return (
      <span className={`${dlg.badge} ${variantClass[cfg.variant]}`}>
        {item.analysis?.outcome_label || cfg.label}
      </span>
    );
  }
  if (st === "error") {
    return (
      <span
        className={`${dlg.badge} ${dlg.badgeError}`}
        title={item.analysis?.error_message ?? "Ошибка анализа"}
      >
        Ошибка анализа
      </span>
    );
  }
  return <span className={dlg.placeholder}>…</span>;
}

function ScoreCell({ item }: { item: DialogListItem }) {
  const score = item.analysis?.quality_score;
  if (item.analysis_status === "done" && score != null) {
    const c = getScoreColor(score);
    return (
      <span className={dlg.scorePill} style={{ color: c, borderColor: c }}>
        {score}%
      </span>
    );
  }
  return <span className={dlg.placeholder}>…</span>;
}

function StatusIcon({ item }: { item: DialogListItem }) {
  switch (item.analysis_status) {
    case "done":
      return (
        <span className={`${dlg.statusIcon} ${dlg.statusDone}`}>
          <Check size={12} />
        </span>
      );
    case "processing":
      return (
        <span className={`${dlg.statusIcon} ${dlg.statusProcessing}`}>
          <Loader2 size={16} />
        </span>
      );
    case "error":
      return (
        <span
          className={`${dlg.statusIcon} ${dlg.statusError}`}
          title={item.analysis?.error_message ?? "Ошибка анализа"}
        >
          <AlertCircle size={16} />
        </span>
      );
    default:
      return (
        <span className={`${dlg.statusIcon} ${dlg.statusPending}`}>
          <MoreHorizontal size={16} />
        </span>
      );
  }
}

// ===== Пагинация (как в Диалогах) =====
function Pagination({
  page,
  pages,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const nums: (number | "...")[] = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) nums.push(i);
  } else {
    nums.push(1);
    if (page > 3) nums.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++)
      nums.push(i);
    if (page < pages - 2) nums.push("...");
    nums.push(pages);
  }
  return (
    <div className={dlg.pagination}>
      <span className={dlg.paginationInfo}>
        Показано {from}–{to} из {total}
      </span>
      <div className={dlg.paginationControls}>
        <button
          type="button"
          className={`${dlg.pageArrow} ${dlg.pageArrowPrev}`}
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Предыдущая страница"
        >
          <img src={tagRight} alt="" />
        </button>
        {nums.map((n, i) =>
          n === "..." ? (
            <span key={`d${i}`} className={dlg.pageDots}>
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              className={`${dlg.pageBtn} ${n === page ? dlg.pageBtnActive : ""}`}
              onClick={() => onPage(n)}
            >
              {n}
            </button>
          )
        )}
        <button
          type="button"
          className={dlg.pageArrow}
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          aria-label="Следующая страница"
        >
          <img src={tagRight} alt="" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Главный компонент
// ============================================================

export interface DownloadDetailUIProps {
  batch: ImportBatchRead | null;
  progress: ImportAnalysisProgressResponse | null;
  state: DownloadScreenState;
  currentDialogLabel: string | null;
  dialogs: DialogListItem[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  runLoading: boolean;
  onBack: () => void;
  onDashboard: () => void;
  onDialogs: () => void;
  onRun: () => void;
  onReanalyze: (ids: number[]) => void;
  onRowClick: (id: number) => void;
  onPage: (p: number) => void;
}

export const DownloadDetailUI = ({
  batch,
  progress,
  state,
  currentDialogLabel,
  dialogs,
  total,
  page,
  pageSize,
  pages,
  runLoading,
  onBack,
  onDashboard,
  onDialogs,
  onRun,
  onReanalyze,
  onRowClick,
  onPage,
}: DownloadDetailUIProps) => {
  // Локальный выбор строк (визуальный, как на странице «Диалоги»)
  const [selected, setSelected] = useState<number[]>([]);
  const allOnPage =
    dialogs.length > 0 && dialogs.every((d) => selected.includes(d.id));
  const toggle = (id: number) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  const toggleAll = () => {
    const pageIds = dialogs.map((d) => d.id);
    setSelected((s) =>
      allOnPage
        ? s.filter((id) => !pageIds.includes(id)) // снять выбор только с этой страницы
        : Array.from(new Set([...s, ...pageIds])) // добавить страницу к накопленному
    );
  };

  const showTable =
    state === "processing" ||
    state === "partially_completed" ||
    state === "completed" ||
    state === "completed_with_errors";
  const showProgress = showTable;
  const countersEmpty = state === "empty" || state === "analysis_failed";

  const cVal = (n: number | null | undefined): string =>
    countersEmpty || !progress || n == null ? "—" : String(n);

  const remaining =
    progress != null ? progress.pending_count + progress.processing_count : null;
  const percent = progress?.progress_percent ?? 0;

  // В состоянии «завершено с ошибками» поднимаем строки с ошибкой наверх.
  // Сортировка в пределах текущей страницы: глобальной errors-first на бэке нет.
  const rows =
    state === "completed_with_errors"
      ? [...dialogs].sort(
          (a, b) =>
            Number(b.analysis_status === "error") -
            Number(a.analysis_status === "error")
        )
      : dialogs;

  // FAB по состоянию
  let fab: { label: string; onClick: () => void; disabled?: boolean } | null =
    null;
  if (state === "pending" || state === "analysis_failed") {
    fab = { label: "Запустить AI-анализ", onClick: onRun };
  } else if (state === "processing") {
    fab = { label: "Анализ выполняется", onClick: () => {}, disabled: true };
  } else if (state === "partially_completed") {
    fab = { label: "Продолжить AI-анализ", onClick: onRun };
  } else if (state === "completed") {
    fab = { label: "Перейти к дашборду", onClick: onDashboard };
  } else if (state === "completed_with_errors") {
    fab = { label: "Повторить анализ для ошибок", onClick: onRun };
  }

  // Если выбраны диалоги — повторно анализируем именно их
  if (selected.length > 0) {
    fab = {
      label: "Запустить анализ повторно",
      onClick: () => {
        onReanalyze(selected);
        setSelected([]);
      },
    };
  }

  return (
    <div className={`${styles.page} customScroll`}>
      {/* Шапка */}
      <header className={styles.header}>
        <button type="button" className={styles.backLink} onClick={onBack}>
          <ArrowLeft size={18} />К списку загрузок
        </button>
        <div className={styles.navGroup}>
          {state !== "completed" && (
            <button type="button" className={styles.navLink} onClick={onDashboard}>
              Перейти к дашборду
              <ChevronRight size={16} />
            </button>
          )}
          <button type="button" className={styles.navLink} onClick={onDialogs}>
            К списку диалогов
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      {/* Заголовок + счётчики */}
      <div className={styles.topRow}>
        <div className={styles.titleBlock}>
          <h1
            className={styles.h1}
            title={batch?.original_filename ?? "Без названия"}
          >
            {batch?.original_filename ?? "Без названия"}
          </h1>
          <div className={styles.meta}>
            <span>
              Диалога:{" "}
              <b>{batch?.dialogs_count ? batch.dialogs_count : "—"}</b>
            </span>
            <span>
              Дата: <b>{batch?.created_at ? formatDate(batch.created_at) : "—"}</b>
            </span>
          </div>
          <div className={styles.meta}>
            <span>
              Статус: <b>{STATUS_LINE[state]}</b>
            </span>
          </div>
        </div>

        <div className={styles.counters}>
          <div className={styles.counter}>
            <span className={styles.counterValue}>
              {cVal(progress?.processed_count)}
              {!countersEmpty && progress && (
                <span className={styles.counterMax}> / {progress.dialogs_count}</span>
              )}
            </span>
            <span className={styles.counterLabel}>Обработано</span>
          </div>
          <div className={styles.counter}>
            <span className={styles.counterValue}>{cVal(progress?.done_count)}</span>
            <span className={styles.counterLabel}>Успешно</span>
          </div>
          <div className={styles.counter}>
            <span className={`${styles.counterValue} ${styles.counterError}`}>
              {cVal(progress?.error_count)}
            </span>
            <span className={`${styles.counterLabel} ${styles.counterError}`}>
              Ошибок
            </span>
          </div>
          <div className={styles.counter}>
            <span className={styles.counterValue}>{cVal(remaining)}</span>
            <span className={styles.counterLabel}>Осталось</span>
          </div>
        </div>
      </div>

      {/* Прогресс */}
      {showProgress && (
        <div className={styles.progressSection}>
          <div className={styles.progressRow}>
            <span className={styles.progressPercent}>
              {percent}
              <span>%</span>
            </span>
            <div className={styles.progressBarWrap}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
          {currentDialogLabel && (
            <div className={styles.progressCurrent}>
              Анализируется: <b>{currentDialogLabel}</b>
            </div>
          )}
        </div>
      )}

      {/* Таблица / состояние */}
      {showTable ? (
        <div className={`${dlg.tableWrapper} ${styles.tableFixed}`}>
          <table className={dlg.table}>
            <thead>
              <tr>
                <th className={dlg.thCheck}>
                  <input
                    type="checkbox"
                    className={dlg.checkbox}
                    checked={allOnPage}
                    onChange={toggleAll}
                  />
                </th>
                <th>ID</th>
                <th>Менеджер</th>
                <th>Итог</th>
                <th>Оценка</th>
                <th>Дата</th>
                <th>Канал</th>
                <th className={dlg.tdStatus}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const isSelected = selected.includes(item.id);
                return (
                  <tr
                    key={item.id}
                    className={`${dlg.row} ${isSelected ? dlg.rowSelected : ""}`}
                    onClick={() => onRowClick(item.id)}
                  >
                    <td
                      className={dlg.tdCheck}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className={dlg.checkbox}
                        checked={isSelected}
                        onChange={() => toggle(item.id)}
                      />
                    </td>
                    <td className={dlg.tdId}>
                      {item.external_dialog_id ?? item.id}
                    </td>
                    <td className={dlg.tdManager}>{item.manager?.name ?? "—"}</td>
                    {item.analysis_status === "error" ? (
                      // Строка с ошибкой: «Итог» и «Оценка» объединяются
                      <td colSpan={2}>
                        <span
                          className={`${dlg.badge} ${dlg.badgeError} ${styles.errorBadge}`}
                          title={item.analysis?.error_message ?? "Ошибка анализа"}
                        >
                          {item.analysis?.error_message ?? "Ошибка анализа"}
                        </span>
                      </td>
                    ) : (
                      <>
                        <td>
                          <OutcomeCell item={item} />
                        </td>
                        <td>
                          <ScoreCell item={item} />
                        </td>
                      </>
                    )}
                    <td className={dlg.tdDate}>
                      {item.started_at
                        ? formatDate(item.started_at)
                        : formatDate(item.created_at)}
                    </td>
                    <td className={dlg.tdChannel}>
                      {item.channel ? formatChannel(item.channel) : "—"}
                    </td>
                    <td className={dlg.tdStatus}>
                      <div className={dlg.statusCell}>
                        <StatusIcon item={item} />
                        <span className={dlg.rowArrow}>
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
        </div>
      ) : state === "empty" ? (
        <div className={styles.centerState}>
          <span className={styles.centerTitle}>
            В этой загрузке нет диалогов для анализа
          </span>
        </div>
      ) : state === "analysis_failed" ? (
        <div className={styles.centerState}>
          <span className={`${styles.centerTitle} ${styles.centerTitleError}`}>
            Не удалось запустить AI-анализ
          </span>
        </div>
      ) : (
        /* pending */
        <div className={styles.centerState}>
          <span className={styles.centerTitle}>
            Эта загрузка ещё не проанализирована
          </span>
          <span className={styles.centerText}>
            Запустите AI-анализ, чтобы получить итоги по диалогам
          </span>
        </div>
      )}

      {/* FAB */}
      {fab && (
        <button
          type="button"
          className={styles.fab}
          onClick={fab.onClick}
          disabled={fab.disabled || (fab.onClick === onRun && runLoading)}
        >
          {fab.onClick === onRun && runLoading && (
            <Loader2 size={18} className={styles.spin} />
          )}
          {fab.label}
        </button>
      )}
    </div>
  );
};
