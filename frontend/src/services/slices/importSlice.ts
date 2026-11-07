import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type {
  ConfirmImportRequest,
  ImportPreviewResponse,
  RoleStrategy,
  RoleValuesRequest,
  ValidateMappingRequest,
  ValidateMappingResponse,
  RoleValuesResponse,
} from "../../utils/types/imports.types";
import {
  confirmImportAPI,
  importPreviewAPI,
  roleValuesAPI,
  validateMappingAPI,
} from "../../utils/dialog-pulse-api";
import type { ApiError, ApiErrorDetail } from "../../utils/types/common.types";

// Способ сравнения для режима manager_match
export type CompareBy = "id" | "name";

// Колонки, выбираемые на экране «Роли» (для разных режимов)
export type RoleColumnsState = {
  source_column: string | null; // mode 1, 2
  sender_name_column: string | null; // mode 3 (name), mode 4
  sender_external_id_column: string | null; // mode 3 (id), mode 4
  manager_name_column: string | null; // mode 3 (name)
  manager_external_id_column: string | null; // mode 3 (id)
};

type TImportState = {
  dialogsImportPreview: ImportPreviewResponse | null;
  importRequest: boolean;
  importError: ApiErrorDetail | null;

  // Сопоставление колонок (экран «Сопоставление колонок»)
  // columnMapping — итоговый формат для отправки: { имя колонки: системное поле }
  columnMapping: Record<string, string>;
  // columnSelection — выбор пользователя в UI: { имя колонки: подпись поля },
  // хранится в сторе, чтобы выбор не сбрасывался при возврате на шаг (как в «Роли»)
  columnSelection: Record<string, string>;

  // Экран «Роли»
  roleStrategy: RoleStrategy | null;
  roleColumns: RoleColumnsState;
  compareBy: CompareBy;
  roleValues: RoleValuesResponse | null;
  roleValuesRequest: boolean;
  roleValuesError: ApiErrorDetail | null;
  // ключ — RoleValueItem.value, значение — роль (client/manager/system/unknown)
  valueMapping: Record<string, string>;

  mappingPreview: ValidateMappingResponse | null;
};

const emptyRoleColumns: RoleColumnsState = {
  source_column: null,
  sender_name_column: null,
  sender_external_id_column: null,
  manager_name_column: null,
  manager_external_id_column: null,
};

// Состояние живёт в Redux-store на всю сессию вкладки и не сбрасывается при
// навигации между шагами импорта, поэтому отдельное хранилище не нужно.
const initialState: TImportState = {
  dialogsImportPreview: null,
  importRequest: false,
  importError: null,
  columnMapping: {},
  columnSelection: {},
  roleStrategy: null,
  roleColumns: emptyRoleColumns,
  compareBy: "id",
  roleValues: null,
  roleValuesRequest: false,
  roleValuesError: null,
  valueMapping: {},
  mappingPreview: null,
};

