import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Method from "./pages/researcher/method/Method";
import Tasks from "./pages/researcher/task/Tasks";
import ExperimentLog from "./pages/researcher/experimentlog/ExperimentLog";
import Seedlings from "./pages/researcher/seeding/Seedlings";
import ReportsDetails from "./pages/researcher/report/ReportsDetails";
import ReportsFollowUpDetails from "./pages/researcher/report/ReportsFollowUpDetails";
import SeedlingDetail from "./pages/researcher/seeding/SeedlingDetail";

import { SeedlingFormProvider } from "./context/SeedlingFormContext";
import CreateTaskContainer from "./pages/researcher/task/create/CreateTaskContainer";
import SelectTechnicianContainer from "./pages/researcher/task/create/SelectTechnicianContainer";
import ConfirmTaskContainer from "./pages/researcher/task/create/ConfirmTaskContainer";
import TaskDetailPage from "./pages/researcher/task/TaskDetailPage";
// import EditTask from "./pages/CreateTask/EditTask"; 
import CreateExperimentStep1 from "./pages/researcher/experimentlog/create/CreateExperimentStep1";
import CreateExperimentStep2 from "./pages/researcher/experimentlog/create/CreateExperimentStep2";
import CreateExperimentStep3 from "./pages/researcher/experimentlog/create/CreateExperimentStep3";
import { ExperimentLogFormProvider } from "./context/ExperimentLogFormContext";
import ProfilePage from "./pages/landing/ProfilePage";
import MethodDetail from "./pages/researcher/method/MethodDetail";
import MethodCreate from "./pages/researcher/method/MethodCreate";
import SeedlingDetailsForm from "./pages/researcher/seeding/SeedlingDetailsForm";
import SeedlingCharacteristicsForm from "./pages/researcher/seeding/SeedlingCharacteristicsForm";
import SeedlingSummary from "./pages/researcher/seeding/SeedlingSummary";
import ExperimentLogDetail from "./pages/researcher/experimentlog/ExperimentLogDetail";
import SidebarAdmin from "./components/SidebarAdmin";
import Login from "./pages/landing/Login";
import DashboardAdmin from "./pages/admin/dashboard/DashboardAdmin";
import { AuthProvider, useAuth } from "./context/AuthContext";
// import ProtectedRoute from "./components/ProtectedRoute"; // --- MODIFIED FOR DEV: Comment dòng này ---
import Unauthorized from "./pages/landing/Unauthorized";
import { CreateTaskProvider } from "./context/CreateTaskContext";
import TaskTemplateList from "./pages/researcher/task/template/TaskTemplateList";
import TaskTemplateCreate from "./pages/researcher/task/template/create/TaskTemplateCreate";
import TaskTemplateDetail from "./pages/researcher/task/template/TaskTemplateDetail";
import { SnackbarProvider } from "notistack";
import ReportsCreate from "./pages/technician/report/ReportsCreate";
import ReportList from "./pages/researcher/report/Reports";
import ReportsTechnician from "./pages/technician/report/Reports";
import SidebarTechnician from "./components/SidebarTechinician";
import ListTask from "./pages/technician/task/listTask";
import TechDetailTask from "./pages/technician/task/TechDetailTask";
import ListSample from "./pages/technician/sample/ListSample";
import TechDetailSample from "./pages/technician/sample/TechDetailSample";

// Import admin pages
import AdminTasks from "./pages/admin/task/AdminTasks";
import AdminTaskDetail from "./pages/admin/task/AdminTaskDetail";
import AdminExperimentLog from "./pages/admin/experimentlog/AdminExperimentLog";
import AdminExperimentLogDetail from "./pages/admin/experimentlog/AdminExperimentLogDetail";
import AdminLabRoomList from "./pages/admin/labroom/AdminLabRoomList";
import AdminLabRoomCreate from "./pages/admin/labroom/AdminLabRoomCreate";
import AdminLabRoomDetail from "./pages/admin/labroom/AdminLabRoomDetail";
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

// --- MODIFIED FOR DEV: Tạo ProtectedRoute giả để cho phép truy cập mọi trang ---
const ProtectedRoute = ({ children }) => {
  return <>{children}</>;
};

