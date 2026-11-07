import styles from "./RoleMappingUI.module.css";
import arrow from "../../../assets/images/arrow.svg";
import { Dropdown } from "../Dropdown/Dropdown";
import type { RoleStrategy, RoleValueItem } from "../../../utils/types/imports.types";
import type { CompareBy, RoleColumnsState } from "../../../services/slices/importSlice";

export type StrategyOptionUI = {
  value: RoleStrategy;
  label: string;
  description: string;
};

export type RoleOptionUI = {
  value: string;
  label: string;
};

interface RoleMappingUIProps {
  strategy: RoleStrategy;
  strategyOptions: StrategyOptionUI[];
  onStrategy: (s: RoleStrategy) => void;

  columns: string[];
  roleOptions: RoleOptionUI[];

  roleColumns: RoleColumnsState;
  onColumn: (key: keyof RoleColumnsState, value: string) => void;

  compareBy: CompareBy;
  onCompareBy: (c: CompareBy) => void;

  items: RoleValueItem[] | null;
  valuesLoading: boolean;
  valueMapping: Record<string, string>;
  onValueRole: (value: string, role: string) => void;
  onToggleManager: (value: string) => void;

  isLoading: boolean;
  errorMessage: string | null;
  onBack: () => void;
  onNext: () => void;
}

const Dots = () => (
  <span className={styles.dots}>
    <span />
    <span />
    <span />
  </span>
);

function ColumnSelect({
  label,
  value,
  columns,
  onChange,
}: {
  label: string;
  value: string | null;
  columns: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <Dropdown
        value={value ?? ""}
        options={columns.map((c) => ({ value: c, label: c }))}
        onChange={onChange}
        placeholder="Выберите колонку"
        className={styles.fieldSelect}
      />
    </div>
  );
}

function RoleSelect({
  value,
  roleOptions,
  onChange,
}: {
  value: string;
  roleOptions: RoleOptionUI[];
  onChange: (v: string) => void;
}) {
  return (
    <Dropdown
      value={value}
      options={roleOptions}
      onChange={onChange}
      placeholder="Выберите роль"
      className={styles.vtRoleSelect}
    />
  );
}

// Таблица «Значение в файле / Роль в системе» (modes 1, 2)
function ValueRoleTable({
  items,
  loading,
  valueMapping,
  roleOptions,
  onValueRole,
}: {
  items: RoleValueItem[] | null;
  loading: boolean;
  valueMapping: Record<string, string>;
  roleOptions: RoleOptionUI[];
  onValueRole: (value: string, role: string) => void;
}) {
  // 40% заглушка — когда колонка не выбрана (нет данных и нет загрузки)
  const faded = !loading && (!items || items.length === 0);

  let rows;
  if (loading) {
    rows = [0, 1].map((i) => (
      <div className={styles.vtRow} key={`load-${i}`}>
        <span className={styles.vtValue}>
          <Dots />
        </span>
        <span className={styles.vtRole}>
          <Dropdown
            value=""
            options={[]}
            onChange={() => {}}
            placeholder="—"
            disabled
            className={styles.vtRoleSelect}
          />
        </span>
      </div>
    ));
  } else if (items && items.length > 0) {
    rows = items.map((it) => (
      <div className={styles.vtRow} key={it.value}>
        <span className={styles.vtValue}>{it.label}</span>
        <span className={styles.vtRole}>
          <RoleSelect
            value={valueMapping[it.value] ?? ""}
            roleOptions={roleOptions}
            onChange={(role) => onValueRole(it.value, role)}
          />
        </span>
      </div>
    ));
  } else {
    // приглушённая заглушка
    rows = ["Менеджер", "Клиент"].map((placeholder, i) => (
      <div className={styles.vtRow} key={`ph-${i}`}>
        <span className={styles.vtValue}>—</span>
        <span className={styles.vtRole}>
          <Dropdown
            value=""
            options={[]}
            onChange={() => {}}
            placeholder={placeholder}
            disabled
            className={styles.vtRoleSelect}
          />
        </span>
      </div>
    ));
  }

  return (
    <div
      className={`${styles.valueTable} ${faded ? styles.valueTableFaded : ""}`}
    >
      <div className={styles.vtHeader}>
        <span className={styles.vtHeaderCell}>Значение в файле</span>
        <span className={styles.vtHeaderCell}>Роль в системе</span>
      </div>
      {rows}
    </div>
  );
}

