import type { ReactNode } from "react";
import styles from "./AuthLayoutUI.module.css";
import line from "../../../assets/images/line.svg";
import link from "../../../assets/images/link.svg";
import logo from "../../../assets/images/DialogPulseLogo.svg";
import pie from "../../../assets/images/chart_Pie.svg";
import vector from "../../../assets/images/vector.svg";
import recomendation from "../../../assets/images/recomendation.svg";
import { GlowCard } from "../glowCard/glowCard";

type AuthLayoutUIProps = {
  children: ReactNode;
};

export function AuthLayoutUI({ children }: AuthLayoutUIProps) {
  return (
    <main className={styles.page}>
      <section>
        <div className={styles.header}>
          <div className={styles.container}>
            <span className={styles.logo}>
              <img
                height={37}
                width={40}
                src={logo}
                alt="DialogPulse AI Logo"
              />
            </span>
            <h1 className={styles.title}>DialogPulse AI</h1>
          </div>
          <p>DialogPulse AI — Аналитика диалогов на базе AI</p>
        </div>

        {children}
      </section>

      <section className={styles.infoSection}>
        <img
          height={170}
          width={277}
          src={line}
          alt="Линия графика"
          className={styles.lineDecoration}
        />
        <ul className={styles.infoList}>
          <li className={styles.infoItems}>
            <span className={styles.iconWrapper}>
              <img height={20} width={20} src={link} />
            </span>
            <p>AI-анализ переписки и звонков</p>
          </li>
          <li className={styles.infoItems}>
            <span className={styles.iconWrapper}>
              <img height={24} width={24} src={pie} />
            </span>
            <p>Причины потери заявок</p>
          </li>
          <li className={styles.infoItems}>
            <span className={styles.iconWrapper}>
              <img height={22} width={22} src={vector} />
            </span>
            <p>Выявление ошибок и возражений </p>
          </li>
          <li className={styles.infoItems}>
            <span className={styles.iconWrapper}>
              <img height={22} width={22} src={recomendation} />
            </span>
            <p>Рекомендации для роста команды</p>
          </li>
        </ul>
        <span className={styles.infoCard}>
          <GlowCard>
            Экономьте время руководителя и повышайте эффективность команды с
            DialogPulse AI
          </GlowCard>
        </span>
      </section>
    </main>
  );
}
