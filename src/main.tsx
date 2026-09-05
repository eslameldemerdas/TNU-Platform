import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/common/ErrorPages.tsx";
import { LanguageProvider } from "./i18n/LanguageContext.tsx";
import { registerServiceWorker } from "./swRegister.ts";
import "./index.css";

// Ensure any previous service workers are unregistered
registerServiceWorker();

// Apply the persisted theme before React mounts to avoid a light-mode flash.
try {
  const savedTheme = window.localStorage.getItem("enghub_theme");
  if (savedTheme === "dark" || savedTheme === "light") {
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  } else {
    document.documentElement.classList.add("dark");
  }
} catch {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);
