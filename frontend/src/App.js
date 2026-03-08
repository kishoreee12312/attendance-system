import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentsData from "./pages/StudentsData";
import FacultyData from "./pages/FacultyData";
import Subjects from "./pages/Subjects";
import AssignSubjects from "./pages/AssignSubjects";
import FacultyStudentData from "./pages/FacultyStudentData";
import ClassManagement from "./pages/ClassManagement";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/students"
            element={
              <ProtectedRoute role="admin">
                <StudentsData />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/faculty"
            element={
              <ProtectedRoute role="admin">
                <FacultyData />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/subjects"
            element={
              <ProtectedRoute role="admin">
                <Subjects />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/assign-subjects"
            element={
              <ProtectedRoute role="admin">
                <AssignSubjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/class-management"
            element={
              <ProtectedRoute role="admin">
                <ClassManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/faculty"
            element={
              <ProtectedRoute role="faculty">
                <FacultyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/student-data"
            element={
              <ProtectedRoute role="faculty">
                <FacultyStudentData />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/class-management"
            element={
              <ProtectedRoute role="faculty">
                <ClassManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
