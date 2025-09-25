import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AppRouter from "./routes/AppRouter";
import { ThemeProvider } from "@/components/Theme/theme-provider";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <AppRouter />
        </ThemeProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
