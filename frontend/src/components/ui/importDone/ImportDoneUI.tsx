import styles from "./ImportDoneUI.module.css";
import tag from "../../../assets/images/arrow.svg";
import { Link } from "react-router-dom";
import { GlowCard } from "../glowCard/glowCard";
import { Check } from "lucide-react";

export type StatItem = {
  value: number;
  label: string;
  isError?: boolean;
};

export type ActionCard = {
  // Навигационная карточка задаёт to (Link); карточка-действие — onClick (button)
  to?: string;
  onClick?: () => void;
  icon: string;
  title: string;
  description: string;
};

type ImportDoneUIProps = {
  title: string;
  description: string;
  stats: StatItem[];
  actionCards: ActionCard[];
  onUploadMore: () => void;
};

export const ImportDoneUI = ({
  title,
  description,
  stats,
  actionCards,
  onUploadMore,
}: ImportDoneUIProps) => {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <header className={styles.header}>
          <span className={styles.checkBadge}>
            <Check />
          </span>
          <div className={styles.headerText}>
            <h1 className={styles.h1}>{title}</h1>
            <p className={styles.description}>{description}</p>
          </div>
        </header>

        {stats.length > 0 && (
          <div className={styles.statsRow}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.statItem}>
                <span
                  className={`${styles.statValue} ${stat.isError ? styles.statValueError : ""}`}
                >
                  {stat.value.toLocaleString("ru-RU")}
                </span>
                <span
                  className={`${styles.statLabel} ${stat.isError ? styles.statLabelError : ""}`}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {actionCards.length > 0 && (
          <section className={styles.section}>
            <p className={styles.sectionTitle}>Куда дальше?</p>

            <div className={styles.cardsRow}>
              {actionCards.map((action) => {
                const inner = (
                  <GlowCard className={styles.card}>
                    <span className={styles.cardIcon}>
                      <img src={action.icon} alt="" />
                    </span>
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{action.title}</h3>
                      <div className={styles.wrapper}>
                        <p className={styles.cardDescription}>
                          {action.description}
                        </p>
                        <span className={styles.cardArrow}>
                          <img src={tag} alt="" />
                        </span>
                      </div>
                    </div>
                  </GlowCard>
                );

                return action.onClick ? (
                  <button
                    key={action.title}
                    type="button"
                    className={`${styles.cardLink} ${styles.cardButton}`}
                    onClick={action.onClick}
                  >
                    {inner}
                  </button>
                ) : (
                  <Link
                    key={action.to}
                    to={action.to ?? "/"}
                    className={styles.cardLink}
                  >
                    {inner}
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <button
        className={styles.uploadMoreBtn}
        onClick={onUploadMore}
        type="button"
      >
        Загрузить еще файл
      </button>
    </div>
  );
};
