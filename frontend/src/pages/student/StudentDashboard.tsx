import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/button';
import { Scan, BookOpen, TrendingUp, Flame, Calendar, Loader2, Clock } from 'lucide-react';
import { getSocket, joinClassRoom } from '@/services/socketService';
import { classService } from '@/services/classService';
import api from '@/services/api';

interface DashboardStats {
  totalClasses: number;
  totalSessions: number;
  attendedSessions: number;
  attendanceRate: number;
  breakdown: {
    present: number;
    late: number;
    absent: number;
    invalidLocation: number;
  };
}

interface EnrolledClass {
  id: string;
  name: string;
  teacher?: { name: string };
  enrollmentStatus?: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsResponse, classesResponse] = await Promise.all([
        api.get('/users/dashboard-stats'),
        classService.getMyClasses(1, 10),
      ]);
      setStats(statsResponse.data.data);
      setEnrolledClasses(classesResponse.data?.filter((c: EnrolledClass) => c.enrollmentStatus === 'APPROVED') || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Join socket rooms for enrolled classes and listen for session notifications
  useEffect(() => {
    if (!user || user.role !== 'STUDENT') return;

    const socket = getSocket();
    if (!socket) return;

    // Load enrolled classes and join their rooms
    const loadClassesAndJoinRooms = async () => {
      try {
        const response = await classService.getMyClasses(1, 100);
        const classes = response.data || [];

        // Only join attendance rooms for APPROVED enrollments (not PENDING)
        classes.forEach((classItem: EnrolledClass) => {
          if (classItem.enrollmentStatus === 'APPROVED') {
            joinClassRoom(classItem.id);
          }
        });
      } catch (error) {
        console.error('Failed to load classes for socket rooms:', error);
      }
    };

    loadClassesAndJoinRooms();

    // Listen for session-started events
    const handleSessionStarted = (data: {
      sessionId: string;
      classId: string;
      className: string;
      teacherName: string;
    }) => {
      showToast(
        'warning',
        'Class Live!',
        `${data.className} has started attendance. You can now scan the QR code to mark your attendance.`
      );
    };

    socket.on('session-started', handleSessionStarted);

    // Cleanup
    return () => {
      socket.off('session-started', handleSessionStarted);
    };
  }, [user, showToast]);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Welcome, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-muted-foreground">Ready to mark your attendance today?</p>
        </div>

        {/* Quick Scan Button */}
        <Button variant="gradient" size="xl" className="w-full" onClick={() => navigate('/student/attendance/mark')}>
          <Scan className="w-6 h-6 mr-3" />
          Scan QR to Mark Attendance
        </Button>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl p-6 border border-border shadow-soft text-center">
                <div className="w-16 h-16 mx-auto mb-3 relative">
                  <svg className="w-full h-full circular-progress" viewBox="0 0 64 64">
                    <circle className="circular-progress-track" cx="32" cy="32" r="28" />
                    <circle className="circular-progress-fill" cx="32" cy="32" r="28" strokeDasharray="176" strokeDashoffset={176 - ((stats?.attendanceRate || 0) / 100) * 176} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{stats?.attendanceRate || 0}%</span>
                </div>
                <p className="text-sm text-muted-foreground">Overall Attendance</p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <p className="text-2xl font-bold">{stats?.attendedSessions || 0}</p>
                <p className="text-sm text-muted-foreground">Sessions Attended</p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
                <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-warning" />
                </div>
                <p className="text-2xl font-bold">{stats?.breakdown?.present || 0}</p>
                <p className="text-sm text-muted-foreground">Present Count</p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6 text-success" />
                </div>
                <p className="text-2xl font-bold">{stats?.totalClasses || 0}</p>
                <p className="text-sm text-muted-foreground">Enrolled Classes</p>
              </div>
            </div>

            {/* Enrolled Classes */}
            <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="font-display font-semibold text-lg">Your Classes</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate('/student/classes')}>
                  View All
                </Button>
              </div>
              <div className="divide-y divide-border">
                {enrolledClasses.length > 0 ? (
                  enrolledClasses.slice(0, 5).map((cls) => (
                    <div key={cls.id} className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{cls.name}</p>
                          <p className="text-sm text-muted-foreground">{cls.teacher?.name || 'Unknown Lecturer'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No enrolled classes yet</p>
                    <p className="text-sm mt-1">Enroll in a class to get started</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
