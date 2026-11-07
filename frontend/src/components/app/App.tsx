import "../../styles/variables.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { Login } from "../pages/login";
import { ProtectedRoute } from "../protectedRoute/protectedRoute";
import { Layout } from "../pages/layout/layout";
import { Import } from "../pages/import";
import { CsvImportLayout } from "../pages/CsvImportLayout/CsvImportLayout";
import { CsvUpload } from "../pages/csvUpload";
import { CsvPreview } from "../pages/csvPreview";
import { TxtPreview } from "../pages/TxtPreview";
import { TxtRoles } from "../pages/TxtRoles";
import { TxtConfirm } from "../pages/TxtConfirm";
import { AudioTranscribe } from "../pages/AudioTranscribe";
import { AudioPreview } from "../pages/AudioPreview";
import { ManualImport } from "../pages/ManualImport";
import { ColumnMapping } from "../pages/ColumnMapping";
import { RoleMapping } from "../pages/RoleMapping";
import { Confirm } from "../pages/Confirm";
import { Background } from "../pages/Background/background";
import { ImportDone } from "../pages/ImportDone";
import { Register } from "../pages/Register";
import { useEffect, lazy, Suspense } from "react";
import { getCookie } from "../../utils/cookie";
import { useAppDispatch } from "../../services/store";
import { authUser } from "../../services/slices/userSlice";

// Тяжёлые экраны грузим лениво (code-splitting): большие UI-файлы (дашборд,
// диалоги, отчёты, загрузки) выносятся в отдельные чанки и не тянутся в
// начальный бандл. Шаги мастера импорта оставляем eager — они лёгкие и часто
// переключаются внутри одного флоу.
const Dashboard = lazy(() =>
  import("../pages/Dashboard").then((m) => ({ default: m.Dashboard }))
);
const Dialogs = lazy(() =>
  import("../pages/Dialogs").then((m) => ({ default: m.Dialogs }))
);
const DialogCard = lazy(() =>
  import("../pages/DialogCard").then((m) => ({ default: m.DialogCard }))
);
const Reports = lazy(() =>
  import("../pages/Reports").then((m) => ({ default: m.Reports }))
);
const Managers = lazy(() =>
  import("../pages/Managers").then((m) => ({ default: m.Managers }))
);
const Imports = lazy(() =>
  import("../pages/Imports").then((m) => ({ default: m.Imports }))
);
const DownloadDetail = lazy(() =>
  import("../pages/DownloadDetail").then((m) => ({ default: m.DownloadDetail }))
);
const AiSettings = lazy(() =>
  import("../pages/AiSettings").then((m) => ({ default: m.AiSettings }))
);

function App() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (getCookie("accessToken")) dispatch(authUser());
  }, []);
  return (
    <Suspense fallback={null}>
      <Routes>
      <Route
        element={
          <ProtectedRoute onlyUnAuth>
            <Background />
          </ProtectedRoute>
        }
      >
        <Route
          path="/login"
          element={
            <ProtectedRoute onlyUnAuth>
              <Login />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register"
          element={
            <ProtectedRoute onlyUnAuth>
              <Register />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
        path="/"
      >
        <Route index element={<Navigate to="/import" replace />} />
        <Route
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
          path="/dashboard"
        />
        <Route
          element={
            <ProtectedRoute>
              <Managers />
            </ProtectedRoute>
          }
          path="/dashboard/managers"
        />
        <Route
          path="/import"
          element={
            <ProtectedRoute>
              <Import />
            </ProtectedRoute>
          }
        />
        <Route
          path="/import/csv"
          element={
            <ProtectedRoute>
              <CsvImportLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <ProtectedRoute>
                <CsvUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="preview"
            element={
              <ProtectedRoute>
                <CsvPreview />
              </ProtectedRoute>
            }
          />
          <Route
            path="mapping"
            element={
              <ProtectedRoute>
                <ColumnMapping />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles"
            element={
              <ProtectedRoute>
                <RoleMapping />
              </ProtectedRoute>
            }
          />
          <Route
            path="confirm"
            element={
              <ProtectedRoute>
                <Confirm />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/import/txt"
          element={
            <ProtectedRoute>
              <CsvImportLayout kind="txt" />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <ProtectedRoute>
                <CsvUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="preview"
            element={
              <ProtectedRoute>
                <TxtPreview />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles"
            element={
              <ProtectedRoute>
                <TxtRoles />
              </ProtectedRoute>
            }
          />
          <Route
            path="confirm"
            element={
              <ProtectedRoute>
                <TxtConfirm />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/import/manualImport"
          element={
            <ProtectedRoute>
              <ManualImport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/import/audio"
          element={
            <ProtectedRoute>
              <CsvImportLayout kind="audio" />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <ProtectedRoute>
                <CsvUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="transcribe"
            element={
              <ProtectedRoute>
                <AudioTranscribe />
              </ProtectedRoute>
            }
          />
          <Route
            path="preview"
            element={
              <ProtectedRoute>
                <AudioPreview />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles"
            element={
              <ProtectedRoute>
                <TxtRoles />
              </ProtectedRoute>
            }
          />
          <Route
            path="confirm"
            element={
              <ProtectedRoute>
                <TxtConfirm />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <ImportDone />
            </ProtectedRoute>
          }
          path="/import/done"
        />

        <Route
          element={
            <ProtectedRoute>
              <Dialogs />
            </ProtectedRoute>
          }
          path="/dialogs"
        />
        <Route
          element={
            <ProtectedRoute>
              <DialogCard />
            </ProtectedRoute>
          }
          path="/dialogs/:id"
        />
        <Route
          element={
            <ProtectedRoute>
              <Imports />
            </ProtectedRoute>
          }
          path="/downloads"
        />
        <Route
          element={
            <ProtectedRoute>
              <DownloadDetail />
            </ProtectedRoute>
          }
          path="/downloads/:id"
        />
        <Route
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
          path="/reports"
        />
        <Route
          element={
            <ProtectedRoute>
              <Managers />
            </ProtectedRoute>
          }
          path="/reports/managers"
        />
        <Route
          element={
            <ProtectedRoute adminOnly>
              <AiSettings />
            </ProtectedRoute>
          }
          path="/settings"
        />
      </Route>
    </Routes>
    </Suspense>
  );
}

export default App;
