/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import TopbarAdmin from "./components/TopbarAdmin";
import TopbarResearcher from "./components/TopbarResearcher";
import TopbarTechnician from "./components/TopbarTechnician";
import Method from "./pages/researcher/method/Method";
import Tasks from "./pages/researcher/task/Tasks";
import ExperimentLog from "./pages/researcher/experimentlog/ExperimentLog";
import Seedlings from "./pages/researcher/seeding/Seedlings";
import SeedlingDetail from "./pages/researcher/seeding/SeedlingDetail";
import SeedlingCreate from "./pages/researcher/seeding/create/CreateSeedling";
import UpdateSeedling from "./pages/researcher/seeding/create/UpdateSeedling";
import ResearcherSampleDetail from "./pages/researcher/sample/SampleDetail";
import ReportsDetails from "./pages/researcher/report/ReportsDetails";
import ReportsFollowUpDetails from "./pages/researcher/report/ReportsFollowUpDetails";
import CreateTaskContainer from "./pages/researcher/task/create/CreateTaskContainer";
import SelectTechnicianContainer from "./pages/researcher/task/create/SelectTechnicianContainer";
import ConfirmTaskContainer from "./pages/researcher/task/create/ConfirmTaskContainer";
import TaskDetailPage from "./pages/researcher/task/TaskDetailPage";
import CreateExperimentStep1 from "./pages/researcher/experimentlog/create/CreateExperimentStep1";
import CreateExperimentStep2 from "./pages/researcher/experimentlog/create/CreateExperimentStep2";
import CreateExperimentStep3 from "./pages/researcher/experimentlog/create/CreateExperimentStep3";
import { ExperimentLogFormProvider } from "./context/ExperimentLogFormContext";
import ProfilePage from "./pages/landing/ProfilePage";
import MethodDetail from "./pages/researcher/method/MethodDetail";
import MethodCreate from "./pages/researcher/method/MethodCreate";
import ExperimentLogDetail from "./pages/researcher/experimentlog/ExperimentLogDetail";
import SidebarAdmin from "./components/SidebarAdmin";
import Login from "./pages/landing/Login";
import DashboardAdmin from "./pages/admin/dashboard/DashboardAdmin";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Unauthorized from "./pages/landing/Unauthorized";
import { CreateTaskProvider } from "./context/CreateTaskContext";
import TaskTemplateList from "./pages/researcher/task/template/TaskTemplateList";
import TaskTemplateCreate from "./pages/researcher/task/template/create/TaskTemplateCreate";
import TaskTemplateDetail from "./pages/researcher/task/template/TaskTemplateDetail";
import { SnackbarProvider } from "notistack";
import ReportsCreate from "./pages/technician/report/ReportsCreate";
import ReportList from "./pages/researcher/report/Reports";
import ReportsTechnician from "./pages/technician/report/Reports";
import SidebarTechnician from "./components/SidebarTechnician";
import ListTask from "./pages/technician/task/listTask";
import { ThemeProvider } from "./context/ThemeContext";
import TechDetailTask from "./pages/technician/task/TechDetailTask";
import ListSample from "./pages/technician/sample/ListSample";
import TechDetailSample from "./pages/technician/sample/TechDetailSample";
import AdminTasks from "./pages/admin/task/AdminTasks";
import AdminTaskDetail from "./pages/admin/task/AdminTaskDetail";
import AdminExperimentLog from "./pages/admin/experimentlog/AdminExperimentLog";
import AdminExperimentLogDetail from "./pages/admin/experimentlog/AdminExperimentLogDetail";
import AdminSeedlings from "./pages/admin/seeding/AdminSeedlings";
import AdminSeedlingDetail from "./pages/admin/seeding/AdminSeedlingDetail";
import AdminMethodDetail from "./pages/admin/method/AdminMethodDetail";
import AdminMethod from "./pages/admin/method/AdminMethod";
import AdminReport from "./pages/admin/report/AdminReports";
import AdminReportsDetails from "./pages/admin/report/AdminReportsDetails";
import AdminElement from "./pages/admin/element/AdminElement";
import AdminTissueCultureBatchList from "./pages/admin/tissueculturebatch/AdminTissueCultureBatchList";
import AdminTissueCultureBatchCreate from "./pages/admin/tissueculturebatch/AdminTissueCultureBatchCreate";
import AdminTissueCultureBatchDetail from "./pages/admin/tissueculturebatch/AdminTissueCultureBatchDetail";
import AdminConfig from "./pages/admin/config/AdminConfig";
import TechnicianExperimentLogDetail from "./pages/technician/experimentlog/TechnicianExperimentLogDetail";
import TechnicianExperimentLog from "./pages/technician/experimentlog/TechnicianExperimentLog";
import TechnicianBatchList from "./pages/technician/batch/TechnicianBatchList";
import TechnicianBatchDetail from "./pages/technician/batch/TechnicianBatchDetail";
import { NotificationProvider } from "./context/NotificationContext";
import Sidebar from "./components/Sidebar";
import MonitoringLogDetail from "./pages/technician/report/MonitoringLogDetail";
import ReportCreate from "./pages/researcher/report/ReportCreate";

function getUserRole(user: any): string {
  const roleValue = user?.role ?? user?.Role;
  if (roleValue && typeof roleValue === "string") {
    return roleValue.toLowerCase().trim();
  }

  switch (user?.roleId) {
    case 1:
      return "admin";
    case 2:
      return "researcher";
    case 3:
      return "lab technician";
    default:
      return "researcher";
  }
}

