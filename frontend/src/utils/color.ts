// Единый источник цвета по средней оценке качества диалога (0–100).
// Используется для колец, KPI-метрик, столбцов динамики и оценок менеджеров.
// Пороги: 80–100 — высокий, 50–79 — средний, 0–49 — низкий; null/undefined — серый.
//
// Значения — реальные hex (а не var(--…)), т.к. цвет подставляется и в CSS,
// и в SVG-атрибут stroke, где var() не резолвится. low совпадает с --color-error.
export const SCORE_COLOR = {
  high: "#7cc643",
  mid: "#f09413",
  low: "#ff4b4b",
  none: "#9b9ba3",
} as const;

export const getScoreColor = (score: number | null | undefined): string =>
  score == null
    ? SCORE_COLOR.none
    : score >= 80
      ? SCORE_COLOR.high
      : score >= 50
        ? SCORE_COLOR.mid
        : SCORE_COLOR.low;
