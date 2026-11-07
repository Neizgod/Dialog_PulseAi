import { request, type QueryParams } from "./request";
import type {
  DashboardSummaryQuery,
  DashboardSummaryResponse,
  DashboardManagersQuery,
  DashboardManagersResponse,
  DashboardOptionsResponse,
} from "../types/dashboard.types";

export const getDashboardOptionsAPI = (): Promise<DashboardOptionsResponse> =>
  request<DashboardOptionsResponse>("/dashboard/options", { method: "GET" });

export const getDashboardSummaryAPI = (
  query?: DashboardSummaryQuery
): Promise<DashboardSummaryResponse> =>
  request<DashboardSummaryResponse>(
    "/dashboard/summary",
    { method: "GET" },
    query as QueryParams
  );

export const getDashboardManagersAPI = (
  query?: DashboardManagersQuery
): Promise<DashboardManagersResponse> =>
  request<DashboardManagersResponse>(
    "/dashboard/managers",
    { method: "GET" },
    query as QueryParams
  );
