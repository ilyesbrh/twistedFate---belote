import { useState, type ReactElement } from "react";
import { MenuFelt } from "../MenuFelt/MenuFelt.js";
import type { ProfilePatch, PublicProfile, SelfProfile } from "../../online/api/profile.js";
import styles from "./ProfileScreen.module.css";

export interface ProfileScreenProps {
  readonly profile: PublicProfile | SelfProfile | null;
  readonly isSelf: boolean;
  readonly loading: boolean;
  readonly error: string | null;
  readonly onSave: (patch: ProfilePatch) => void;
  readonly onBack: () => void;
}

function isSelfProfile(p: PublicProfile | SelfProfile | null): p is SelfProfile {
  return p !== null && "email" in p;
}

export function ProfileScreen(props: ProfileScreenProps): ReactElement {
  const { profile, isSelf, loading, error, onSave, onBack } = props;
  const [editing, setEditing] = useState(false);
  const [draftNickname, setDraftNickname] = useState("");
  const [draftAvatarUrl, setDraftAvatarUrl] = useState("");

  const startEdit = (): void => {
    setDraftNickname(profile?.nickname ?? "");
    setDraftAvatarUrl(profile?.avatarUrl ?? "");
    setEditing(true);
  };

  const cancelEdit = (): void => {
    setEditing(false);
  };

  const save = (): void => {
    const patch: ProfilePatch = {};
    if (profile && draftNickname.trim() !== profile.nickname) {
      patch.nickname = draftNickname.trim();
    }
    if (profile && draftAvatarUrl !== (profile.avatarUrl ?? "")) {
      patch.avatarUrl = draftAvatarUrl.trim().length === 0 ? null : draftAvatarUrl.trim();
    }
    onSave(patch);
    setEditing(false);
  };

  const monogram = (profile?.nickname ?? "?").trim().slice(0, 1).toUpperCase();
  const joined = profile ? new Date(profile.createdAt).toLocaleDateString() : "";

  return (
    <MenuFelt className={styles.root}>
      <div data-testid="profile-screen" className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Profile</h1>
          <button
            type="button"
            className={styles.backBtn}
            data-testid="profile-back"
            onClick={onBack}
          >
            ← Back
          </button>
        </div>

        {error && (
          <div className={styles.error} data-testid="profile-error" role="alert">
            {error}
          </div>
        )}

        {loading || !profile ? (
          loading && (
            <div className={styles.loading} data-testid="profile-loading">
              Loading…
            </div>
          )
        ) : (
          <>
            <div className={styles.identity}>
              <div className={styles.avatar} aria-hidden="true">
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : monogram}
              </div>
              <div className={styles.nameBlock}>
                <span className={styles.nickname} data-testid="profile-nickname">
                  {profile.nickname}
                </span>
                {isSelfProfile(profile) && (
                  <span className={styles.email} data-testid="profile-email">
                    {profile.email}
                  </span>
                )}
              </div>
              {isSelf && !editing && (
                <button
                  type="button"
                  className={styles.editBtn}
                  data-testid="profile-edit"
                  onClick={startEdit}
                >
                  Edit
                </button>
              )}
            </div>

            <div className={styles.joined}>Joined {joined}</div>

            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statValue} data-testid="profile-stat-total">
                  {profile.stats.total}
                </span>
                <span className={styles.statLabel}>played</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue} data-testid="profile-stat-wins">
                  {profile.stats.wins}
                </span>
                <span className={styles.statLabel}>wins</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue} data-testid="profile-stat-winrate">
                  {profile.stats.total === 0
                    ? "—"
                    : `${String(Math.round(profile.stats.winRate * 100))}%`}
                </span>
                <span className={styles.statLabel}>win rate</span>
              </div>
            </div>

            {isSelf && editing && (
              <div className={styles.editForm}>
                <div className={styles.formRow}>
                  <label className={styles.label} htmlFor="profile-nickname-input">
                    Nickname
                  </label>
                  <input
                    id="profile-nickname-input"
                    data-testid="profile-nickname-input"
                    className={styles.input}
                    value={draftNickname}
                    maxLength={32}
                    onChange={(e) => {
                      setDraftNickname(e.target.value);
                    }}
                  />
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label} htmlFor="profile-avatar-input">
                    Avatar URL (optional)
                  </label>
                  <input
                    id="profile-avatar-input"
                    data-testid="profile-avatar-input"
                    className={styles.input}
                    value={draftAvatarUrl}
                    onChange={(e) => {
                      setDraftAvatarUrl(e.target.value);
                    }}
                    placeholder="https://…"
                  />
                </div>
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.primary}
                    data-testid="profile-save"
                    onClick={save}
                    disabled={draftNickname.trim().length === 0}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className={styles.cancel}
                    data-testid="profile-cancel-edit"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MenuFelt>
  );
}
