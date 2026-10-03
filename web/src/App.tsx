import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Shell } from "./components/Shell";
import { JoinPage } from "./pages/JoinPage";
import { LabPage } from "./pages/LabPage";
import { LabsPage } from "./pages/LabsPage";
import { ProjectPage } from "./pages/ProjectPage";
import { ResumePage } from "./pages/ResumePage";
import { TeachPage } from "./pages/TeachPage";
import { SessionProvider } from "./session";
import { useUiLang } from "./ui-lang";

function HomeRedirect() {
  const { search } = useLocation();
  const mock = new URLSearchParams(search).get("mock") === "1";
  return <Navigate to={mock ? "/?mock=1" : "/"} replace />;
}

function DocumentLang({ children }: { children: ReactNode }) {
  useUiLang();
  return children;
}

export function App() {
  return (
    <BrowserRouter>
      <DocumentLang>
        <SessionProvider>
          <Routes>
            <Route element={<Shell />}>
              <Route path="/" element={<JoinPage />} />
              <Route path="/resume" element={<ResumePage />} />
              <Route path="/labs" element={<LabsPage />} />
              <Route path="/labs/:labId" element={<LabPage />} />
              <Route path="/teach" element={<TeachPage />} />
              <Route path="/teach/:classCode/project" element={<ProjectPage />} />
              <Route path="*" element={<HomeRedirect />} />
            </Route>
          </Routes>
        </SessionProvider>
      </DocumentLang>
    </BrowserRouter>
  );
}
