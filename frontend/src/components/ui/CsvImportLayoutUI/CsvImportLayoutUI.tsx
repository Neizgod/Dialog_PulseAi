import { Outlet, useLocation } from "react-router-dom";
import styles from "./CsvImportLayoutUI.module.css";

export type ImportKind = "csv" | "txt" | "audio";
export type ImportOutletContext = { kind: ImportKind };

// У CSV 5 шагов (с «Сопоставлением»), у TXT/Markdown — 4 (без него),
// у аудио — 5 (с «Расшифровкой» вместо «Сопоставления»)
const STEPS: Record<ImportKind, { label: string; path: string }[]> = {
  csv: [
    { label: "Загрузка", path: "/import/csv" },
    { label: "Просмотр", path: "/import/csv/preview" },
    { label: "Сопоставление", path: "/import/csv/mapping" },
    { label: "Роли", path: "/import/csv/roles" },
    { label: "Импорт", path: "/import/csv/confirm" },
  ],
  txt: [
    { label: "Загрузка", path: "/import/txt" },
    { label: "Просмотр", path: "/import/txt/preview" },
    { label: "Роли", path: "/import/txt/roles" },
    { label: "Импорт", path: "/import/txt/confirm" },
  ],
  audio: [
    { label: "Загрузка", path: "/import/audio" },
    { label: "Расшифровка", path: "/import/audio/transcribe" },
    { label: "Предпросмотр", path: "/import/audio/preview" },
    { label: "Роли", path: "/import/audio/roles" },
    { label: "Импорт", path: "/import/audio/confirm" },
  ],
};

export const CsvImportLayoutUI = ({
  kind = "csv",
}: {
  kind?: ImportKind;
}) => {
  const location = useLocation();
  const steps = STEPS[kind];
  const currentStep = steps.findIndex((s) => s.path === location.pathname);

  return (
    <div className={styles.wrapper}>
      <nav className={styles.stepper}>
        {steps.map((step, index) => (
          <div key={step.path} className={styles.stepItem}>
            <div className={styles.stepWrapper}>
              <div
                className={`${styles.stepCircle} ${index === currentStep ? styles.active : ""} ${index < currentStep ? styles.done : ""}`}
              >
                {index + 1}
              </div>
              <span className={styles.stepLabel}>{step.label}</span>
            </div>
            {index < steps.length - 1 && <div className={styles.stepLine} />}
          </div>
        ))}
      </nav>

      <section className={styles.content}>
        <Outlet context={{ kind } satisfies ImportOutletContext} />
      </section>
    </div>
  );
};
