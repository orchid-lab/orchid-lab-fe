import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Method from "./pages/Method";
import Tasks from "./pages/Tasks";
import ExperimentLog from "./pages/ExperimentLog";
import Seedlings from "./pages/Seedlings";
import Reports from "./pages/Reports";
import SeedlingDetail from "./pages/SeedlingDetail";
import SeedlingDetailsForm from "./pages/SeedlingDetailsForm";
import SeedlingCharacteristicsForm from "./pages/SeedlingCharacteristicsForm";
import SeedlingSummary from "./pages/SeedlingSummary";
import { SeedlingFormProvider } from "./context/SeedlingFormContext";

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-8">
            <Routes>
              <Route path="/" element={<Navigate to="/method" replace />} />
              <Route path="/method" element={<Method />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/experiment-log" element={<ExperimentLog />} />
              <Route path="/seedlings" element={<Seedlings />} />
              <Route path="/seedlings/:id" element={<SeedlingDetail />} />
              <Route
                path="/seedlings/new/*"
                element={
                  <SeedlingFormProvider>
                    <Routes>
                      <Route path="" element={<SeedlingDetailsForm />} />
                      <Route
                        path="characteristics"
                        element={<SeedlingCharacteristicsForm />}
                      />
                      <Route path="summary" element={<SeedlingSummary />} />
                    </Routes>
                  </SeedlingFormProvider>
                }
              />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
