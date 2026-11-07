import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { TxtRolesUI, type RoleOptionUI } from "../ui/TxtRolesUI/TxtRolesUI";
import { useAppSelector } from "../../services/store";
import { importSliceSelector } from "../../services/slices/importSlice";
import {
  getTxtRolesValuesAPI,
  validateTxtSettingsAPI,
} from "../../utils/dialog-pulse-api";
import type {
  TxtPreviewResponse,
  TxtRoleParticipant,
} from "../../utils/types/imports.types";

// Роли системы: значения совпадают с SenderRole
const ROLE_OPTIONS: RoleOptionUI[] = [
  { value: "client", label: "Клиент" },
  { value: "manager", label: "Менеджер" },
  { value: "system", label: "Служебные сообщения" },
  { value: "unknown", label: "Не определено" },
];

export const TxtRoles = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Экран общий для TXT и аудио — база пути берётся из текущего URL
  const base = location.pathname.startsWith("/import/audio")
    ? "/import/audio"
    : "/import/txt";
  const { dialogsImportPreview } = useAppSelector(importSliceSelector);
  // preview хранит TxtPreviewResponse (для аудио — совместимый AudioPreviewResponse)
  const preview = dialogsImportPreview as unknown as TxtPreviewResponse | null;
  const importId = preview?.import_id;

  const [participants, setParticipants] = useState<TxtRoleParticipant[]>([]);
  const [authorRoles, setAuthorRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загружаем участников с предложенными ролями (POST /roles/values, без body)
  useEffect(() => {
    if (importId == null) return;
    let active = true;
    setLoading(true);
    getTxtRolesValuesAPI(importId)
      .then((res) => {
        if (!active) return;
        setParticipants(res.participants);
        const seeded: Record<string, string> = {};
        res.participants.forEach((p) => {
          seeded[p.author] = p.role ?? "unknown";
        });
        setAuthorRoles(seeded);
      })
      .catch(() => {
        if (active) setError("Не удалось загрузить участников");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [importId]);

  if (!preview) {
    return <Navigate to={base} replace />;
  }

  const rows = participants.map((p) => ({
    author: p.author,
    sampleText: p.sample_text,
    role: authorRoles[p.author] ?? "",
  }));

  const handleNext = async () => {
    if (importId == null) return;
    setSubmitting(true);
    setError(null);
    try {
      await validateTxtSettingsAPI(importId, { author_roles: authorRoles });
      // Роли нужны на confirm, чтобы показать «Менеджер/Клиент» в примерах диалогов
      navigate(`${base}/confirm`, { state: { authorRoles } });
    } catch {
      setError("Не удалось сохранить настройки ролей");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TxtRolesUI
      rows={rows}
      loading={loading}
      roleOptions={ROLE_OPTIONS}
      onRoleChange={(author, role) =>
        setAuthorRoles((prev) => ({ ...prev, [author]: role }))
      }
      submitting={submitting}
      errorMessage={error}
      onBack={() => navigate(`${base}/preview`, { state: { importId } })}
      onNext={handleNext}
    />
  );
};