export const RoleMappingUI = ({
  strategy,
  strategyOptions,
  onStrategy,
  columns,
  roleOptions,
  roleColumns,
  onColumn,
  compareBy,
  onCompareBy,
  items,
  valuesLoading,
  valueMapping,
  onValueRole,
  onToggleManager,
  isLoading,
  errorMessage,
  onBack,
  onNext,
}: RoleMappingUIProps) => {
  const current = strategyOptions.find((o) => o.value === strategy);

  const renderContent = () => {
    switch (strategy) {
      case "role_column":
      case "direction_mapping":
        return (
          <div className={styles.content}>
            <div className={styles.leftCol}>
              <ColumnSelect
                label={
                  strategy === "role_column"
                    ? "Выберите название колонки с ролью отправителя"
                    : "Выберите название колонки с направлением сообщения"
                }
                value={roleColumns.source_column}
                columns={columns}
                onChange={(v) => onColumn("source_column", v)}
              />
            </div>
            <div className={styles.rightCol}>
              <p className={styles.hint}>
                Укажите, какие значения соответствуют ролям в системе
              </p>
              <div style={{ marginTop: 16 }}>
                <ValueRoleTable
                  items={items}
                  loading={valuesLoading}
                  valueMapping={valueMapping}
                  roleOptions={roleOptions}
                  onValueRole={onValueRole}
                />
              </div>
            </div>
          </div>
        );

      case "manager_match":
        return (
          <div className={styles.content}>
            <div className={styles.columnsRow}>
              {compareBy === "id" ? (
                <>
                  <ColumnSelect
                    label="Выберите название колонки с ID автора сообщения"
                    value={roleColumns.sender_external_id_column}
                    columns={columns}
                    onChange={(v) => onColumn("sender_external_id_column", v)}
                  />
                  <ColumnSelect
                    label="Выберите название колонки с ID менеджера диалога"
                    value={roleColumns.manager_external_id_column}
                    columns={columns}
                    onChange={(v) => onColumn("manager_external_id_column", v)}
                  />
                </>
              ) : (
                <>
                  <ColumnSelect
                    label="Выберите название колонки с именем автора сообщения"
                    value={roleColumns.sender_name_column}
                    columns={columns}
                    onChange={(v) => onColumn("sender_name_column", v)}
                  />
                  <ColumnSelect
                    label="Выберите название колонки с именем менеджера диалога"
                    value={roleColumns.manager_name_column}
                    columns={columns}
                    onChange={(v) => onColumn("manager_name_column", v)}
                  />
                </>
              )}
            </div>
          </div>
        );

      case "selected_manager_values":
        return (
          <div className={`${styles.content} ${styles.contentChecklist}`}>
            <span className={styles.fieldLabel}>
              Выберете менеджеров из списка
            </span>
            {valuesLoading ? (
              <Dots />
            ) : items && items.length > 0 ? (
              <div className={`${styles.checklist} customScroll`}>
                {items.map((it) => (
                  <label className={styles.checkItem} key={it.value}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={valueMapping[it.value] === "manager"}
                      onChange={() => onToggleManager(it.value)}
                    />
                    <span className={styles.checkLabel}>{it.label}</span>
                    <span className={styles.checkCount}>
                      {it.messages_count} сообщ.
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <span className={styles.hint}>
                Список отправителей не загружен
              </span>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Проверка ролей</h1>
      </header>

      <section className={styles.strategySection}>
        <p className={styles.sectionLabel}>
          Выберете удобный способ определения роли
        </p>
        <div className={styles.strategyRow}>
          <Dropdown
            value={strategy}
            options={strategyOptions.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            onChange={(v) => onStrategy(v as RoleStrategy)}
            className={styles.strategySelect}
          />

          {strategy === "manager_match" && (
            <div className={styles.compareGroup}>
              <button
                type="button"
                className={styles.radioItem}
                onClick={() => onCompareBy("id")}
              >
                <span
                  className={`${styles.radioMark} ${
                    compareBy === "id" ? styles.radioMarkActive : ""
                  }`}
                />
                <span className={styles.radioText}>
                  <span className={styles.radioLabel}>
                    ID автора и ID менеджера
                  </span>
                  <span className={styles.radioHint}>Рекомендуется</span>
                </span>
              </button>
              <button
                type="button"
                className={styles.radioItem}
                onClick={() => onCompareBy("name")}
              >
                <span
                  className={`${styles.radioMark} ${
                    compareBy === "name" ? styles.radioMarkActive : ""
                  }`}
                />
                <span className={styles.radioText}>
                  <span className={styles.radioLabel}>
                    Имя автора и имя менеджера
                  </span>
                  <span className={styles.radioHint}>Если нет ID</span>
                </span>
              </button>
            </div>
          )}
        </div>
        {current && <p className={styles.strategyDesc}>{current.description}</p>}
      </section>

      <div className={styles.divider} />

      {renderContent()}

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <div className={styles.buttonsWrapper}>
        <button className={styles.backBtn} onClick={onBack} type="button">
          <span className={styles.backIcon}>
            <img src={arrow} alt="" />
          </span>
          Назад
        </button>
        <button
          className={styles.nextBtn}
          onClick={onNext}
          disabled={isLoading}
          type="button"
        >
          {isLoading ? (
            "Загрузка"
          ) : (
            <>
              Далее
              <span>
                <img src={arrow} alt="" />
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
