import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useRoleTheme } from "@/hooks/useRoleTheme";

// Pages
import LoginPage from "@/pages/auth/LoginPage";
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import TeacherClasses from "@/pages/teacher/TeacherClasses";
import StartSession from "@/pages/teacher/StartSession";
import AttendanceRecords from "@/pages/teacher/AttendanceRecords";
import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentClasses from "@/pages/student/StudentClasses";
import StudentAttendanceHistory from "@/pages/student/StudentAttendanceHistory";
import MarkAttendance from "@/pages/student/MarkAttendance";
import SettingsPage from "@/pages/settings/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Inner component to use hooks
const AppContent = () => {
  useRoleTheme(); // Apply role-based theme

  return (
    <ToastProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Lecturer Routes */}
            <Route path="/lecturer" element={<ProtectedRoute allowedRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/lecturer/classes" element={<ProtectedRoute allowedRole="teacher"><TeacherClasses /></ProtectedRoute>} />
            <Route path="/lecturer/session" element={<ProtectedRoute allowedRole="teacher"><StartSession /></ProtectedRoute>} />
            <Route path="/lecturer/attendance" element={<ProtectedRoute allowedRole="teacher"><AttendanceRecords /></ProtectedRoute>} />
            <Route path="/lecturer/settings" element={<ProtectedRoute allowedRole="teacher"><SettingsPage /></ProtectedRoute>} />
            {/* Legacy teacher routes - redirect to lecturer */}
            <Route path="/teacher" element={<Navigate to="/lecturer" replace />} />
            <Route path="/teacher/*" element={<Navigate to="/lecturer" replace />} />

            {/* Student Routes */}
            <Route path="/student" element={<ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/classes" element={<ProtectedRoute allowedRole="student"><StudentClasses /></ProtectedRoute>} />
            <Route path="/student/attendance" element={<ProtectedRoute allowedRole="student"><StudentAttendanceHistory /></ProtectedRoute>} />
            <Route path="/student/attendance/mark" element={<ProtectedRoute allowedRole="student"><MarkAttendance /></ProtectedRoute>} />
            <Route path="/student/settings" element={<ProtectedRoute allowedRole="student"><SettingsPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ToastProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
