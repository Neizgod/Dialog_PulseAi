export const formatChannel = (value: string) => {
  switch (value.toLowerCase()) {
    case "telegram":
      return "Telegram";

    case "vk":
      return "ВКонтакте";

    case "whatsapp":
      return "WhatsApp";

    default:
      return value;
  }
};

export const formatSender = (value: string) => {
  switch (value.toLowerCase()) {
    case "manager":
      return "Менеджер";

    case "client":
      return "Клиент";

    default:
      return value;
  }
};

export const formatMessage = (value: string) => {
  return value.replace(/^"(.*)"$/, "$1");
};

export const formatFileSize = (bytes: number) => {
  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(0)} КБ`;
  }

  return `${(kb / 1024).toFixed(2)} МБ`;
};

// Форматирует ISO-дату в «YYYY.MM.DD»
// Дата в формате ДД.ММ.ГГГГ
export const formatDate = (isoString: string): string => {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}.${m}.${y}`;
};

// Форматирует оценку: число → «85%», null → «—»
export const formatScore = (score: number | null | undefined): string => {
  if (score == null) return "—";
  return `${score}%`;
};

// Словарь лейблов и CSS-классов для outcome
export type OutcomeConfig = { label: string; variant: "success" | "error" | "warning" | "neutral" | "info" | "lime" };

export const OUTCOME_CONFIG: Record<string, OutcomeConfig> = {
  success:      { label: "Успешный",    variant: "success" },
  lost:         { label: "Потерян",     variant: "error"   },
  pending:      { label: "Зависший",    variant: "info"    },
  complaint:    { label: "Жалоба",      variant: "error"   },
  consultation: { label: "Консультация",variant: "lime"    },
  unknown:      { label: "—",           variant: "neutral" },
};

export const getOutcomeConfig = (outcome: string | undefined): OutcomeConfig =>
  OUTCOME_CONFIG[outcome ?? ""] ?? { label: "—", variant: "neutral" };

// Цвет/вариант для температуры клиента. Подпись (client_temperature_label)
// приходит с backend; здесь нужен только вариант для окраски (по макету
// «Тёплый» — зелёный). label оставлен как fallback, если backend не отдал.
export const TEMPERATURE_CONFIG: Record<string, OutcomeConfig> = {
  hot:     { label: "Горячий",  variant: "error"   },
  warm:    { label: "Тёплый",   variant: "lime"    },
  cold:    { label: "Холодный", variant: "info"    },
  unknown: { label: "—",        variant: "neutral" },
};

export const getTemperatureConfig = (
  temperature: string | undefined
): OutcomeConfig =>
  TEMPERATURE_CONFIG[temperature ?? ""] ?? { label: "—", variant: "neutral" };

// Словарь лейблов для preset-вкладок
export const PRESET_LABELS: Record<string, string> = {
  problematic:     "Проблемные диалоги",
  lost:            "Потерянные лиды",
  low_score:       "Низкая оценка",
  analysis_errors: "Ошибки анализа",
  not_analyzed:    "Без следующего шага",
};

// Словарь лейблов для analysis_status
export const ANALYSIS_STATUS_LABELS: Record<string, string> = {
  pending:    "Ожидает",
  processing: "Анализируется",
  done:       "Готово",
  error:      "Ошибка",
};

// Словарь лейблов для outcome в фильтре
export const OUTCOME_LABELS: Record<string, string> = {
  success:      "Успешный",
  lost:         "Потерян",
  pending:      "Зависший",
  complaint:    "Жалоба",
  consultation: "Консультация",
  unknown:      "Неизвестно",
};

// ============================================================
// Словари технических ключей → человекочитаемые названия
// (objections / manager_errors / risk_flags приходят с бэкенда ключами)
// ============================================================

export const OBJECTION_LABELS: Record<string, string> = {
  price: "Цена",
  delivery: "Доставка",
  availability: "Наличие",
  trust: "Недоверие",
  timing: "Сроки",
  need_more_info: "Нужно больше информации",
  comparison: "Сравнивает с другими",
  decision_maker: "Нужно согласовать",
  no_need: "Нет явной потребности",
  other: "Другое",
};

export const MANAGER_ERROR_LABELS: Record<string, string> = {
  no_need_clarification: "Не уточнил потребность",
  no_objection_handling: "Не отработал возражение",
  slow_response: "Долго отвечал",
  no_next_step: "Не предложил следующий шаг",
  rude_tone: "Некорректный тон",
  incomplete_answer: "Неполный ответ",
  wrong_product_offer: "Предложил не то решение",
  ignored_client_question: "Проигнорировал вопрос клиента",
  other: "Другое",
};

export const RISK_FLAG_LABELS: Record<string, string> = {
  manager_response_delay_warning: "Менеджер ответил с задержкой",
  manager_response_delay_critical: "Критичная задержка ответа",
  no_manager_reply_after_client: "Клиент остался без ответа",
  missing_timestamps: "Нет времени у сообщений",
  dialog_ended_with_client_message: "Последним ответил клиент",
};

// Цвет бейджа для risk-флага (по рекомендациям спецификации)
export type RiskVariant = "warning" | "error" | "neutral";

export const RISK_FLAG_VARIANT: Record<string, RiskVariant> = {
  manager_response_delay_warning: "warning",
  manager_response_delay_critical: "error",
  no_manager_reply_after_client: "error",
  missing_timestamps: "neutral",
  dialog_ended_with_client_message: "warning",
};

// Хелперы: возвращают название по ключу, с fallback на сам ключ
export const getObjectionLabel = (key: string): string =>
  OBJECTION_LABELS[key] ?? key;

export const getManagerErrorLabel = (key: string): string =>
  MANAGER_ERROR_LABELS[key] ?? key;

export const getRiskFlagLabel = (key: string): string =>
  RISK_FLAG_LABELS[key] ?? key;

export const getRiskFlagVariant = (key: string): RiskVariant =>
  RISK_FLAG_VARIANT[key] ?? "neutral";