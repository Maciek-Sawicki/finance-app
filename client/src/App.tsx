import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { UserSettingsProvider } from "./contexts/UserSettingsContext";
import { ThemeProvider } from "@/components/Theme/theme-provider";
import AppRouter from "./routes/AppRouter";
import { UserProvider } from "@/contexts/UserContext";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <UserSettingsProvider>
            <UserProvider>
              <AppRouter />
            </UserProvider>
          </UserSettingsProvider>
        </ThemeProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