export const importFiles = createAsyncThunk(
  "import/importFile",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      return await importPreviewAPI(formData);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Экран «Роли»: значения / отправители из выбранной колонки (modes 1, 2, 4).
export const fetchRoleValues = createAsyncThunk(
  "import/fetchRoleValues",
  async (
    { import_id, data }: { import_id: number; data: RoleValuesRequest },
    { rejectWithValue }
  ) => {
    try {
      return await roleValuesAPI(import_id, data);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const importMapping = createAsyncThunk(
  "import/importMapping",
  async (
    { import_id, data }: { import_id: number; data: ValidateMappingRequest },
    { rejectWithValue }
  ) => {
    try {
      return await validateMappingAPI(import_id, data);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const confirmImport = createAsyncThunk(
  "import/confirmImport",
  async (
    {
      import_id,
      run_analysis,
    }: { import_id: number; run_analysis: ConfirmImportRequest },
    { rejectWithValue }
  ) => {
    try {
      return await confirmImportAPI(import_id, run_analysis);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const importSlice = createSlice({
  name: "import",
  initialState,
  reducers: {
    clearData: () => initialState,

    // Записать preview напрямую (используется аудио: данные приходят из
    // GET /imports/{id}/preview, а не из синхронного POST /imports/preview)
    setImportPreview: (state, action: PayloadAction<ImportPreviewResponse>) => {
      state.dialogsImportPreview = action.payload;
    },

    setColumnMapping: (
      state,
      action: PayloadAction<Record<string, string>>
    ) => {
      state.columnMapping = action.payload;
    },

    // Сохранить UI-выбор сопоставления колонок (подписи полей по колонкам)
    setColumnSelection: (
      state,
      action: PayloadAction<Record<string, string>>
    ) => {
      state.columnSelection = action.payload;
    },

    // Смена режима сбрасывает зависимые данные ролей (спека, разделы «Роли»)
    setRoleStrategy: (state, action: PayloadAction<RoleStrategy | null>) => {
      state.roleStrategy = action.payload;
      state.roleColumns = emptyRoleColumns;
      state.compareBy = "id";
      state.roleValues = null;
      state.valueMapping = {};
      state.roleValuesError = null;
    },

    // Установить выбранную колонку для конкретного слота
    setRoleColumn: (
      state,
      action: PayloadAction<{ key: keyof RoleColumnsState; value: string | null }>
    ) => {
      state.roleColumns[action.payload.key] = action.payload.value;
    },

    // Способ сравнения для режима manager_match (id / name)
    setCompareBy: (state, action: PayloadAction<CompareBy>) => {
      state.compareBy = action.payload;
    },

    // Установить роль для одного значения (таблица сопоставления, modes 1, 2)
    setValueRole: (
      state,
      action: PayloadAction<{ value: string; role: string }>
    ) => {
      state.valueMapping[action.payload.value] = action.payload.role;
    },

    // Полная замена value_mapping
    setValueMapping: (
      state,
      action: PayloadAction<Record<string, string>>
    ) => {
      state.valueMapping = action.payload;
    },

    // Отметить/снять отправителя как менеджера (чеклист, mode 4)
    toggleManagerValue: (state, action: PayloadAction<string>) => {
      const value = action.payload;
      if (state.valueMapping[value] === "manager") {
        delete state.valueMapping[value];
      } else {
        state.valueMapping[value] = "manager";
      }
    },

    // Сброс при смене выбранной колонки (спека: очистить таблицу и value_mapping)
    clearRoleSelection: (state) => {
      state.roleValues = null;
      state.valueMapping = {};
      state.roleValuesError = null;
    },
  },
  selectors: {
    importSliceSelector: (state) => state,
  },
  extraReducers: (builder) => {
    builder
      .addCase(importFiles.pending, (state) => {
        state.importRequest = true;
        state.importError = null;
      })
      .addCase(importFiles.rejected, (state, action) => {
        state.importRequest = false;
        state.importError = (action.payload as ApiError).detail;
      })
      .addCase(importFiles.fulfilled, (state, action) => {
        state.importRequest = false;
        state.dialogsImportPreview = action.payload;
      })

      .addCase(fetchRoleValues.pending, (state) => {
        state.roleValuesRequest = true;
        state.roleValuesError = null;
      })
      .addCase(fetchRoleValues.rejected, (state, action) => {
        state.roleValuesRequest = false;
        state.roleValuesError = (action.payload as ApiError).detail;
      })
      .addCase(fetchRoleValues.fulfilled, (state, action) => {
        state.roleValuesRequest = false;
        state.roleValues = action.payload;
        // Предзаполняем value_mapping предложенными ролями (suggested_role)
        const seeded: Record<string, string> = {};
        action.payload.items.forEach((item) => {
          if (item.suggested_role) {
            seeded[item.value] = item.suggested_role;
          }
        });
        state.valueMapping = seeded;
      })

      .addCase(importMapping.pending, (state) => {
        state.importRequest = true;
        state.importError = null;
      })
      .addCase(importMapping.rejected, (state, action) => {
        state.importRequest = false;
        state.importError = (action.payload as ApiError).detail;
      })
      .addCase(importMapping.fulfilled, (state, action) => {
        state.importRequest = false;
        state.mappingPreview = action.payload;
      })

      .addCase(confirmImport.pending, (state) => {
        state.importRequest = true;
        state.importError = null;
      })
      .addCase(confirmImport.rejected, (state, action) => {
        state.importRequest = false;
        state.importError = (action.payload as ApiError).detail;
      })
      .addCase(confirmImport.fulfilled, (state) => {
        state.importRequest = false;
      });
  },
});

export const {
  clearData,
  setImportPreview,
  setColumnMapping,
  setColumnSelection,
  setRoleStrategy,
  setRoleColumn,
  setCompareBy,
  setValueRole,
  setValueMapping,
  toggleManagerValue,
  clearRoleSelection,
} = importSlice.actions;
export const { importSliceSelector } = importSlice.selectors;
