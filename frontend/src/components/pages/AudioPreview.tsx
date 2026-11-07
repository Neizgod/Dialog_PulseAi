import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { TxtPreviewUI } from "../ui/TxtPreviewUI/TxtPreviewUI";
import { useAppDispatch } from "../../services/store";
import { setImportPreview } from "../../services/slices/importSlice";
import { getAudioPreviewAPI } from "../../utils/dialog-pulse-api";
import type {
  AudioPreviewResponse,
  ImportPreviewResponse,
} from "../../utils/types/imports.types";

export const AudioPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  // import_id прилетает со страницы «Расшифровка» через navigate state
  const importId = (location.state as { importId?: number } | null)?.importId;

  const [preview, setPreview] = useState<AudioPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Аудио-preview фетчим и кладём в slice, чтобы «Роли»/«Импорт» его прочитали
  useEffect(() => {
    if (importId == null) return;
    let active = true;
    setLoading(true);
    getAudioPreviewAPI(importId)
      .then((res) => {
        if (!active) return;
        setPreview(res);
        // У аудио нет rows_count — для «Строк» на confirm берём segments_count
        dispatch(
          setImportPreview({
            ...res,
            rows_count: res.segments_count,
          } as unknown as ImportPreviewResponse)
        );
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [importId, dispatch]);

  if (importId == null) {
    return <Navigate to="/import/audio" replace />;
  }

  return (
    <TxtPreviewUI
      fileName={preview?.original_filename ?? "Без названия"}
      dialogsCount={preview?.dialogs_count ?? 0}
      messagesCount={preview?.messages_count ?? 0}
      dialogs={loading ? [] : preview?.dialog_previews ?? []}
      redaction={preview?.redaction ?? null}
      onBack={() => navigate("/import/audio")}
      onNext={() => navigate("/import/audio/roles", { state: { importId } })}
    />
  );
};
