import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/common/ErrorPages.tsx";
import { LanguageProvider } from "./i18n/LanguageContext.tsx";
import { registerServiceWorker } from "./swRegister.ts";
import "./index.css";

// Ensure any previous service workers are unregistered
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);
