import styles from "./importUI.module.css";
import tag from "../../../assets/images/tag-right.svg";
import { Link } from "react-router-dom";
import { GlowCard } from "../glowCard/glowCard";
import docIcon from "../../../assets/images/docicon.svg";
import recIcon from "../../../assets/images/recomendation.svg";
import penOnPaperIcon from "../../../assets/images/penonpaper.svg";
import recordsIcon from "../../../assets/images/reportsicon.svg";
import humanTalkIcon from "../../../assets/images/humantalk.svg";

export const ImportUI = () => {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Импорт диалогов</h1>
        <p className={styles.headerDescription}>
          Выберите удобный способ загрузки диалогов для анализа
        </p>
      </header>

      <section className={styles.section}>
        <Link to="/import/csv" className={styles.cardLink}>
          <GlowCard className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.cardIcon}>
                <img src={docIcon} alt="" />
              </span>

              <div className={`${styles.cardBadge}`}>
                <img src={recIcon} alt="" />
                <p>Рекомендуем</p>
              </div>
            </div>

            <h3 className={styles.cardTitle}>Загрузка CSV</h3>

            <p className={styles.cardDescription}>
              Загрузка CSV-файла с диалогами по нашему шаблону
            </p>

            <div className={styles.link}>
              Выбрать
              <span className={styles.icon}>
                <img src={tag} alt="" />
              </span>
            </div>
          </GlowCard>
        </Link>

        <Link to="/import/manualImport" className={styles.cardLink}>
          <GlowCard className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.cardIcon}>
                <img src={penOnPaperIcon} alt="" />
              </span>
              <div className={`${styles.cardBadge} ${styles.orange}`}>
                <img src={recIcon} alt="" />
                <p>Быстрый тест</p>
              </div>
            </div>
            <h3 className={styles.cardTitle}>Ручная вставка</h3>

            <p className={styles.cardDescription}>
              Скопируйте и вставьте текст диалога в формате Клиент: / Менеджер:
            </p>

            <div className={styles.link}>
              Выбрать
              <span className={styles.icon}>
                <img src={tag} alt="" />
              </span>
            </div>
          </GlowCard>
        </Link>

        <Link to="/import/txt" className={styles.cardLink}>
          <GlowCard className={styles.card}>
            <span className={styles.cardIcon}>
              <img src={recordsIcon} alt="" />
            </span>

            <h3 className={styles.cardTitle}>TXT / Markdown</h3>

            <p className={styles.cardDescription}>
              Загрузите текстовые файлы с одним или несколькими диалогами
            </p>

            <div className={styles.link}>
              Выбрать
              <span className={styles.icon}>
                <img src={tag} alt="" />
              </span>
            </div>
          </GlowCard>
        </Link>

        <Link to="/import/audio" className={styles.cardLink}>
          <GlowCard className={styles.card}>
            <span className={styles.cardIcon}>
              <img src={humanTalkIcon} alt="" />
            </span>

            <h3 className={styles.cardTitle}>Аудио</h3>

            <p className={styles.cardDescription}>Загрузите аудио</p>

            <div className={styles.link}>
              Выбрать
              <span className={styles.icon}>
                <img src={tag} alt="" />
              </span>
            </div>
          </GlowCard>
        </Link>
      </section>
    </div>
  );
};
