import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  DialogPreset,
  DialogSortBy,
  DialogsListQuery,
  DialogsListResponse,
  DialogsSummaryResponse,
  SortOrder,
} from "../../utils/types/dialogs.types";
import type { ApiError, ApiErrorDetail } from "../../utils/types/common.types";
import type { BatchRunAnalysisRequest, BatchRunAnalysisResponse } from "../../utils/types/analysis.types";
import type {
  ManagerOption,
  ManagersOptionsQuery,
} from "../../utils/types/managers-feedback.types";
import {
  getDialogsListAPI,
  getDialogsSummaryAPI,
  batchRunAnalysisAPI,
  getManagersOptionsAPI,
} from "../../utils/dialog-pulse-api";

type TDialogsState = {
  summary: DialogsSummaryResponse | null;
  summaryRequest: boolean;
  summaryError: ApiErrorDetail | null;

  list: DialogsListResponse | null;
  listRequest: boolean;
  listError: ApiErrorDetail | null;

  filters: DialogsListQuery;
  preset: DialogPreset | null;
  page: number;
  // Сортировка — только для списка (в summary не передаётся)
  sortBy: DialogSortBy;
  sortOrder: SortOrder;

  selectedIds: number[];
  batchRequest: boolean;
  batchError: ApiErrorDetail | null;

  // Список менеджеров для фильтра (из /managers/options)
  managers: ManagerOption[];
};

const initialState: TDialogsState = {
  summary: null,
  summaryRequest: false,
  summaryError: null,

  list: null,
  listRequest: false,
  listError: null,

  filters: {},
  preset: null,
  page: 1,
  sortBy: "created_at",
  sortOrder: "desc",

  selectedIds: [],
  batchRequest: false,
  batchError: null,

  managers: [],
};

export const fetchDialogsSummary = createAsyncThunk(
  "dialogs/fetchSummary",
  async (query: DialogsListQuery | undefined, { rejectWithValue }) => {
    try {
      return await getDialogsSummaryAPI(query);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchDialogsList = createAsyncThunk(
  "dialogs/fetchList",
  async (query: DialogsListQuery | undefined, { rejectWithValue }) => {
    try {
      return await getDialogsListAPI(query);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const runBatchAnalysis = createAsyncThunk(
  "dialogs/runBatchAnalysis",
  async (payload: BatchRunAnalysisRequest, { rejectWithValue }) => {
    try {
      return await batchRunAnalysisAPI(payload);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Список менеджеров для фильтра. Передаём текущий срез (channel/import_id/
// период), чтобы список соответствовал выбранным фильтрам.
export const fetchManagers = createAsyncThunk(
  "dialogs/fetchManagers",
  async (query: ManagersOptionsQuery | undefined, { rejectWithValue }) => {
    try {
      return await getManagersOptionsAPI(query);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Оставляем старый thunk для обратной совместимости
export const getDialogList = createAsyncThunk(
  "dialogs/getDialogList",
  async (query: DialogsListQuery | undefined, { rejectWithValue }) => {
    try {
      return await getDialogsListAPI(query);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const dialogsSlice = createSlice({
  name: "dialogs",
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<DialogsListQuery>) {
      state.filters = action.payload;
      state.page = 1;
    },
    setPreset(state, action: PayloadAction<DialogPreset | null>) {
      state.preset = action.payload;
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setSort(
      state,
      action: PayloadAction<{ sortBy: DialogSortBy; sortOrder: SortOrder }>
    ) {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
      state.page = 1;
    },
    toggleSelect(state, action: PayloadAction<number>) {
      const id = action.payload;
      if (state.selectedIds.includes(id)) {
        state.selectedIds = state.selectedIds.filter((x) => x !== id);
      } else {
        state.selectedIds.push(id);
      }
    },
    selectAllOnPage(state, action: PayloadAction<number[]>) {
      state.selectedIds = action.payload;
    },
    clearSelection(state) {
      state.selectedIds = [];
    },
  },
  selectors: {
    dialogsSliceSelector: (state) => state,
  },
  extraReducers: (builder) => {
    // summary
    builder
      .addCase(fetchDialogsSummary.pending, (state) => {
        state.summaryRequest = true;
        state.summaryError = null;
      })
      .addCase(fetchDialogsSummary.rejected, (state, action) => {
        state.summaryRequest = false;
        state.summaryError = (action.payload as ApiError).detail;
      })
      .addCase(fetchDialogsSummary.fulfilled, (state, action) => {
        state.summaryRequest = false;
        state.summary = action.payload;
      });

    // list
    builder
      .addCase(fetchDialogsList.pending, (state) => {
        state.listRequest = true;
        state.listError = null;
      })
      .addCase(fetchDialogsList.rejected, (state, action) => {
        state.listRequest = false;
        state.listError = (action.payload as ApiError).detail;
      })
      .addCase(fetchDialogsList.fulfilled, (state, action) => {
        state.listRequest = false;
        state.list = action.payload;
      });

    // batch analysis
    builder
      .addCase(runBatchAnalysis.pending, (state) => {
        state.batchRequest = true;
        state.batchError = null;
      })
      .addCase(runBatchAnalysis.rejected, (state, action) => {
        state.batchRequest = false;
        state.batchError = (action.payload as ApiError).detail;
      })
      .addCase(runBatchAnalysis.fulfilled, (state, action) => {
        state.batchRequest = false;
        state.selectedIds = [];
        // Оптимистично помечаем отправленные диалоги как "processing", чтобы UI
        // сразу показал новый прогон (в т.ч. повторный по уже done) и запустился
        // polling. Реальный статус подтвердит сервер при ближайшем рефетче.
        const ids = new Set(action.meta.arg.dialog_ids);
        state.list?.items.forEach((item) => {
          if (ids.has(item.id)) {
            item.analysis_status = "processing";
          }
        });
      });

    // менеджеры (для фильтра)
    builder.addCase(fetchManagers.fulfilled, (state, action) => {
      state.managers = action.payload.items;
    });

    // обратная совместимость
    builder
      .addCase(getDialogList.pending, (state) => {
        state.listRequest = true;
        state.listError = null;
      })
      .addCase(getDialogList.rejected, (state, action) => {
        state.listRequest = false;
        state.listError = (action.payload as ApiError).detail;
      })
      .addCase(getDialogList.fulfilled, (state, action) => {
        state.listRequest = false;
        state.list = action.payload;
      });
  },
});

export const {
  setFilters,
  setPreset,
  setPage,
  setSort,
  toggleSelect,
  selectAllOnPage,
  clearSelection,
} = dialogsSlice.actions;

export type { ManagerOption };

export const { dialogsSliceSelector } = dialogsSlice.selectors;

// Тип для batch-response, чтобы можно было использовать в компонентах
export type { BatchRunAnalysisResponse };