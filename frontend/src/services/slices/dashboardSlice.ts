import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  DashboardSummaryQuery,
  DashboardSummaryResponse,
} from "../../utils/types/dashboard.types";
import type { ApiError, ApiErrorDetail } from "../../utils/types/common.types";
import { getDashboardSummaryAPI } from "../../utils/dialog-pulse-api";

type TDashboardState = {
  summary: DashboardSummaryResponse | null;
  summaryRequest: boolean;
  summaryError: ApiErrorDetail | null;
  // Глобальные фильтры дашборда (период / менеджер / канал / импорт)
  filters: DashboardSummaryQuery;
};

const initialState: TDashboardState = {
  summary: null,
  summaryRequest: false,
  summaryError: null,
  filters: {},
};

export const fetchDashboardSummary = createAsyncThunk(
  "dashboard/fetchSummary",
  async (query: DashboardSummaryQuery | undefined, { rejectWithValue }) => {
    try {
      return await getDashboardSummaryAPI(query);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setDashboardFilters(state, action: PayloadAction<DashboardSummaryQuery>) {
      state.filters = action.payload;
    },
  },
  selectors: {
    dashboardSelector: (state) => state,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.summaryRequest = true;
        state.summaryError = null;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.summaryRequest = false;
        state.summaryError = (action.payload as ApiError).detail;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.summaryRequest = false;
        state.summary = action.payload;
      });
  },
});

export const { setDashboardFilters } = dashboardSlice.actions;
export const { dashboardSelector } = dashboardSlice.selectors;
