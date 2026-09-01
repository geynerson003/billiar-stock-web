import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import { AppProviders } from "./providers";
import { AppRoutes } from "./routes";

export function App() {
  return (
    <ErrorBoundary level="root">
      <AppProviders>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProviders>
    </ErrorBoundary>
  );
}
