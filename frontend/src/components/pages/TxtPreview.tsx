import { Navigate, useNavigate } from "react-router-dom";
import { TxtPreviewUI } from "../ui/TxtPreviewUI/TxtPreviewUI";
import { useAppSelector } from "../../services/store";
import { importSliceSelector } from "../../services/slices/importSlice";
import type { TxtPreviewResponse } from "../../utils/types/imports.types";

export const TxtPreview = () => {
  const navigate = useNavigate();
  const { dialogsImportPreview } = useAppSelector(importSliceSelector);

  // В TXT/Markdown-потоке preview хранит TxtPreviewResponse (другой формат, чем CSV)
  const preview = dialogsImportPreview as unknown as TxtPreviewResponse | null;

  if (!preview) {
    return <Navigate to="/import/txt" replace />;
  }

  return (
    <TxtPreviewUI
      fileName={preview.original_filename ?? "Без названия"}
      dialogsCount={preview.dialogs_count}
      messagesCount={preview.messages_count}
      dialogs={preview.dialog_previews}
      redaction={preview.redaction ?? null}
      onBack={() => navigate("/import/txt")}
      onNext={() => navigate("/import/txt/roles")}
    />
  );
};
