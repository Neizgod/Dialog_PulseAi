import { useState, useEffect, useCallback, useRef } from "react";
import { usePolling } from "../../hooks/usePolling";
import { useNavigate } from "react-router-dom";
import {
  getImports,
  getProgressAnalysisAPI,
  getDialogsSummaryAPI,
  getImportOptionsAPI,
} from "../../utils/dialog-pulse-api";
import { ImportsUI } from "../ui/ImportsUI/ImportsUI";
import type {
  ImportBatchListItem,
  ImportBatchListQuery,
  ImportOptionsResponse,
} from "../../utils/types/imports.types";

const EMPTY_IMPORT_OPTIONS: ImportOptionsResponse = {
  source_types: [],
  status_groups: [],
};

export const Imports = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ImportBatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] =
    useState<ImportOptionsResponse>(EMPTY_IMPORT_OPTIONS);
  const [sourceTypeFilter, setSourceTypeFilter] = useState("");
  const [statusGroupFilter, setStatusGroupFilter] = useState("");

  // Зеркало items для чтения предыдущих значений внутри polling
  const itemsRef = useRef<ImportBatchListItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const buildImportsQuery = useCallback((): ImportBatchListQuery => {
    const query: ImportBatchListQuery = {};

    if (sourceTypeFilter) {
      query.source_type = sourceTypeFilter as ImportBatchListQuery["source_type"];
    }

    if (statusGroupFilter) {
      query.status_group =
        statusGroupFilter as ImportBatchListQuery["status_group"];
    }

    return query;
  }, [sourceTypeFilter, statusGroupFilter]);

  // Догружаем данные для колец: прогресс (для «Анализируется») и среднюю оценку
  // (для «Обработано»). Среднюю оценку кэшируем между обновлениями — не дёргаем
  // её повторно на каждом тике polling.
  const augment = useCallback(
    (list: ImportBatchListItem[]): Promise<ImportBatchListItem[]> =>
      Promise.all(
        list.map(async (it) => {
          const prev = itemsRef.current.find((p) => p.id === it.id);
          try {
            if (it.status === "analysis_processing") {
              const p = await getProgressAnalysisAPI(it.id);
              return { ...it, progress_percent: p.progress_percent };
            }
            if (
              it.status === "analysis_completed" ||
              it.status === "analysis_completed_with_errors"
            ) {
              if (prev?.average_quality_score != null) {
                return {
                  ...it,
                  average_quality_score: prev.average_quality_score,
                };
              }
              const s = await getDialogsSummaryAPI({ import_id: it.id });
              return { ...it, average_quality_score: s.average_quality_score };
            }
          } catch {
            /* поле кольца не догрузилось — оставляем карточку как есть */
          }
          return it;
        })
      ),
    []
  );

  useEffect(() => {
    let active = true;

    getImportOptionsAPI()
      .then((res) => {
        if (active) setFilterOptions(res);
      })
      .catch(() => {
        if (active) setFilterOptions(EMPTY_IMPORT_OPTIONS);
      });

    return () => {
      active = false;
    };
  }, []);

  // Первичная загрузка и перезагрузка при изменении фильтров
  useEffect(() => {
    let active = true;
    setLoading(true);

    getImports(buildImportsQuery())
      .then(async (res) => {
        if (!active) return;
        // Показываем карточки сразу; кольца заполнятся после дозагрузки
        setItems(res.items);
        setLoading(false);
        const aug = await augment(res.items);
        if (active) setItems(aug);
      })
      .catch(() => {
        if (active) {
          setItems([]);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [augment, buildImportsQuery]);

  // Пока есть анализируемые загрузки — обновляем список + прогресс каждые 4с
  const hasAnalyzing = items.some((it) => it.status === "analysis_processing");
  usePolling(
    async () => {
      try {
        const res = await getImports(buildImportsQuery());
        const aug = await augment(res.items);
        setItems(aug);
      } catch {
        /* игнорируем ошибку одного тика polling */
      }
    },
    4000,
    hasAnalyzing
  );

  // Открыть экран AI-анализа конкретной загрузки
  const handleOpen = useCallback(
    (id: number) => navigate(`/downloads/${id}`),
    [navigate]
  );

  // Загрузить новый файл — мастер импорта
  const handleUpload = useCallback(() => navigate("/import"), [navigate]);

  return (
    <ImportsUI
      items={items}
      loading={loading}
      sourceTypeFilter={sourceTypeFilter}
      statusGroupFilter={statusGroupFilter}
      sourceTypeOptions={filterOptions.source_types}
      statusGroupOptions={filterOptions.status_groups}
      onSourceTypeFilterChange={setSourceTypeFilter}
      onStatusGroupFilterChange={setStatusGroupFilter}
      onOpen={handleOpen}
      onUpload={handleUpload}
    />
  );
};
