import { useEffect, useRef } from "react";

// Периодически вызывает callback раз в `delayMs`, пока `active`.
// Хранит свежий callback в ref, поэтому интервал не пересоздаётся на каждый
// рендер (паттерн useInterval). delayMs=null или active=false — поллинг выключен.
export function usePolling(
  callback: () => void,
  delayMs: number | null,
  active = true
): void {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active || delayMs == null) return;
    const id = setInterval(() => saved.current(), delayMs);
    return () => clearInterval(id);
  }, [delayMs, active]);
}
