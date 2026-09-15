import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: UserRole;
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRole) {
    // Normalize role comparison (handle both 'teacher'/'TEACHER' and 'student'/'STUDENT')
    const userRole = user?.role?.toLowerCase();
    const allowedRoleLower = allowedRole.toLowerCase();
    if (userRole !== allowedRoleLower) {
      // Redirect to appropriate dashboard based on role
      const isTeacher = userRole === 'teacher';
      const redirectPath = isTeacher ? '/lecturer' : '/student';
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
}
