import { HashRouter, Route, Routes } from "react-router";
import { Compass } from "lucide-react";
import { AccountPage } from "./features/account/AccountPage";
import { AdminPage } from "./features/admin/AdminPage";
import { AuthProvider, RequireAuth, RequireRole } from "./features/auth/AuthProvider";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { DirectoryProvider } from "./features/catalog/DirectoryProvider";
import { HomePage } from "./features/items/HomePage";
import { ItemDetailPage } from "./features/items/ItemDetailPage";
import { ReportFoundPage } from "./features/report-found/ReportFoundPage";
import { ReportLostPage } from "./features/report-lost/ReportLostPage";
import { ButtonLink } from "./design-system/Button";
import { EmptyState } from "./design-system/Surface";
import { AppShell } from "./layout/AppShell";
import { useI18n } from "./i18n/useI18n";

function NotFoundPage() {
  const { t } = useI18n();
  return (
    <EmptyState
      icon={<Compass className="size-7" />}
      title={t.notFound.title}
      description={t.notFound.description}
      action={<ButtonLink to="/" className="mt-2">{t.common.backHome}</ButtonLink>}
    />
  );
}

export function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <DirectoryProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="items/:itemId" element={<ItemDetailPage />} />
              <Route path="report-found" element={<ReportFoundPage />} />
              <Route path="report-lost" element={<ReportLostPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="account" element={<RequireAuth><AccountPage /></RequireAuth>} />
              <Route path="admin" element={<RequireRole role="guard"><AdminPage /></RequireRole>} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </DirectoryProvider>
      </AuthProvider>
    </HashRouter>
  );
}
