import { useState, type ReactElement } from "react";
import { MenuFelt } from "../MenuFelt/MenuFelt.js";
import { authErrorMessage } from "../../auth/messages.js";
import type { AuthApiError, LoginInput } from "../../auth/api.js";
import styles from "./LoginScreen.module.css";

export interface LoginScreenProps {
  readonly error: AuthApiError | null;
  readonly loading: boolean;
  readonly onSubmit: (input: LoginInput) => void;
  readonly onGotoSignup: () => void;
  readonly onCancel: () => void;
}

export function LoginScreen(props: LoginScreenProps): ReactElement {
  const { error, loading, onSubmit, onGotoSignup, onCancel } = props;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = email.length > 0 && password.length > 0 && !loading;

  const handleSubmit = (e: { preventDefault: () => void }): void => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ email, password });
  };

  return (
    <MenuFelt className={styles.root}>
      <form data-testid="login-screen" className={styles.card} onSubmit={handleSubmit} noValidate>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>— sign in to continue —</p>

        {error && (
          <div className={styles.error} data-testid="login-error" role="alert">
            {authErrorMessage(error.code)}
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            data-testid="login-email"
            type="email"
            className={styles.input}
            value={email}
            autoComplete="email"
            inputMode="email"
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            disabled={loading}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            data-testid="login-password"
            type="password"
            className={styles.input}
            value={password}
            autoComplete="current-password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            disabled={loading}
          />
        </div>

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primary}
            data-testid="login-submit"
            data-touch="primary"
            disabled={!canSubmit}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <button
            type="button"
            className={styles.secondary}
            data-testid="login-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>

        <div className={styles.altRow}>
          New here?{" "}
          <button
            type="button"
            className={styles.secondary}
            data-testid="login-goto-signup"
            onClick={onGotoSignup}
          >
            Create an account
          </button>
        </div>
      </form>
    </MenuFelt>
  );
}
