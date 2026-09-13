import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

try {
  registerSW({
    immediate: true,
    onRegisterError(error) {
      console.error("Errore Service Worker:", error);
    }
  });
} catch (error) {
  console.error("Service Worker non disponibile:", error);
}
