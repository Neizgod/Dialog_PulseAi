import { useState, type SyntheticEvent } from "react";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { GlowCard } from "../glowCard/glowCard";

import styles from "./loginPageUI.module.css";
import { AuthLayoutUI } from "../AuthLayoutUI/AuthLayoutUI";
import { Link } from "react-router-dom";

interface LoginPageUIProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  handleSubmit: (e: SyntheticEvent) => void;
  error: string | null;
  loading: boolean;
}

export function LoginPageUI({
  password,
  setPassword,
  email,
  setEmail,
  handleSubmit,
  error,
  loading,
}: LoginPageUIProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthLayoutUI>
      <GlowCard>
        <h1 className={styles.titleCard}>Добро пожаловать!</h1>
        <p className={styles.subtitle}>Войдите в свой аккаунт</p>

        <form className={styles.form} onSubmit={handleSubmit}>
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
                Входим… <Loader2 size={18} className={styles.spinner} />
              </>
            ) : (
              <>
                Войти <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className={styles.bottomLinks}>
          <span aria-hidden="true" />
          <Link to="/Register" className={styles.registerLink}>
            Зарегистрироваться
          </Link>
        </div>
      </GlowCard>
    </AuthLayoutUI>
  );
}
