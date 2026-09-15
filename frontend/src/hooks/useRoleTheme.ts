import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook to apply role-based theme classes to the document
 * Applies 'theme-lecturer' or 'theme-student' class based on user role
 */
export function useRoleTheme() {
  const { user } = useAuth();

  useEffect(() => {
    const html = document.documentElement;
    
    // Remove existing theme classes (including legacy theme-teacher)
    html.classList.remove('theme-lecturer', 'theme-student', 'theme-teacher');

    // Apply theme based on user role
    if (user?.role === 'TEACHER') {
      html.classList.add('theme-lecturer');
    } else if (user?.role === 'STUDENT') {
      html.classList.add('theme-student');
    }

    // Cleanup: remove theme class when user logs out
    return () => {
      html.classList.remove('theme-lecturer', 'theme-student', 'theme-teacher');
    };
  }, [user?.role]);
}