function AppLayout() {
  // const { user, isAuthReady } = useAuth(); // --- MODIFIED FOR DEV: Comment dòng này ---
  
  // --- MODIFIED FOR DEV: Fake User để không bị lỗi null và chỉnh Sidebar ---
  const isAuthReady = true;
  // Sửa roleID thành 1 (Admin), 2 (Researcher), hoặc 3 (Technician) để test giao diện Sidebar tương ứng
  const user = { roleID: 1, fullName: "Developer Mode" }; 

  const location = useLocation();

  const isLoginPage = location.pathname === "/login";
  const isUnauthorizedPage = location.pathname === "/unauthorized";
  
  // Logic chọn Sidebar giữ nguyên, nó sẽ hiển thị dựa trên cái `user` mình fake ở trên
  let sidebar = <Sidebar />;
  if (user?.roleID === 1) sidebar = <SidebarAdmin />;
  else if (user?.roleID === 3) sidebar = <SidebarTechnician />;

  if (!isAuthReady) {
    return <div>Đang tải...</div>;
  }

  // --- MODIFIED FOR DEV: Tạm thời cho phép truy cập Login page nhưng không bắt buộc redirect ---
  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  // --- MODIFIED FOR DEV: Comment đoạn check login này để không bị đẩy về login ---
  // if (!user) {
  //   return <Navigate to="/login" replace />;
  // }

  if (isUnauthorizedPage) {
    return <Unauthorized />;
  }

  return (
    <div className="flex bg-gray-100 ">
      {sidebar}
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8">
          <Routes>
            {/* Các Routes bên dưới giữ nguyên, ProtectedRoute giờ đã bị "vô hiệu hóa" bởi component giả ở trên */}
            <Route
              path="/admin/tissue-culture-batches"
              element={
                <ProtectedRoute requiredRole={1}>
                  <AdminTissueCultureBatchList />
                </ProtectedRoute>
              }
            />
            {/* ... (Giữ nguyên toàn bộ phần còn lại của Routes) ... */}
            <Route
              path="/admin/tissue-culture-batches/create"
              element={
                <ProtectedRoute requiredRole={1}>
                  <AdminTissueCultureBatchCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tissue-culture-batches/:id"
              element={
                <ProtectedRoute requiredRole={1}>
                  <AdminTissueCultureBatchDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/user"
              element={
                <ProtectedRoute requiredRole={1}>
                  <DashboardAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/method"
              element={
                <ProtectedRoute requiredRole={2}>
                  <Method />
                </ProtectedRoute>
              }
            />
            <Route
              path="/method/:id"
              element={
                <ProtectedRoute requiredRole={2}>
                  <MethodDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/method/new"
              element={
                <ProtectedRoute requiredRole={2}>
                  <MethodCreate />
                </ProtectedRoute>
              }
            />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/experiment-log" element={<ExperimentLog />} />
            <Route
              path="/seedlings"
              element={
                <ProtectedRoute requiredRole={2}>
                  <Seedlings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seedlings/:id"
              element={
                <ProtectedRoute requiredRole={2}>
                  <SeedlingDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seedlings/new/*"
              element={
                <ProtectedRoute requiredRole={2}>
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
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute requiredRole={2}>
                  <ReportList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/technician/tasks"
              element={
                <ProtectedRoute requiredRole={3}>
                  <ListTask />
                </ProtectedRoute>
              }
            />
            <Route
              path="/technician/samples"
              element={
                <ProtectedRoute requiredRole={3}>
                  <ListSample />
                </ProtectedRoute>
              }
            />
            <Route
              path="/technician/reports"
              element={
                <ProtectedRoute requiredRole={3}>
                  <ReportsTechnician />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/:id"
              element={
                <ProtectedRoute requiredRole={[2, 3]}>
                  <ReportsDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/:id/follow-up"
              element={
                <ProtectedRoute requiredRole={2}>
                  <ReportsFollowUpDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/new"
              element={
                <ProtectedRoute requiredRole={3}>
                  <ReportsCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-task/*"
              element={
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
              }
            />
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
            <Route
              path="/technician/tasks/:id"
              element={
                <ProtectedRoute requiredRole={3}>
                  <TechDetailTask />
                </ProtectedRoute>
              }
            />
            <Route
              path="/technician/samples/:id"
              element={
                <ProtectedRoute requiredRole={3}>
                  <TechDetailSample />
                </ProtectedRoute>
              }
            />
            {/* <Route path="/tasks/:id/edit" element={<EditTask />} /> */}
            <Route path="/task-templates" element={<TaskTemplateList />} />
            <Route
              path="/task-templates/new"
              element={<TaskTemplateCreate />}
            />
            <Route
              path="/task-templates/:id"
              element={<TaskTemplateDetail />}
            />
            {/* Experiment Log Creation Routes */}
            <Route
              path="/experiment-log/create/*"
              element={
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
              }
            />

            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/experiment-log/:id"
              element={<ExperimentLogDetail />}
            />

            {/* Admin Routes */}
            <Route
              path="/admin/tasks"
              element={
                <ProtectedRoute requiredRole={1}>
                  <AdminTasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tasks/:id"
              element={
                <ProtectedRoute requiredRole={1}>
                  <AdminTaskDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/experiment-log"
              element={
                <ProtectedRoute requiredRole={1}>
                  <AdminExperimentLog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/experiment-log/:id"
              element={
                <ProtectedRoute requiredRole={1}>
                  <AdminExperimentLogDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/labroom"
              element={
                <ProtectedRoute requiredRole={1}>
                  <AdminLabRoomList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/labroom/new"
              element={
                <ProtectedRoute requiredRole={1}>
                  <AdminLabRoomCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/labroom/:id"
              element={
                <ProtectedRoute requiredRole={1}>
                  <AdminLabRoomDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/seedling"
              element={
                <ProtectedRoute requiredRole={1}>
                  <AdminSeedlings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/seedling/:id"
              element={
                <ProtectedRoute requiredRole={1}>
                  <AdminSeedlingDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/method"
              element={
                <ProtectedRoute requiredRole={1}>
                  <AdminMethod />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/method/:id"
              element={
                <ProtectedRoute requiredRole={1}>
                  <AdminMethodDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/report"
              element={
                <ProtectedRoute requiredRole={1}>
                  <AdminReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/report/:id"
              element={
                <ProtectedRoute requiredRole={1}>
                  <AdminReportsDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/element"
              element={
                <ProtectedRoute requiredRole={1}>
                  <AdminElement />
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
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;