function AppLayout() {
  const { user, isAuthReady } = useAuth();
  const location = useLocation();

  const isLoginPage = location.pathname === "/login";
  const isUnauthorizedPage = location.pathname === "/unauthorized";

  if (!isAuthReady) {
    return <div>Đang tải...</div>;
  }

  const userRole = getUserRole(user);

  let sidebar = <SidebarTechnician />;
  let topbar = <TopbarTechnician />;

  if (userRole === "admin") {
    sidebar = <SidebarAdmin />;
    topbar = <TopbarAdmin />;
  } else if (userRole === "researcher") {
    sidebar = <Sidebar />;
    topbar = <TopbarResearcher />;
  } else if (userRole === "lab technician") {
    sidebar = <SidebarTechnician />;
    topbar = <TopbarTechnician />;
  }

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isUnauthorizedPage) {
    return <Unauthorized />;
  }

  return (
    <div className="flex bg-gray-100 dark:bg-gray-900">
      {sidebar}
      <div className="flex-1 flex flex-col">
        {topbar}
        <main className="flex-1 p-8">
          <Routes>
            <Route
              path="/admin/tissue-culture-batches"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminTissueCultureBatchList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tissue-culture-batches/create"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminTissueCultureBatchCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tissue-culture-batches/:id"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminTissueCultureBatchDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/user"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <DashboardAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/method"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <Method />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <Navigate to="/researcher/tasks" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/method/:id"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <MethodDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/method/new"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <MethodCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/tasks"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <Tasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/experiment-log"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <ExperimentLog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/seedlings"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <Seedlings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/seedlings/create"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <SeedlingCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/seedlings/update/:id"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <UpdateSeedling />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/seedlings/:id"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <SeedlingDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/samples/:id"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <ResearcherSampleDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/reports"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <ReportList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/reports-create"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <ReportCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/technician/experiment-log"
              element={
                <ProtectedRoute requiredRole="Lab Technician">
                  <TechnicianExperimentLog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/technician/experiment-log/:id"
              element={
                <ProtectedRoute requiredRole="Lab Technician">
                  <TechnicianExperimentLogDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/technician/tasks"
              element={
                <ProtectedRoute requiredRole="Lab Technician">
                  <ListTask />
                </ProtectedRoute>
              }
            />
            <Route
              path="/technician/samples"
              element={
                <ProtectedRoute requiredRole="Lab Technician">
                  <ListSample />
                </ProtectedRoute>
              }
            />
            <Route
              path="/technician/reports"
              element={
                <ProtectedRoute requiredRole="Lab Technician">
                  <ReportsTechnician />
                </ProtectedRoute>
              }
            />
            <Route
              path="/technician/batches"
              element={
                <ProtectedRoute requiredRole="Lab Technician">
                  <TechnicianBatchList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/technician/batches/:id"
              element={
                <ProtectedRoute requiredRole="Lab Technician">
                  <TechnicianBatchDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/:id"
              element={
                <ProtectedRoute requiredRole={["Researcher", "Lab Technician"]}>
                  <ReportsDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/monitoring-logs/:id"
              element={
                <ProtectedRoute requiredRole={["Researcher", "Lab Technician"]}>
                  <MonitoringLogDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/reports/:id/follow-up"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <ReportsFollowUpDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/new"
              element={
                <ProtectedRoute requiredRole="Lab Technician">
                  <ReportsCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/create-task/*"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <CreateTaskProvider>
                    <Routes>
                      <Route path="" element={<CreateTaskContainer />} />
                      <Route path="step-1" element={<CreateTaskContainer />} />
                      <Route
                        path="step-2"
                        element={<SelectTechnicianContainer />}
                      />
                      <Route path="step-3" element={<ConfirmTaskContainer />} />
                    </Routes>
                  </CreateTaskProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/tasks/:id"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <TaskDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/technician/tasks/:id"
              element={
                <ProtectedRoute requiredRole="Lab Technician">
                  <TechDetailTask />
                </ProtectedRoute>
              }
            />
            <Route
              path="/technician/samples/:id"
              element={
                <ProtectedRoute requiredRole="Lab Technician">
                  <TechDetailSample />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/task-templates"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <TaskTemplateList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/task-templates/new"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <TaskTemplateCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/task-templates/:id"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <TaskTemplateDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/researcher/experiment-log/create/*"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <ExperimentLogFormProvider>
                    <Routes>
                      <Route path="step-1" element={<CreateExperimentStep1 />} />
                      <Route path="step-2" element={<CreateExperimentStep2 />} />
                      <Route path="step-3" element={<CreateExperimentStep3 />} />
                      <Route
                        path="/"
                        element={<Navigate to="step-1" replace />}
                      />
                    </Routes>
                  </ExperimentLogFormProvider>
                </ProtectedRoute>
              }
            />

            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/researcher/experiment-log/:id"
              element={
                <ProtectedRoute requiredRole="Researcher">
                  <ExperimentLogDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/tasks"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminTasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tasks/:id"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminTaskDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/experiment-log"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminExperimentLog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/experiment-log/:id"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminExperimentLogDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/seedling"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminSeedlings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/seedling/:id"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminSeedlingDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/method"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminMethod />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/method/:id"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminMethodDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/report"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/report/:id"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminReportsDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/element"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminElement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/config"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminConfig />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}



function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Router>
              <Routes>
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/*" element={<AppLayout />} />
              </Routes>
            </Router>
          </SnackbarProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
