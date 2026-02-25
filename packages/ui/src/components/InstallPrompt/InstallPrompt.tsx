import { useEffect, useState, useCallback, type ReactElement } from "react";
import styles from "./InstallPrompt.module.css";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "belote-install-dismissed";

export function InstallPrompt(): ReactElement | null {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if user already dismissed or if already installed
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDeferredPrompt(null);
    localStorage.setItem(DISMISSED_KEY, "1");
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <img
          src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
          alt=""
          className={styles.icon}
          draggable={false}
        />
        <div className={styles.text}>
          <strong className={styles.title}>Install Belote</strong>
          <span className={styles.subtitle}>Add to home screen for the best experience</span>
        </div>
      </div>
      <div className={styles.actions}>
        <button className={styles.installBtn} onClick={handleInstall}>
          Install
        </button>
        <button className={styles.dismissBtn} onClick={handleDismiss} aria-label="Dismiss">
          Not now
        </button>
      </div>
    </div>
  );
}
