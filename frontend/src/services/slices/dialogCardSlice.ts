import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  DialogDetail,
  DialogNavigationResponse,
  DialogsListQuery,
} from "../../utils/types/dialogs.types";
import type { ApiError, ApiErrorDetail } from "../../utils/types/common.types";
import {
  getDialogDetailAPI,
  getDialogNavigationAPI,
  runDialogAnalysisAPI,
} from "../../utils/dialog-pulse-api";

type TDialogCardState = {
  detail: DialogDetail | null;
  detailRequest: boolean;
  detailError: ApiErrorDetail | null;

  navigation: DialogNavigationResponse | null;

  runRequest: boolean;
  runError: ApiErrorDetail | null;
};

const initialState: TDialogCardState = {
  detail: null,
  detailRequest: false,
  detailError: null,
  navigation: null,
  runRequest: false,
  runError: null,
};

// GET /dialogs/{id} — карточка диалога
export const fetchDialogDetail = createAsyncThunk(
  "dialogCard/fetchDetail",
  async (dialog_id: number, { rejectWithValue }) => {
    try {
      return await getDialogDetailAPI(dialog_id);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// GET /dialogs/{id}/navigation — предыдущий/следующий в текущей выборке.
// query — те же фильтры/поиск/сортировка, что и в списке.
export const fetchDialogNavigation = createAsyncThunk(
  "dialogCard/fetchNavigation",
  async (
    { dialog_id, query }: { dialog_id: number; query?: DialogsListQuery },
    { rejectWithValue }
  ) => {
    try {
      return await getDialogNavigationAPI(dialog_id, query);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// POST /analysis/dialogs/{id}/run — запуск/повтор анализа.
// Реальный результат подтянет перезапрос карточки (polling/эффект в контейнере).
export const runDialogCardAnalysis = createAsyncThunk(
  "dialogCard/runAnalysis",
  async (dialog_id: number, { rejectWithValue }) => {
    try {
      return await runDialogAnalysisAPI(dialog_id);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const dialogCardSlice = createSlice({
  name: "dialogCard",
  initialState,
  reducers: {
    // Сброс при уходе со страницы / смене карточки, чтобы не мелькали старые данные
    clearDialogCard: () => initialState,
  },
  selectors: {
    dialogCardSelector: (state) => state,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDialogDetail.pending, (state) => {
        state.detailRequest = true;
        state.detailError = null;
      })
      .addCase(fetchDialogDetail.rejected, (state, action) => {
        state.detailRequest = false;
        state.detailError = (action.payload as ApiError).detail;
      })
      .addCase(fetchDialogDetail.fulfilled, (state, action) => {
        state.detailRequest = false;
        state.detail = action.payload;
      })

      .addCase(fetchDialogNavigation.fulfilled, (state, action) => {
        state.navigation = action.payload;
      })
      .addCase(fetchDialogNavigation.rejected, (state) => {
        state.navigation = null;
      })

      .addCase(runDialogCardAnalysis.pending, (state) => {
        state.runRequest = true;
        state.runError = null;
        // Оптимистично переводим карточку в "processing": сразу показываем
        // состояние анализа и запускаем polling в контейнере.
        if (state.detail) state.detail.analysis_status = "processing";
      })
      .addCase(runDialogCardAnalysis.rejected, (state, action) => {
        state.runRequest = false;
        state.runError = (action.payload as ApiError).detail;
      })
      .addCase(runDialogCardAnalysis.fulfilled, (state) => {
        state.runRequest = false;
      });
  },
});

export const { clearDialogCard } = dialogCardSlice.actions;
export const { dialogCardSelector } = dialogCardSlice.selectors;
