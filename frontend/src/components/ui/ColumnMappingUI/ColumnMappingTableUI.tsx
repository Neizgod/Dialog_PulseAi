import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./ColumnMappingTableUI.module.css";
import arrow from "../../../assets/images/arrow.svg";

type FormattedColumn = {
  name: string;
  sampleValue: string;
};

type ColumnMappingTableUIProps = {
  columns: FormattedColumn[];
  mapping: Record<string, string>;
  openDropdown: string | null;
  systemFields: string[];
  onToggleDropdown: (colName: string) => void;
  onSelect: (colName: string, field: string) => void;
  onBack: () => void;
  onNext: () => void;
};

export const ColumnMappingTableUI = ({
  columns,
  mapping,
  openDropdown,
  systemFields,
  onToggleDropdown,
  onSelect,
  onBack,
  onNext,
}: ColumnMappingTableUIProps) => {
  // Триггеры дропдаунов по имени колонки — чтобы измерить позицию меню
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const menuRef = useRef<HTMLDivElement>(null);
  // Меню рендерим в портал с position: fixed, иначе его режут overflow таблицы.
  const [menuPos, setMenuPos] = useState<{
    left: number;
    top: number;
    width: number;
    up: boolean;
  } | null>(null);

  useLayoutEffect(() => {
    if (!openDropdown) {
      setMenuPos(null);
      return;
    }
    const el = triggerRefs.current[openDropdown];
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      const menuHeight = Math.min(320, systemFields.length * 38 + 8);
      const spaceBelow = window.innerHeight - r.bottom;
      const up = spaceBelow < menuHeight + 16 && r.top > spaceBelow;
      setMenuPos({
        left: r.left,
        top: up ? r.top - 4 : r.bottom + 4,
        width: r.width,
        up,
      });
    };
    measure();

    // При скролле страницы/таблицы или ресайзе fixed-меню «отрывается» от
    // триггера — закрываем его. Но скролл ВНУТРИ самого меню игнорируем, иначе
    // список нельзя пролистать. capture: true ловит скролл внутри тела таблицы.
    const close = () => onToggleDropdown(openDropdown);
    const onScroll = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      close();
    };
    window.addEventListener("resize", close);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", close);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [openDropdown, systemFields.length, onToggleDropdown]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Сопоставление колонок</h1>
        <p className={styles.description}>
          Укажите, какие колонки в вашем файле соответствуют системным полям
        </p>
      </header>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <span className={styles.headerCell}>Колонка в файле</span>
          <span className={styles.headerCell}>Пример значения</span>
          <span className={styles.headerCell}>Поле в системе</span>
        </div>

        <div className={`${styles.tableBody} customScroll`}>
          {columns.map((col) => {
            const selected = mapping[col.name] ?? "Не импортировать";
            const isOpen = openDropdown === col.name;
            const isMapped = selected !== "Не импортировать";

            return (
              <div key={col.name} className={styles.tableRow}>
                <span className={styles.colName}>{col.name}</span>
                <span className={styles.colSample}>{col.sampleValue}</span>

                <div className={styles.dropdownWrapper}>
                  <button
                    ref={(el) => {
                      triggerRefs.current[col.name] = el;
                    }}
                    className={`${styles.dropdownTrigger} ${isMapped ? styles.dropdownTriggerMapped : ""}`}
                    onClick={() => onToggleDropdown(col.name)}
                    type="button"
                  >
                    <span>{selected}</span>
                    <svg
                      className={`${styles.chevron} ${isOpen ? "" : styles.chevronOpen}`}
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M4 6l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {isOpen &&
                    menuPos &&
                    createPortal(
                      <div
                        ref={menuRef}
                        className={styles.dropdownMenu}
                        style={{
                          position: "fixed",
                          left: menuPos.left,
                          top: menuPos.top,
                          width: menuPos.width,
                          right: "auto",
                          transform: menuPos.up
                            ? "translateY(-100%)"
                            : undefined,
                        }}
                      >
                        {systemFields.map((field) => (
                          <button
                            key={field}
                            className={`${styles.dropdownItem} ${
                              field === selected ? styles.dropdownItemActive : ""
                            }`}
                            onClick={() => onSelect(col.name, field)}
                            type="button"
                          >
                            {field}
                          </button>
                        ))}
                      </div>,
                      document.body
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.requirements}>
          <h3 className={styles.reqTitle}>Требование к файлу:</h3>
          <ul className={styles.reqList}>
            <li>Обязательные поля: ID диалога, автор сообщения, менеджер</li>
            <li>
              Желательные поля: Дата, канал общения, текст сообщения, ID клиента
            </li>
          </ul>
        </div>
        <div className={styles.buttonsWrapper}>
          <button className={styles.backBtn} onClick={onBack}>
            <span className={styles.backIcon}>
              <img src={arrow} alt="" />
            </span>
            Назад
          </button>
          <button className={styles.nextBtn} onClick={onNext}>
            Далее
            <span>
              <img src={arrow} alt="" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
