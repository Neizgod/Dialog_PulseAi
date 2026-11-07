import { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CsvPreviewUI } from "../ui/CsvPreviewUI/csvPreviewUI";
import { useAppSelector } from "../../services/store";
import { importSliceSelector } from "../../services/slices/importSlice";
import type { ColumnInfo } from "../../utils/types/imports.types";
import { formatChannel, formatMessage } from "../../utils/utils";

const PREVIEW_ROWS_LIMIT = 10;

// Фиксированные колонки макета и канонические поля бэкенда (suggested_field).
// Ключи должны совпадать с suggested_field из ответа /imports/preview
// (manager_name / sender_name), иначе колонка останется пустой.
const PREVIEW_COLUMNS: { label: string; field: string }[] = [
  { label: "ID", field: "dialog_id" },
  { label: "Дата", field: "sent_at" },
  { label: "Канал", field: "channel" },
  { label: "Менеджер", field: "manager_name" },
  { label: "Автор", field: "sender_name" },
  { label: "Сообщение", field: "message" },
];

export const CsvPreview = () => {
  const navigate = useNavigate();
  const { dialogsImportPreview } = useAppSelector(importSliceSelector);

  const rows = useMemo(() => {
    if (!dialogsImportPreview) return [];

    const fieldToColumn = new Map<string, string>();

    dialogsImportPreview.columns.forEach((column: ColumnInfo) => {
      if (
        column.suggested_field &&
        !fieldToColumn.has(column.suggested_field)
      ) {
        fieldToColumn.set(column.suggested_field, column.name);
      }
    });

    return dialogsImportPreview.preview_rows
      .slice(0, PREVIEW_ROWS_LIMIT)
      .map((row) => ({
        number: row.row_number,
        cells: PREVIEW_COLUMNS.map(({ field }) => {
          const columnName = fieldToColumn.get(field);
          const value = columnName ? row.values[columnName] : "";

          if (field === "sent_at" && typeof value === "string") {
            return value.slice(0, 10);
          }

          if (field === "channel" && typeof value === "string") {
            return formatChannel(value);
          }

          if (field === "message" && typeof value === "string") {
            return formatMessage(value);
          }

          return String(value ?? "");
        }),
      }));
  }, [dialogsImportPreview]);

  if (!dialogsImportPreview) {
    return <Navigate to="/import/csv" replace />;
  }

  return (
    <CsvPreviewUI
      fileName={dialogsImportPreview.original_filename}
      rowsCount={dialogsImportPreview.rows_count}
      columnsCount={dialogsImportPreview.columns.length}
      headers={PREVIEW_COLUMNS.map((column) => column.label)}
      rows={rows}
      redaction={dialogsImportPreview.redaction ?? null}
      onBack={() => navigate("/import/csv")}
      onNext={() => navigate("/import/csv/mapping")}
    />
  );
};
