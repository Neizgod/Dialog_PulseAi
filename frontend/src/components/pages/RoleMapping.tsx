import { useEffect, useState, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../services/store";
import {
  fetchRoleValues,
  importMapping,
  importSliceSelector,
  setRoleStrategy,
  setRoleColumn,
  setCompareBy,
  setValueRole,
  toggleManagerValue,
  clearRoleSelection,
  type RoleColumnsState,
} from "../../services/slices/importSlice";
import {
  RoleMappingUI,
  type RoleOptionUI,
  type StrategyOptionUI,
} from "../ui/RoleMappingUI/RoleMappingUI";
import type {
  RoleDetection,
  RoleStrategy,
  RoleValuesRequest,
  ValidateMappingRequest,
  ValidateMappingResponse,
} from "../../utils/types/imports.types";

const STRATEGY_OPTIONS: StrategyOptionUI[] = [
  {
    value: "role_column",
    label: "По роли",
    description:
      "Система определит участников на основе данных из указанной колонки (например, «sender_role»)",
  },
  {
    value: "direction_mapping",
    label: "По направлению",
    description:
      "Роли распределятся по статусу (например: входящие — клиент, исходящие — менеджер)",
  },
  {
    value: "manager_match",
    label: "Сравнение с менеджером",
    description:
      "Система сопоставит ID или имя автора сообщения с менеджером, закрепленным за диалогом",
  },
  {
    value: "selected_manager_values",
    label: "Ручной выбор",
    description:
      "Вы самостоятельно отметите менеджеров из списка пользователей в загруженном файле",
  },
];

const ROLE_OPTIONS: RoleOptionUI[] = [
  { value: "client", label: "Клиент" },
  { value: "manager", label: "Менеджер" },
  { value: "system", label: "Служебные сообщения" },
  { value: "unknown", label: "Неизвестно" },
];

// Сообщение об ошибке валидации по ответу validate-mapping
const buildValidationMessage = (res: ValidateMappingResponse): string | null => {
  if (res.mapping_valid) return null;
  const missing = res.required_fields_missing ?? [];
  if (missing.some((f) => f.includes("sender_role"))) {
    return "Не выбрана колонка с ролью отправителя. Выберите колонку, где указано, кто написал сообщение.";
  }
  if (missing.some((f) => f.includes("direction"))) {
    return "Не выбрана колонка с направлением сообщения. Выберите колонку, где указано направление.";
  }
  if (missing.some((f) => f.includes("manager"))) {
    return "Не хватает данных для сравнения автора с менеджером. Выберите пару колонок: ID автора и ID менеджера или имя автора и имя менеджера.";
  }
  if (missing.some((f) => f.includes("sender"))) {
    return "Не выбрана колонка отправителя. Выберите колонку с именем или ID отправителя.";
  }
  if (res.row_errors && res.row_errors.length > 0) {
    return "Не удалось сопоставить некоторые значения с ролями. Проверьте выбранные роли.";
  }
  return "Не удалось определить роли. Проверьте выбранные колонки и значения.";
};

export const RoleMapping = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    dialogsImportPreview,
    columnMapping,
    roleStrategy,
    roleColumns,
    compareBy,
    roleValues,
    roleValuesRequest,
    valueMapping,
    importRequest,
    importError,
  } = useAppSelector(importSliceSelector);

  const [validationError, setValidationError] = useState<string | null>(null);

  const previewColumns = dialogsImportPreview?.columns ?? [];
  const importId = dialogsImportPreview?.import_id;
  const columnNames = previewColumns.map((c) => c.name);

  // Имя колонки по предложенному backend полю (suggested_field)
  const suggestedColumn = useCallback(
    (field: string): string | null =>
      previewColumns.find((c) => c.suggested_field === field)?.name ?? null,
    [previewColumns]
  );

  // Запрос /role-values для режимов 1, 2, 4
  const fetchValues = useCallback(
    (
      strategy: RoleStrategy,
      opts: {
        source_column?: string | null;
        sender_name_column?: string | null;
        sender_external_id_column?: string | null;
      }
    ) => {
      if (!importId) return;
      let data: RoleValuesRequest;
      if (strategy === "role_column" || strategy === "direction_mapping") {
        if (!opts.source_column) return;
        data = { strategy, source_column: opts.source_column };
      } else if (strategy === "selected_manager_values") {
        if (!opts.sender_name_column && !opts.sender_external_id_column) return;
        data = {
          strategy,
          sender_name_column: opts.sender_name_column ?? null,
          sender_external_id_column: opts.sender_external_id_column ?? null,
        };
      } else {
        return; // manager_match не вызывает /role-values
      }
      dispatch(clearRoleSelection());
      dispatch(fetchRoleValues({ import_id: importId, data }));
    },
    [dispatch, importId]
  );

  // Выбор стратегии: сброс + авто-подбор колонок + (для 1,2,4) фетч значений
  const handleStrategy = useCallback(
    (strategy: RoleStrategy) => {
      setValidationError(null);
      dispatch(setRoleStrategy(strategy));

      if (strategy === "role_column" || strategy === "direction_mapping") {
        const field = strategy === "role_column" ? "sender_role" : "direction";
        const col = suggestedColumn(field);
        if (col) {
          dispatch(setRoleColumn({ key: "source_column", value: col }));
          fetchValues(strategy, { source_column: col });
        }
      } else if (strategy === "manager_match") {
        const sid = suggestedColumn("sender_external_id");
        const mid = suggestedColumn("manager_external_id");
        const sn = suggestedColumn("sender_name");
        const mn = suggestedColumn("manager_name");
        if (sid) dispatch(setRoleColumn({ key: "sender_external_id_column", value: sid }));
        if (mid) dispatch(setRoleColumn({ key: "manager_external_id_column", value: mid }));
        if (sn) dispatch(setRoleColumn({ key: "sender_name_column", value: sn }));
        if (mn) dispatch(setRoleColumn({ key: "manager_name_column", value: mn }));
      } else {
        const sn = suggestedColumn("sender_name");
        const sid = suggestedColumn("sender_external_id");
        if (sn) dispatch(setRoleColumn({ key: "sender_name_column", value: sn }));
        if (sid) dispatch(setRoleColumn({ key: "sender_external_id_column", value: sid }));
        if (sn || sid) {
          fetchValues(strategy, {
            sender_name_column: sn,
            sender_external_id_column: sid,
          });
        }
      }
    },
    [dispatch, suggestedColumn, fetchValues]
  );

  // Стратегия по умолчанию при первом заходе (если ничего не сохранено)
  useEffect(() => {
    if (!roleStrategy) {
      handleStrategy("role_column");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleColumn = useCallback(
    (key: keyof RoleColumnsState, value: string) => {
      dispatch(setRoleColumn({ key, value }));
      if (!roleStrategy) return;

      if (
        (roleStrategy === "role_column" ||
          roleStrategy === "direction_mapping") &&
        key === "source_column"
      ) {
        fetchValues(roleStrategy, { source_column: value });
      } else if (
        roleStrategy === "selected_manager_values" &&
        (key === "sender_name_column" || key === "sender_external_id_column")
      ) {
        const sn =
          key === "sender_name_column" ? value : roleColumns.sender_name_column;
        const sid =
          key === "sender_external_id_column"
            ? value
            : roleColumns.sender_external_id_column;
        fetchValues(roleStrategy, {
          sender_name_column: sn,
          sender_external_id_column: sid,
        });
      }
    },
    [dispatch, roleStrategy, roleColumns, fetchValues]
  );

  const handleNext = useCallback(async () => {
    if (!importId || !roleStrategy) return;

    const column_mapping: Record<string, string> = { ...columnMapping };
    let role_detection: RoleDetection;

    if (roleStrategy === "role_column") {
      if (roleColumns.source_column)
        column_mapping.sender_role = roleColumns.source_column;
      role_detection = {
        strategy: roleStrategy,
        scope: "batch",
        value_mapping: valueMapping,
        default_role: null,
        dialog_value_mapping: {},
      };
    } else if (roleStrategy === "direction_mapping") {
      if (roleColumns.source_column)
        column_mapping.direction = roleColumns.source_column;
      role_detection = {
        strategy: roleStrategy,
        scope: "batch",
        value_mapping: valueMapping,
        default_role: null,
        dialog_value_mapping: {},
      };
    } else if (roleStrategy === "manager_match") {
      if (compareBy === "id") {
        if (roleColumns.sender_external_id_column)
          column_mapping.sender_external_id = roleColumns.sender_external_id_column;
        if (roleColumns.manager_external_id_column)
          column_mapping.manager_external_id =
            roleColumns.manager_external_id_column;
      } else {
        if (roleColumns.sender_name_column)
          column_mapping.sender_name = roleColumns.sender_name_column;
        if (roleColumns.manager_name_column)
          column_mapping.manager_name = roleColumns.manager_name_column;
      }
      role_detection = {
        strategy: roleStrategy,
        scope: "batch",
        value_mapping: {},
        default_role: "client",
        dialog_value_mapping: {},
      };
    } else {
      if (roleColumns.sender_name_column)
        column_mapping.sender_name = roleColumns.sender_name_column;
      if (roleColumns.sender_external_id_column)
        column_mapping.sender_external_id = roleColumns.sender_external_id_column;
      role_detection = {
        strategy: roleStrategy,
        scope: "batch",
        value_mapping: valueMapping,
        default_role: "client",
        dialog_value_mapping: {},
      };
    }

    // Если backend подсказал колонку менеджера в превью — включаем её в mapping.
    // Автоопределение менеджера на backend это лишь страховка, а не замена явного
    // сопоставления. Явно выбранные поля (manager_match) не перезаписываем.
    const suggestedManagerName = suggestedColumn("manager_name");
    const suggestedManagerId = suggestedColumn("manager_external_id");
    if (suggestedManagerName && !column_mapping.manager_name) {
      column_mapping.manager_name = suggestedManagerName;
    }
    if (suggestedManagerId && !column_mapping.manager_external_id) {
      column_mapping.manager_external_id = suggestedManagerId;
    }

    const data: ValidateMappingRequest = { column_mapping, role_detection };

    try {
      const result = await dispatch(
        importMapping({ import_id: importId, data })
      ).unwrap();
      if (result.mapping_valid) {
        setValidationError(null);
        navigate("/import/csv/confirm");
      } else {
        setValidationError(buildValidationMessage(result));
      }
    } catch {
      // HTTP-ошибка отобразится через importError
    }
  }, [
    dispatch,
    navigate,
    importId,
    roleStrategy,
    columnMapping,
    roleColumns,
    compareBy,
    valueMapping,
    suggestedColumn,
  ]);

  if (!dialogsImportPreview) {
    return <Navigate to="/import/csv" replace />;
  }

  const errorMessage = validationError ?? importError?.message ?? null;

  return (
    <RoleMappingUI
      strategy={roleStrategy ?? "role_column"}
      strategyOptions={STRATEGY_OPTIONS}
      onStrategy={handleStrategy}
      columns={columnNames}
      roleOptions={ROLE_OPTIONS}
      roleColumns={roleColumns}
      onColumn={handleColumn}
      compareBy={compareBy}
      onCompareBy={(c) => dispatch(setCompareBy(c))}
      items={roleValues?.items ?? null}
      valuesLoading={roleValuesRequest}
      valueMapping={valueMapping}
      onValueRole={(value, role) => dispatch(setValueRole({ value, role }))}
      onToggleManager={(value) => dispatch(toggleManagerValue(value))}
      isLoading={importRequest}
      errorMessage={errorMessage}
      onBack={() => navigate(-1)}
      onNext={handleNext}
    />
  );
};
