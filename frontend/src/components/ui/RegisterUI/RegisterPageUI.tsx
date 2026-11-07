import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { GlowCard } from "../glowCard/glowCard";

import styles from "./RegisterPageUI.module.css";
import { AuthLayoutUI } from "../AuthLayoutUI/AuthLayoutUI";
import { Link } from "react-router-dom";

type RegisterPageUIProps = {
  fullName: string;
  setFullName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  handleSubmit: (e: React.SyntheticEvent) => void;
  error?: string | null;
  loading: boolean;
};

export function RegisterPageUI({
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  handleSubmit,
  error,
  loading,
}: RegisterPageUIProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthLayoutUI>
      <GlowCard>
        <h1 className={styles.titleCard}>Добро пожаловать!</h1>
        <p className={styles.subtitle}>Создайте свой аккаунт</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="fullName" className={styles.label}>
              Имя Фамилия
            </label>
            <input
              id="fullName"
              name="fullName"
              className={styles.input}
              type="text"
              placeholder="Александра Петрова"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Почта
            </label>
            <input
              id="email"
              name="email"
              className={styles.input}
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Пароль
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="password"
                name="password"
                className={styles.input}
                type={showPassword ? "text" : "password"}
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <>
                Создаём… <Loader2 size={18} className={styles.spinner} />
              </>
            ) : (
              <>
                Создать <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className={styles.bottomLinks}>
          <Link to="/login" className={styles.loginLink}>
            Уже есть аккаунт? Войти
          </Link>
        </div>
      </GlowCard>
    </AuthLayoutUI>
  );
}
