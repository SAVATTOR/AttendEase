import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { formatRoleForDisplay } from '@/utils/roleFormatter';
import {
  LayoutDashboard,
  BookOpen,
  QrCode,
  ClipboardList,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  GraduationCap,
  Scan,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const teacherNavItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/lecturer' },
  { label: 'My Classes', icon: BookOpen, path: '/lecturer/classes' },
  { label: 'Start Session', icon: QrCode, path: '/lecturer/session' },
  { label: 'Attendance Records', icon: ClipboardList, path: '/lecturer/attendance' },
  { label: 'Settings', icon: Settings, path: '/lecturer/settings' },
];

const studentNavItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/student' },
  { label: 'Mark Attendance', icon: Scan, path: '/student/attendance/mark' },
  { label: 'My Classes', icon: BookOpen, path: '/student/classes' },
  { label: 'Attendance History', icon: ClipboardList, path: '/student/attendance' },
  { label: 'Settings', icon: Settings, path: '/student/settings' },
];

interface SidebarProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { showToast } = useToast();
  const { resolvedTheme, toggleTheme } = useTheme();

  const isTeacher = user?.role?.toUpperCase() === 'TEACHER';
  const navItems = isTeacher ? teacherNavItems : studentNavItems;

  // Check for active session when navigating away from session page
  useEffect(() => {
    if (isTeacher && location.pathname !== '/lecturer/session') {
      const activeSessionId = localStorage.getItem('activeSessionId');
      if (activeSessionId) {
        // Show reminder toast when navigating away from session page
        const sessionClassCode = localStorage.getItem('activeSessionClassCode') || 'a class';
        showToast('info', 'Active session reminder', `You have a live attendance session for ${sessionClassCode} course.`);
      }
    }
  }, [location.pathname, isTeacher, showToast]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/lecturer' || path === '/student') {
      return location.pathname === path;
    }
    // Exact match for paths that could conflict
    if (path === '/student/attendance') {
      return location.pathname === '/student/attendance';
    }
    if (path === '/student/attendance/mark') {
      return location.pathname === '/student/attendance/mark';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-40",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg">AttendEase</span>
            </motion.div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex-shrink-0"
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info & Theme Toggle */}
        <div className={cn("p-4 border-t border-border", isCollapsed && "px-2")}>
          {/* Theme Toggle */}
          <div className={cn("mb-3", isCollapsed && "flex justify-center")}>
            <Button
              variant="ghost"
              size={isCollapsed ? "icon" : "sm"}
              onClick={toggleTheme}
              className={cn(!isCollapsed && "w-full justify-start gap-2")}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
              {!isCollapsed && (
                <span>{resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              )}
            </Button>
          </div>
          <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
            <Avatar className="w-10 h-10">
              <AvatarImage src={(user as any)?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{formatRoleForDisplay(user?.role)}</p>
              </div>
            )}
            {!isCollapsed && (
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">AttendEase</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)}>
          <Menu className="w-6 h-6" />
        </Button>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 h-full w-72 bg-card border-r border-border z-50 flex flex-col"
            >
              {/* Logo */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="font-display font-bold text-lg">AttendEase</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsMobileOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        active
                          ? "bg-primary text-primary-foreground shadow-soft"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* User Info & Theme Toggle */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={(user as any)?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">{formatRoleForDisplay(user?.role)}</p>
                  </div>
                </div>
                {/* Theme Toggle */}
                <Button
                  variant="outline"
                  className="w-full mb-2 justify-start gap-2"
                  onClick={toggleTheme}
                >
                  {resolvedTheme === 'dark' ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                  {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </Button>
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 min-h-screen transition-all duration-300",
          "pt-16 lg:pt-0",
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
