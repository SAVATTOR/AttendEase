import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/services/api';
import {
  BookOpen,
  Users,
  CalendarCheck,
  TrendingUp,
  QrCode,
  ArrowRight,
  Clock,
  Loader2,
} from 'lucide-react';

interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  totalSessions: number;
  sessionsToday: number;
  averageAttendance: number;
  recentActivity: {
    id: string;
    studentName: string;
    className: string;
    status: string;
    time: string;
  }[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// Format relative time
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/users/dashboard-stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const statItems = stats ? [
    {
      label: 'Total Classes',
      value: stats.totalClasses,
      icon: BookOpen,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Sessions Today',
      value: stats.sessionsToday,
      icon: CalendarCheck,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Avg. Attendance',
      value: `${stats.averageAttendance}%`,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ] : [];

  return (
    <DashboardLayout>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Welcome Header */}
        <motion.div variants={item}>
          <h1 className="text-3xl font-display font-bold mb-2">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your classes today.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statItems.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="bg-card rounded-xl p-6 border border-border shadow-soft hover:shadow-medium transition-shadow"
                  >
                    <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-display font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                );
              })}
            </motion.div>

            {/* Quick Actions & Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <motion.div variants={item} className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-display font-semibold">Quick Actions</h2>
                </div>
                <div className="p-6 space-y-4">
                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full justify-between"
                    onClick={() => navigate('/lecturer/session')}
                  >
                    <span className="flex items-center gap-2">
                      <QrCode className="w-5 h-5" />
                      Start New Session
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-between"
                    onClick={() => navigate('/lecturer/classes')}
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      View Classes
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div variants={item} className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <h2 className="text-lg font-display font-semibold">Recent Activity</h2>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/lecturer/attendance')}>
                    View All
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                    stats.recentActivity.map((activity) => (
                      <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {activity.studentName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{activity.studentName}</p>
                            <p className="text-sm text-muted-foreground">{activity.className}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={activity.status === 'present' ? 'present' : activity.status === 'late' ? 'late' : 'absent'}>
                            {activity.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(activity.time)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>No recent activity</p>
                      <p className="text-sm mt-1">Start a session to see attendance records</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
