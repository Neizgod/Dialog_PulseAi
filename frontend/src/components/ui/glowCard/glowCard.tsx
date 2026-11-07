import type { ReactNode } from "react";
import styles from "./glowCard.module.css";

type GlowCardProps = {
  children: ReactNode;
  className?: string;
};

export const GlowCard = ({ children, className = '' }: GlowCardProps) => {
  return (
    <div className={styles.glowBorder }>
      <div className={`${styles.card} ${className}`}>{children}</div>
    </div>
  );
};
