import { useState, useRef, useLayoutEffect } from "react";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import styles from "./Dropdown.module.css";

export type DropdownOption = { value: string; label: string };

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const Dropdown = ({
  value,
  options,
  onChange,
  placeholder = "—",
  disabled = false,
  className,
}: DropdownProps) => {
  const [open, setOpen] = useState(false);
  // Раскрывать меню вверх, если снизу не хватает места (не уезжает за экран)
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // При открытии выбираем направление меню по свободному месту (до отрисовки)
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    // Оценка высоты меню (ограничена max-height: 280px)
    const menuHeight = Math.min(options.length * 42 + 12, 280);
    // +40px запас на нижний паддинг области — иначе меню подрезается
    setDropUp(spaceBelow < menuHeight + 40 && spaceAbove > spaceBelow);
  }, [open, options.length]);

  // Закрытие по клику вне и по Escape
  useOutsideClick(ref, () => setOpen(false), open);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`${styles.dropdown} ${className ?? ""}`}>
      <button
        type="button"
        className={`${styles.trigger} ${selected ? styles.triggerSelected : ""}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
      >
        <span className={styles.triggerText}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
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

      {open && !disabled && (
        <div className={`${styles.menu} ${dropUp ? styles.menuUp : ""}`}>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`${styles.item} ${
                o.value === value ? styles.itemActive : ""
              }`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
