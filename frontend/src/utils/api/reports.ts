import { request, buildUrl, type QueryParams } from "./request";
import { getCookie } from "../cookie";
import type {
  ReportResponse,
  GenerateReportRequest,
  ExportReportQuery,
  ManagerReportQuery,
  ManagerReportResponse,
} from "../types/reports.types";

export const generateReportAPI = (
  data: GenerateReportRequest
): Promise<ReportResponse> =>
  request<ReportResponse>("/reports/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });

// Отчёт для руководителя — агрегирует уже проанализированные диалоги (без AI).
export const getManagerReportAPI = (
  query?: ManagerReportQuery
): Promise<ManagerReportResponse> =>
  request<ManagerReportResponse>(
    "/reports/manager",
    { method: "GET" },
    query as QueryParams
  );

// Экспорт отчёта — скачивание blob.
export const exportReportAPI = (query: ExportReportQuery): Promise<Blob> => {
  const url = buildUrl("/reports/export", { ...query } as QueryParams);
  return fetch(url, {
    headers: { Authorization: `Bearer ${getCookie("accessToken")}` },
  }).then((res) => res.blob());
};
