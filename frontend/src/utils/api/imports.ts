import { request, buildUrl, type QueryParams } from "./request";
import { getCookie } from "../cookie";
import type { ApiError } from "../types/common.types";
import type { DeleteImportResponse } from "../types/dialogs.types";
import type { TemplateSourceType } from "../types/ai-settings.types";
import type {
  ConfirmImportRequest,
  ConfirmImportResponse,
  ImportBatchRead,
  ImportBatchListResponse,
  ImportBatchListQuery,
  ImportPreviewResponse,
  ManualDialogRequest,
  ManualDialogResponse,
  RoleValuesRequest,
  RoleValuesResponse,
  ValidateMappingRequest,
  ValidateMappingResponse,
  TxtRolesValuesResponse,
  TxtSettingsValidateRequest,
  TxtSettingsValidateResponse,
  ImportChannelsResponse,
  ImportSourceType,
  ImportOptionsResponse,
  AudioPreviewResponse,
  MappingFieldsResponse,
} from "../types/imports.types";

// Imports API отвечает за загрузку данных, предпросмотр, сопоставление колонок,
// подтверждение импорта и создание диалогов.

export const importPreviewAPI = (
  formData: FormData
): Promise<ImportPreviewResponse> =>
  request<ImportPreviewResponse>("/imports/preview", {
    method: "POST",
    body: formData,
  });

// Список каналов импорта + default_channel (по типу файла)
export const getImportChannelsAPI = (
  source_type: ImportSourceType
): Promise<ImportChannelsResponse> =>
  request<ImportChannelsResponse>(
    `/imports/channels?source_type=${source_type}`,
    { method: "GET" }
  );

// Полный список системных полей для сопоставления колонок (включая sender_role).
// Источник истины для дропдауна «Поле в системе» на экране маппинга CSV.
export const getMappingFieldsAPI = (): Promise<MappingFieldsResponse> =>
  request<MappingFieldsResponse>("/imports/mapping-fields", { method: "GET" });

// Справочники для фильтров списка загрузок.
export const getImportOptionsAPI = (): Promise<ImportOptionsResponse> =>
  request<ImportOptionsResponse>("/imports/options", { method: "GET" });

// Предпросмотр аудио (когда GET /imports/{id} вернул status = preview_ready)
export const getAudioPreviewAPI = (
  import_id: number
): Promise<AudioPreviewResponse> =>
  request<AudioPreviewResponse>(`/imports/${import_id}/preview`, {
    method: "GET",
  });

// CSV: проверка и сохранение маппинга колонок + ролей (общий settings/validate)
export const validateMappingAPI = (
  import_id: number,
  data: ValidateMappingRequest
): Promise<ValidateMappingResponse> =>
  request<ValidateMappingResponse>(`/imports/${import_id}/settings/validate`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json;charset=utf-8" },
  });

// TXT/Markdown: сохранение/проверка ролей авторов (общий settings/validate)
export const validateTxtSettingsAPI = (
  import_id: number,
  data: TxtSettingsValidateRequest
): Promise<TxtSettingsValidateResponse> =>
  request<TxtSettingsValidateResponse>(
    `/imports/${import_id}/settings/validate`,
    {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json;charset=utf-8" },
    }
  );

// Экран «Роли»: получить значения / отправителей из выбранной колонки.
// Ничего не сохраняет — нужен только для построения таблицы/чеклиста сопоставления.
// CSV: значения/отправители из выбранной колонки (общий roles/values)
export const roleValuesAPI = (
  import_id: number,
  data: RoleValuesRequest
): Promise<RoleValuesResponse> =>
  request<RoleValuesResponse>(`/imports/${import_id}/roles/values`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json;charset=utf-8" },
  });

// TXT/Markdown: участники диалога для назначения ролей (body не нужен)
export const getTxtRolesValuesAPI = (
  import_id: number
): Promise<TxtRolesValuesResponse> =>
  request<TxtRolesValuesResponse>(`/imports/${import_id}/roles/values`, {
    method: "POST",
  });

export const confirmImportAPI = (
  import_id: number,
  run_analysis: ConfirmImportRequest
): Promise<ConfirmImportResponse> =>
  request<ConfirmImportResponse>(`/imports/${import_id}/confirm`, {
    method: "POST",
    body: JSON.stringify(run_analysis),
    headers: { "Content-Type": "application/json;charset=utf-8" },
  });

export const getImports = (
  query?: ImportBatchListQuery
): Promise<ImportBatchListResponse> =>
  request<ImportBatchListResponse>(
    "/imports",
    { method: "GET" },
    query as QueryParams
  );

export const getImportLoadDetailsAPI = (
  import_id: number
): Promise<ImportBatchRead> =>
  request<ImportBatchRead>(`/imports/${import_id}`, { method: "GET" });

export const deleteImportAPI = (
  import_id: number
): Promise<DeleteImportResponse> =>
  request<DeleteImportResponse>(`/imports/${import_id}`, {
    method: "DELETE",
  });

// Manual Dialog
export const postManualDialogAPI = (
  dialog: ManualDialogRequest
): Promise<ManualDialogResponse> =>
  request<ManualDialogResponse>("/imports/manual-dialog", {
    method: "POST",
    body: JSON.stringify(dialog),
    headers: { "Content-Type": "application/json;charset=utf-8" },
  });

// Скачивание шаблона импорта (csv/txt/markdown) — инициирует скачивание файла
export const downloadImportTemplateAPI = async (
  source_type: TemplateSourceType
): Promise<void> => {
  const res = await fetch(buildUrl(`/imports/templates/${source_type}`), {
    headers: { Authorization: `Bearer ${getCookie("accessToken")}` },
  });
  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({
      detail: { code: "unknown", message: res.statusText },
    }));
    throw error;
  }

  const blob = await res.blob();
  // Имя файла: из Content-Disposition, иначе — дефолтное по типу
  const fallback: Record<TemplateSourceType, string> = {
    csv: "dialogpulse_import_template.csv",
    txt: "dialogpulse_import_template.txt",
    markdown: "dialogpulse_import_template.md",
  };
  let filename = fallback[source_type];
  const disposition = res.headers.get("Content-Disposition");
  if (disposition) {
    const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    if (match?.[1]) filename = decodeURIComponent(match[1]);
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
