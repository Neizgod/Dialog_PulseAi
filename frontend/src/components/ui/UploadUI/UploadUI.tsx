import styles from "./UploadUI.module.css";
import cloudIcon from "../../../assets/images/importsicon.svg";
import download from "../../../assets/images/dowloadarrow.svg";
import arrow from "../../../assets/images/arrow.svg";
import basket from "../../../assets/images/basket.svg";
import reportIcon from "../../../assets/images/reportsicon.svg";
import { formatFileSize } from "../../../utils/utils";
import { Dropdown } from "../Dropdown/Dropdown";

interface Props {
  files: File[];
  isDragging: boolean;
  isLoading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onSelectClick: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (name: string) => void;
  onNext: () => void;
  handlerDownload: () => void;
  // Конфигурация под тип импорта (CSV / TXT-Markdown / аудио)
  title: string; // заголовок экрана
  description: string; // подпись под заголовком
  dropText: string; // текст в дроп-зоне
  selectLabel: string; // текст кнопки выбора файла
  accept: string; // значение input[accept]
  multiple: boolean; // разрешать выбор нескольких файлов
  requirements: React.ReactNode[]; // список требований к файлу
  reqTitle: string; // заголовок блока требований
  templateLabel: string; // текст кнопки шаблона/примера
  showTemplate: boolean; // показывать ли кнопку шаблона/примера
  // Маскирование персональных данных (пока только UI, в API не отражено)
  showMasking: boolean; // показывать ли чекбокс маскирования
  masked: boolean; // состояние чекбокса
  onMaskedChange: (value: boolean) => void;
  maskTooltip: string; // текст всплывающей подсказки у «?»
  // Канал импорта (GET /imports/channels) — под списком файлов
  showChannel: boolean; // показывать ли дропдаун канала
  channelLabel: string; // подпись у дропдауна
  channelValue: string; // выбранное значение (default_channel)
  channelOptions: { value: string; label: string }[];
  onChannelChange: (value: string) => void;
}

export const UploadUI = ({
  files,
  isDragging,
  isLoading,
  inputRef,
  onDrop,
  onDragOver,
  onDragLeave,
  onSelectClick,
  onInputChange,
  onRemoveFile,
  onNext,
  handlerDownload,
  title,
  description,
  dropText,
  selectLabel,
  accept,
  multiple,
  requirements,
  reqTitle,
  templateLabel,
  showTemplate,
  showMasking,
  masked,
  onMaskedChange,
  maskTooltip,
  showChannel,
  channelLabel,
  channelValue,
  channelOptions,
  onChannelChange,
}: Props) => {
  const hasFiles = files.length > 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>{title}</h1>
        <p className={styles.description}>{description}</p>
      </header>

      <div className={styles.dropZoneWrapper}>
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dragging : ""}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <img src={cloudIcon} className={styles.cloudIcon} alt="" />
          <p className={styles.dropText}>{dropText}</p>
          <p className={styles.orText}>или</p>
          <button className={styles.selectBtn} onClick={onSelectClick}>
            {selectLabel}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            style={{ display: "none" }}
            onChange={onInputChange}
          />
        </div>

        {hasFiles && (
          <div
            className={`${styles.rightPane} ${
              showChannel ? styles.rightPaneWithChannel : ""
            }`}
          >
            <div className={`${styles.fileList} customScroll`}>
              <p className={styles.fileListTitle}>Загруженные файлы</p>
              {files.map((file) => (
                <div key={file.name} className={styles.fileItem}>
                  <span>
                    <img src={reportIcon} alt="" />
                  </span>
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{file.name}</span>
                    <span className={styles.fileSize}>
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => onRemoveFile(file.name)}
                    aria-label="Удалить файл"
                  >
                    <img src={basket} alt="" />
                  </button>
                </div>
              ))}
            </div>

            {/* Канал по умолчанию — сразу под списком файлов */}
            {showChannel && (
              <div className={styles.channelBox}>
                <span className={styles.channelLabel}>{channelLabel}</span>
                <Dropdown
                  value={channelValue}
                  options={channelOptions}
                  onChange={onChannelChange}
                  placeholder="Выберите канал"
                  className={styles.channelSelect}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.requirements}>
          <p className={styles.reqTitle}>{reqTitle}</p>
          <ul className={styles.reqList}>
            {requirements.map((req, i) => (
              <li key={i}>{req}</li>
            ))}
          </ul>
        </div>
        <div className={styles.buttonsWrapper}>
          {showTemplate ? (
            <button className={styles.templateBtn} onClick={handlerDownload}>
              <span>
                <img src={download} alt="" />
              </span>
              <p>{templateLabel}</p>
            </button>
          ) : (
            // Пустой спейсер, чтобы justify-content: space-between держал «Далее» справа
            <span />
          )}
          <div className={styles.rightControls}>
            {showMasking && hasFiles && (
              <div className={styles.maskControl}>
                <input
                  type="checkbox"
                  id="maskPii"
                  className={styles.maskCheckbox}
                  checked={masked}
                  onChange={(e) => onMaskedChange(e.target.checked)}
                />
                <label htmlFor="maskPii" className={styles.maskLabel}>
                  Маскировать персональные данные перед анализом
                </label>
                <span className={styles.helpWrap}>
                  <span className={styles.helpIcon}>?</span>
                  <span className={styles.tooltip} role="tooltip">
                    {maskTooltip}
                  </span>
                </span>
              </div>
            )}
            <div className={styles.actions}>
              <button
                className={styles.nextBtn}
                disabled={!hasFiles || isLoading}
                onClick={onNext}
              >
                {isLoading ? (
                  "Загрузка..."
                ) : (
                  <>
                    Далее
                    <span>
                      <img src={arrow} alt="" />
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
