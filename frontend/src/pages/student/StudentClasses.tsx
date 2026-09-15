import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { classService } from '@/services/classService';
import { Class } from '@/types';
import { getSocket, joinClassRoom } from '@/services/socketService';
import {
    BookOpen,
    Users,
    MapPin,
    Calendar,
    Search,
    Plus,
    Clock,
    Loader2,
} from 'lucide-react';

// Mock enrolled classes data
const mockEnrolledClasses = [
    {
        id: '1',
        name: 'CS 101 - Intro to Computer Science',
        code: 'CS101',
        teacherName: 'Dr. Sarah Johnson',
        schedule: { days: ['Mon', 'Wed', 'Fri'], startTime: '09:00', endTime: '10:30' },
        attendanceRate: 92,
        totalSessions: 24,
        attendedSessions: 22,
    },
    {
        id: '2',
        name: 'CS 201 - Data Structures',
        code: 'CS201',
        teacherName: 'Dr. Sarah Johnson',
        schedule: { days: ['Tue', 'Thu'], startTime: '14:00', endTime: '15:30' },
        attendanceRate: 85,
        totalSessions: 18,
        attendedSessions: 15,
    },
    {
        id: '3',
        name: 'MATH 301 - Linear Algebra',
        code: 'MATH301',
        teacherName: 'Prof. Michael Chen',
        schedule: { days: ['Mon', 'Wed'], startTime: '11:00', endTime: '12:30' },
        attendanceRate: 100,
        totalSessions: 12,
        attendedSessions: 12,
    },
];

export default function StudentClasses() {
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [enrollCode, setEnrollCode] = useState('');
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [enrolledClasses, setEnrolledClasses] = useState<Class[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadClasses();
    }, []);

    // Join socket rooms when classes are loaded
    useEffect(() => {
        if (enrolledClasses.length > 0) {
            const socket = getSocket();
            if (socket) {
                enrolledClasses.forEach((classItem) => {
                    joinClassRoom(classItem.id);
                });
            }
        }
    }, [enrolledClasses]);

    const loadClasses = async () => {
        try {
            setIsLoading(true);
            const response = await classService.getMyClasses(1, 100);
            setEnrolledClasses(response.data || []);
        } catch (error: any) {
            console.error('Failed to load classes:', error);
            // Fallback to mock data if API fails
            setEnrolledClasses(mockEnrolledClasses as any);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredClasses = enrolledClasses.filter(
        (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.teacher as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Listen for enrollment status changes
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleEnrollmentStatusChanged = (data: {
            classId: string;
            className?: string;
            classCode?: string;
            status: 'APPROVED' | 'REJECTED' | 'REMOVED';
        }) => {
            if (data.status === 'APPROVED') {
                // Refresh classes to show updated enrollment status
                loadClasses();
                showToast('success', 'Enrollment approved', `You are now enrolled in ${data.className || 'the class'}`);
            } else if (data.status === 'REJECTED') {
                // Remove class from list
                setEnrolledClasses(prev => prev.filter(c => c.id !== data.classId));
                showToast('info', 'Enrollment rejected', 'Your enrollment request was rejected');
            } else if (data.status === 'REMOVED') {
                // Remove class from list
                setEnrolledClasses(prev => prev.filter(c => c.id !== data.classId));
                showToast('info', 'Removed from class', 'You have been removed from the class');
            }
        };

        socket.on('enrollment-status-changed', handleEnrollmentStatusChanged);

        return () => {
            socket.off('enrollment-status-changed', handleEnrollmentStatusChanged);
        };
    }, [loadClasses, showToast]);

    const handleEnroll = async () => {
        if (!enrollCode.trim()) {
            showToast('error', 'Please enter a class code');
            return;
        }
        setIsEnrolling(true);
        try {
            const result = await classService.enrollInClass(enrollCode.trim());
            showToast('success', 'Enrollment request submitted!', `Waiting for lecturer approval to join ${result.class.name}`);
            setEnrollCode('');
            // Reload classes to show the new enrollment with PENDING status
            await loadClasses();
        } catch (error: any) {
            console.error('Enrollment error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to enroll in class';
            showToast('error', 'Enrollment failed', errorMessage);
        } finally {
            setIsEnrolling(false);
        }
    };

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold">My Classes</h1>
                        <p className="text-muted-foreground mt-1">View and manage your enrolled classes</p>
                    </div>
                </div>

                {/* Enroll in New Class */}
                <div className="bg-card rounded-xl border border-border shadow-soft p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Enroll in a Class
                    </h3>
                    <div className="flex gap-3">
                        <Input
                            placeholder="Enter class code (e.g., CS101)"
                            value={enrollCode}
                            onChange={(e) => setEnrollCode(e.target.value)}
                            className="flex-1"
                        />
                        <Button onClick={handleEnroll} disabled={isEnrolling}>
                            {isEnrolling ? 'Enrolling...' : 'Enroll'}
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-0 pointer-events-none" />
                    <Input
                        placeholder="Search classes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 relative z-10"
                    />
                </div>

                {/* Classes Grid */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading classes...</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredClasses.map((classItem, index) => {
                            const teacherName = typeof classItem.teacher === 'object'
                                ? classItem.teacher?.name
                                : 'Unknown Lecturer';
                            const enrolledAt = (classItem as any).enrolledAt
                                ? new Date((classItem as any).enrolledAt).toLocaleDateString()
                                : null;

                            return (
                                <motion.div
                                    key={classItem.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-card rounded-xl border border-border shadow-soft p-5 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <BookOpen className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant="outline">{classItem.code}</Badge>
                                            {classItem.enrollmentStatus === 'PENDING' && (
                                                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                                                    Pending
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="font-semibold text-lg mb-1">{classItem.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">{teacherName}</p>

                                    {enrolledAt && (
                                        <p className="text-xs text-muted-foreground mb-4">Enrolled: {enrolledAt}</p>
                                    )}

                                    {classItem.enrollmentStatus === 'PENDING' && (
                                        <div className="mt-2 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                            <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                                Waiting for lecturer approval
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-4 pt-4 border-t border-border">
                                        <p className="text-sm text-muted-foreground">
                                            {(classItem as any)._count?.enrollments || 0} students enrolled
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {filteredClasses.length === 0 && (
                    <div className="text-center py-12">
                        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No classes found</p>
                    </div>
                )}
            </motion.div>
        </DashboardLayout>
    );
}
