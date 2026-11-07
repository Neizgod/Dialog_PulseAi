import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { UploadUI } from "../ui/UploadUI/UploadUI";
import { useAppDispatch, useAppSelector } from "../../services/store";
import {
  importFiles,
  importSliceSelector,
} from "../../services/slices/importSlice";
import type { ImportOutletContext } from "../ui/CsvImportLayoutUI/CsvImportLayoutUI";
import {
  getImportChannelsAPI,
  importPreviewAPI,
  downloadImportTemplateAPI,
} from "../../utils/dialog-pulse-api";
import type {
  ImportChannelOption,
  ImportSourceType,
} from "../../utils/types/imports.types";

// Фолбэк-список каналов (из контракта) — на случай, если backend недоступен
const CHANNEL_FALLBACK: ImportChannelOption[] = [
  { value: "phone", label: "Телефон" },
  { value: "vk", label: "ВКонтакте" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "website_chat", label: "Чат на сайте" },
  { value: "crm", label: "CRM" },
  { value: "other", label: "Другое" },
];

export const CsvUpload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  // Маскирование ПДн: пока только UI-состояние (в API поля нет) — подключим,
  // когда бэкенд добавит флаг в запрос импорта/анализа
  const [masked, setMasked] = useState(true);
  // Отдельный флаг загрузки для аудио (идёт мимо importFiles-thunk)
  const [audioUploading, setAudioUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { importRequest } = useAppSelector(importSliceSelector);
  const dispatch = useAppDispatch();

  // Тип импорта берём из layout (csv / txt / audio); по умолчанию csv
  const ctx = useOutletContext<ImportOutletContext>();
  const isTxt = ctx?.kind === "txt";
  const isAudio = ctx?.kind === "audio";

  const validExt = isAudio
    ? [".mp3", ".wav", ".m4a"]
    : isTxt
      ? [".txt", ".md", ".markdown"]
      : [".csv"];
  const maxSizeMb = isAudio ? 25 : isTxt ? 10 : 5;
  // Аудио — один файл за раз
  const singleFile = isAudio;
  const previewPath = isAudio
    ? "/import/audio/transcribe"
    : isTxt
      ? "/import/txt/preview"
      : "/import/csv/preview";

  // Канал импорта. Пока показываем дропдаун на экране аудио; список и дефолт
  // берём из backend (GET /imports/channels), при недоступности — фолбэк.
  const sourceType: ImportSourceType = isAudio ? "audio" : isTxt ? "txt" : "csv";
  const [channels, setChannels] =
    useState<ImportChannelOption[]>(CHANNEL_FALLBACK);
  const [channelValue, setChannelValue] = useState<string>(
    isAudio ? "phone" : "other"
  );

  useEffect(() => {
    if (!isAudio) return;
    let active = true;
    getImportChannelsAPI(sourceType)
      .then((res) => {
        if (!active) return;
        if (res.channels?.length) setChannels(res.channels);
        if (res.default_channel) setChannelValue(res.default_channel);
      })
      .catch(() => {
        /* оставляем фолбэк */
      });
    return () => {
      active = false;
    };
  }, [isAudio, sourceType]);

  const addFiles = useCallback(
    (newFiles: FileList) => {
      const filtered = Array.from(newFiles).filter((f) => {
        const name = f.name.toLowerCase();
        if (!validExt.some((ext) => name.endsWith(ext))) return false;
        if (f.size > maxSizeMb * 1024 * 1024) {
          alert(
            `Файл "${f.name}" превышает максимальный размер ${maxSizeMb} МБ`
          );
          return false;
        }
        return true;
      });

      // Один файл за раз (аудио) — заменяем текущий выбор
      if (singleFile) {
        if (filtered.length > 0) setFiles([filtered[0]]);
        return;
      }

      setFiles((prev) => {
        const existingNames = new Set(prev.map((f) => f.name));
        return [...prev, ...filtered.filter((f) => !existingNames.has(f.name))];
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isTxt, isAudio]
  );

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleNext = async () => {
    // Аудио: загружаем файл (POST /imports/preview) — backend ставит расшифровку
    // в очередь и возвращает import_id; дальше на экране «Расшифровка» polling.
    if (isAudio) {
      setAudioUploading(true);
      try {
        const formData = new FormData();
        files.forEach((file) => formData.append("file", file));
        formData.append("default_channel", channelValue);
        formData.append("redact_sensitive_data", String(masked));
        const res = await importPreviewAPI(formData);
        navigate(previewPath, { state: { importId: res.import_id } });
      } catch (error) {
        console.error("Ошибка загрузки аудио:", error);
      } finally {
        setAudioUploading(false);
      }
      return;
    }
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("file", file));
      // Маскирование ПДн: backend ждёт redact_sensitive_data ("true"/"false").
      // default_channel не отправляем — backend подставит дефолт по типу файла.
      formData.append("redact_sensitive_data", String(masked));
      await dispatch(importFiles(formData)).unwrap();
      navigate(previewPath);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    }
  };

  const audioRequirements: React.ReactNode[] = [
    "Формат: MP3, WAV, M4A",
    "Один файл за раз",
    "Максимальный размер: 25 МБ",
    "Файл должен содержать один разговор или звонок",
  ];

  const txtRequirements: React.ReactNode[] = [
    "Формат: TXT / Markdown",
    "Формат сообщений: Автор: текст сообщения",
    "Максимальный размер: 10 МБ",
  ];

  const csvRequirements: React.ReactNode[] = [
    "Формат: CSV (UTF-8)",
    "Максимальный размер: 5 МБ",
    <>
      Обязательные поля:
      <strong> ID диалога, автор сообщения, менеджер</strong>, дата, канал
      общения, текст сообщения, ID клиента
    </>,
  ];

  const requirements = isAudio
    ? audioRequirements
    : isTxt
      ? txtRequirements
      : csvRequirements;

  return (
    <UploadUI
      files={files}
      isDragging={isDragging}
      isLoading={isAudio ? audioUploading : importRequest}
      inputRef={inputRef}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        addFiles(e.dataTransfer.files);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onSelectClick={() => inputRef.current?.click()}
      onInputChange={(e) => e.target.files && addFiles(e.target.files)}
      onRemoveFile={removeFile}
      onNext={handleNext}
      // Скачивание шаблона: CSV → csv, TXT/Markdown → txt (аудио — без шаблона)
      handlerDownload={() =>
        downloadImportTemplateAPI(isTxt ? "txt" : "csv").catch((error) =>
          console.error("Не удалось скачать шаблон:", error)
        )
      }
      title={isAudio ? "Загрузка аудио" : "Загрузка файла"}
      description={
        isAudio
          ? "Перетащите аудио сюда или выберите его на компьютере"
          : "Перетащите файл сюда или выберите его на компьютере"
      }
      dropText={
        isAudio
          ? "Перетащите сюда аудио"
          : isTxt
            ? "Перетащите сюда файл TXT / Markdown"
            : "Перетащите сюда файл CSV"
      }
      selectLabel={isAudio ? "Выбрать аудиофайл" : "Выбрать файл"}
      accept={isAudio ? ".mp3,.wav,.m4a" : isTxt ? ".txt,.md,.markdown" : ".csv"}
      multiple={!singleFile}
      requirements={requirements}
      reqTitle={isAudio ? "Требование к аудиофайлу:" : "Требование к файлу:"}
      templateLabel={isTxt ? "Скачать пример TXT" : "Скачать шаблон CSV"}
      showTemplate={!isAudio}
      // Чекбокс маскирования — на всех экранах загрузки файла
      showMasking={true}
      masked={masked}
      onMaskedChange={setMasked}
      maskTooltip="Телефоны, email, паспортные данные, номера карт и другая чувствительная информация будет заменена на безопасные метки"
      // Дропдаун канала пока на экране аудио
      showChannel={isAudio}
      channelLabel="Канал по умолчанию"
      channelValue={channelValue}
      channelOptions={channels}
      onChannelChange={setChannelValue}
    />
  );
};
