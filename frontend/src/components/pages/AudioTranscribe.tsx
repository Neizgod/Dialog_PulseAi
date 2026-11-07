import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  AudioTranscribeUI,
  type AudioTranscribeState,
} from "../ui/AudioTranscribeUI/AudioTranscribeUI";
import { getImportLoadDetailsAPI } from "../../utils/dialog-pulse-api";

const POLL_INTERVAL = 3000;

export const AudioTranscribe = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // import_id прилетает со страницы загрузки через navigate state
  const importId = (location.state as { importId?: number } | null)?.importId;

  const [percent, setPercent] = useState(5);
  const [state, setState] = useState<AudioTranscribeState>("processing");

  // Поллинг статуса расшифровки: GET /imports/{id}.
  // queued/processing → ждём; preview_ready/imported → готово; failed → ошибка.
  useEffect(() => {
    if (importId == null) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const res = await getImportLoadDetailsAPI(importId);
        if (!active) return;
        if (res.status === "transcription_failed") {
          setState("error");
          return;
        }
        if (res.status === "preview_ready" || res.status === "imported") {
          setPercent(100);
          setState("done");
          return;
        }
        // transcription_queued / transcription_processing — продолжаем
        timer = setTimeout(poll, POLL_INTERVAL);
      } catch {
        if (active) timer = setTimeout(poll, POLL_INTERVAL);
      }
    };
    poll();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [importId]);

  // Прогресс имитируем: API не отдаёт процент расшифровки. Ползём до 95%,
  // а 100% выставляет поллинг при завершении.
  useEffect(() => {
    if (state !== "processing") return;
    const t = setInterval(() => {
      setPercent((p) => (p >= 95 ? 95 : p + 3));
    }, 700);
    return () => clearInterval(t);
  }, [state]);

  // Прямой заход без import_id — возвращаем на загрузку
  const hasStarted = useRef(importId != null);
  if (!hasStarted.current) {
    return <Navigate to="/import/audio" replace />;
  }

  return (
    <AudioTranscribeUI
      state={state}
      percent={percent}
      // Повторной расшифровки в API нет — «Повторить» ведёт на повторную загрузку
      onRetry={() => navigate("/import/audio")}
      onBack={() => navigate("/import/audio")}
      onUploadAnother={() => navigate("/import/audio")}
      onNext={() =>
        navigate("/import/audio/preview", { state: { importId } })
      }
    />
  );
};
