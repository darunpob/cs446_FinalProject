import { HashRouter, Route, Routes } from "react-router";
import { Compass } from "lucide-react";
import { AdminPage } from "./features/admin/AdminPage";
import { AuthProvider, RequireRole } from "./features/auth/AuthProvider";
import { LoginPage } from "./features/auth/LoginPage";
import { DirectoryProvider } from "./features/catalog/DirectoryProvider";
import { HomePage } from "./features/items/HomePage";
import { ItemDetailPage } from "./features/items/ItemDetailPage";
import { ReportFoundPage } from "./features/report-found/ReportFoundPage";
import { ReportLostPage } from "./features/report-lost/ReportLostPage";
import { ButtonLink } from "./design-system/Button";
import { EmptyState } from "./design-system/Surface";
import { AppShell } from "./layout/AppShell";

function NotFoundPage() {
  return (
    <EmptyState
      icon={<Compass className="size-7" />}
      title="ไม่พบหน้านี้"
      description="ลิงก์อาจไม่ถูกต้อง หรือหน้านี้ถูกย้ายไปแล้ว"
      action={<ButtonLink to="/" variant="soft" className="mt-2">กลับหน้าแรก</ButtonLink>}
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
              <Route path="admin" element={<RequireRole role="guard"><AdminPage /></RequireRole>} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </DirectoryProvider>
      </AuthProvider>
    </HashRouter>
  );
}
