import { useEffect, type RefObject } from "react";

// Закрывает поповер/меню при клике вне элемента `ref` или нажатии Escape.
// `active` — вешать слушатели только когда меню открыто (иначе — no-op).
export function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  onDismiss: () => void,
  active = true
): void {
  useEffect(() => {
    if (!active) return;

    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, onDismiss, active]);
}
