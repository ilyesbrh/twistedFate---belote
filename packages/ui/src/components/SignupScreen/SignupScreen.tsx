import { useState, type ReactElement } from "react";
import { MenuFelt } from "../MenuFelt/MenuFelt.js";
import { authErrorMessage } from "../../auth/messages.js";
import type { AuthApiError, SignupInput } from "../../auth/api.js";
import styles from "./SignupScreen.module.css";

export interface SignupScreenProps {
  readonly error: AuthApiError | null;
  readonly loading: boolean;
  readonly onSubmit: (input: SignupInput) => void;
  readonly onGotoLogin: () => void;
  readonly onCancel: () => void;
}

const MIN_PASSWORD = 8;
const NICKNAME_MAX = 32;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupScreen(props: SignupScreenProps): ReactElement {
  const { error, loading, onSubmit, onGotoLogin, onCancel } = props;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  const trimmedNickname = nickname.trim();
  const canSubmit =
    EMAIL_RE.test(email) &&
    password.length >= MIN_PASSWORD &&
    trimmedNickname.length > 0 &&
    trimmedNickname.length <= NICKNAME_MAX &&
    !loading;

  const handleSubmit = (e: { preventDefault: () => void }): void => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ email, password, nickname: trimmedNickname });
  };

  return (
    <MenuFelt className={styles.root}>
      <form data-testid="signup-screen" className={styles.card} onSubmit={handleSubmit} noValidate>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>— join the table —</p>

        {error && (
          <div className={styles.error} data-testid="signup-error" role="alert">
            {authErrorMessage(error.code)}
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="signup-email">
            Email
          </label>
          <input
            id="signup-email"
            data-testid="signup-email"
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
          <label className={styles.label} htmlFor="signup-password">
            Password
          </label>
          <input
            id="signup-password"
            data-testid="signup-password"
            type="password"
            className={styles.input}
            value={password}
            autoComplete="new-password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            disabled={loading}
          />
          <span className={styles.hint}>At least 8 characters.</span>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="signup-nickname">
            Nickname
          </label>
          <input
            id="signup-nickname"
            data-testid="signup-nickname"
            type="text"
            className={styles.input}
            value={nickname}
            autoComplete="nickname"
            maxLength={NICKNAME_MAX}
            onChange={(e) => {
              setNickname(e.target.value);
            }}
            disabled={loading}
          />
          <span className={styles.hint}>This is what other players will see.</span>
        </div>

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primary}
            data-testid="signup-submit"
            data-touch="primary"
            disabled={!canSubmit}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
          <button
            type="button"
            className={styles.secondary}
            data-testid="signup-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>

        <div className={styles.altRow}>
          Already have an account?{" "}
          <button
            type="button"
            className={styles.secondary}
            data-testid="signup-goto-login"
            onClick={onGotoLogin}
          >
            Sign in
          </button>
        </div>
      </form>
    </MenuFelt>
  );
}
