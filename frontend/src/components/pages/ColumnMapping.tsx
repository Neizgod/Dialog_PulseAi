import { useState, useEffect, useMemo, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  importSliceSelector,
  setColumnMapping,
  setColumnSelection,
} from "../../services/slices/importSlice";
import { formatChannel, formatMessage, formatSender } from "../../utils/utils";
import { ColumnMappingTableUI } from "../ui/ColumnMappingUI/ColumnMappingTableUI";
import { useAppDispatch, useAppSelector } from "../../services/store";
import { getMappingFieldsAPI } from "../../utils/dialog-pulse-api";

const NO_IMPORT = "Не импортировать";

// Русские подписи технических полей. Используются как fallback, если бэкенд в
// /imports/mapping-fields не прислал label. Источник истины для НАБОРА полей —
// бэкенд; здесь только человекочитаемые названия (уже с sender_role).
const FIELD_LABELS: Record<string, string> = {
  dialog_id: "ID диалога",
  sent_at: "Дата / время сообщения",
  channel: "Канал общения",
  message: "Текст сообщения",
  sender_name: "Имя автора сообщения",
  sender_external_id: "ID автора сообщения",
  sender_role: "Роль отправителя",
  direction: "Направление сообщения",
  manager_name: "Имя менеджера",
  manager_external_id: "ID менеджера",
  client_external_id: "ID клиента",
};

// Набор/порядок полей до ответа /imports/mapping-fields (и при его недоступности).
// Уже включает sender_role, которого раньше не было в списке.
const FALLBACK_FIELDS = [
  "dialog_id",
  "sent_at",
  "channel",
  "message",
  "sender_name",
  "sender_external_id",
  "sender_role",
  "direction",
  "manager_name",
  "manager_external_id",
  "client_external_id",
];

const formatSampleValue = (
  suggestedField: string | null,
  value: string
): string => {
  if (!value || value === "—") return "—";
  switch (suggestedField) {
    case "channel":
      return formatChannel(value);
    case "sender":
      return formatSender(value);
    case "message":
      return formatMessage(value);
    case "sent_at":
      return value.slice(0, 10);
    default:
      return value;
  }
};

export const ColumnMapping = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { dialogsImportPreview, columnSelection } =
    useAppSelector(importSliceSelector);
  const columns = dialogsImportPreview?.columns ?? [];

  // Набор системных полей и их подписи. Источник истины — бэкенд
  // (GET /imports/mapping-fields); до ответа и при ошибке — fallback-список.
  const [fields, setFields] = useState<string[]>(FALLBACK_FIELDS);
  const [labelByField, setLabelByField] =
    useState<Record<string, string>>(FIELD_LABELS);

  useEffect(() => {
    let cancelled = false;
    getMappingFieldsAPI()
      .then((res) => {
        const list = res?.fields ?? [];
        if (cancelled || list.length === 0) return;
        setFields(list.map((f) => f.value));
        setLabelByField((prev) => {
          const next = { ...prev };
          list.forEach((f) => {
            next[f.value] = f.label ?? prev[f.value] ?? f.value;
          });
          return next;
        });
      })
      .catch(() => {
        // Эндпоинт недоступен — остаёмся на fallback (он уже включает sender_role)
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const labelOf = useCallback(
    (field: string) => labelByField[field] ?? field,
    [labelByField]
  );

  // Подписи для дропдауна: «Не импортировать» + все поля из бэкенда
  const systemFields = useMemo(
    () => [NO_IMPORT, ...fields.map(labelOf)],
    [fields, labelOf]
  );

  // Подпись → техническое имя поля (для сборки column_mapping)
  const labelToField = useMemo(() => {
    const m: Record<string, string> = {};
    fields.forEach((f) => {
      m[labelOf(f)] = f;
    });
    return m;
  }, [fields, labelOf]);

  // Выбор инициализируем из сохранённого в сторе (если возвращаемся на шаг),
  // иначе — из предложенного backend поля. Берём только текущие колонки, чтобы
  // выбор от другого файла не «протёк» в новый импорт.
  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    columns.forEach((col) => {
      initial[col.name] =
        columnSelection[col.name] ??
        (col.suggested_field
          ? (FIELD_LABELS[col.suggested_field] ?? NO_IMPORT)
          : NO_IMPORT);
    });
    return initial;
  });

  // Сохраняем выбор в стор, чтобы он пережил уход со страницы (как в «Роли»)
  useEffect(() => {
    dispatch(setColumnSelection(mapping));
  }, [dispatch, mapping]);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  if (!dialogsImportPreview) {
    return <Navigate to="/import/csv" replace />;
  }

  const handleToggleDropdown = (colName: string) => {
    setOpenDropdown((prev) => (prev === colName ? null : colName));
  };

  const handleSelect = (colName: string, field: string) => {
    setMapping((prev) => ({ ...prev, [colName]: field }));
    setOpenDropdown(null);
  };

  const handleNext = () => {
    const column_mapping: Record<string, string> = {};

    columns.forEach((col) => {
      const selectedLabel = mapping[col.name];
      const selectedField = labelToField[selectedLabel] ?? null;

      // Сохраняем всё кроме "Не импортировать"
      if (!selectedField) return;

      column_mapping[col.name] = selectedField;
    });

    dispatch(setColumnMapping(column_mapping));
    navigate("/import/csv/roles");
  };

  const formattedColumns = columns.map((col) => ({
    ...col,
    sampleValue: formatSampleValue(
      col.suggested_field,
      col.sample_values?.[0] ?? "—"
    ),
  }));

  return (
    <ColumnMappingTableUI
      columns={formattedColumns}
      mapping={mapping}
      openDropdown={openDropdown}
      systemFields={systemFields}
      onToggleDropdown={handleToggleDropdown}
      onSelect={handleSelect}
      onBack={() => navigate(-1)}
      onNext={handleNext}
    />
  );
};
