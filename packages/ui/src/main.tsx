import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./index.css";
import App from "./App.tsx";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Theme accentColor="teal" grayColor="slate" appearance="dark" radius="medium" scaling="100%">
      <App />
    </Theme>
  </StrictMode>,
);
