import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { attendanceService } from '@/services/attendanceService';
import { classService } from '@/services/classService';
import { getSocket } from '@/services/socketService';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ClipboardList,
    Calendar,
    Download,
    Filter,
    MapPin,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import { exportService } from '@/services/exportService';

// Mock attendance history data
const mockAttendanceHistory = [
    {
        id: '1',
        className: 'CS 101 - Intro to Computer Science',
        classCode: 'CS101',
        date: '2024-01-15',
        time: '09:15 AM',
        status: 'PRESENT',
        distance: 12,
    },
    {
        id: '2',
        className: 'CS 201 - Data Structures',
        classCode: 'CS201',
        date: '2024-01-15',
        time: '02:05 PM',
        status: 'LATE',
        distance: 28,
    },
    {
        id: '3',
        className: 'MATH 301 - Linear Algebra',
        classCode: 'MATH301',
        date: '2024-01-14',
        time: '11:02 AM',
        status: 'PRESENT',
        distance: 8,
    },
    {
        id: '4',
        className: 'CS 101 - Intro to Computer Science',
        classCode: 'CS101',
        date: '2024-01-13',
        time: '09:00 AM',
        status: 'PRESENT',
        distance: 15,
    },
    {
        id: '5',
        className: 'CS 201 - Data Structures',
        classCode: 'CS201',
        date: '2024-01-13',
        time: '-',
        status: 'ABSENT',
        distance: null,
    },
];

const statusConfig = {
    PRESENT: { label: 'Present', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
    LATE: { label: 'Late', icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10' },
    ABSENT: { label: 'Absent', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
    INVALID_LOCATION: { label: 'Invalid Location', icon: MapPin, color: 'text-orange-500', bg: 'bg-orange-100' },
};

export default function StudentAttendanceHistory() {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [filterClass, setFilterClass] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isExporting, setIsExporting] = useState(false);
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [availableClasses, setAvailableClasses] = useState<{ id: string; code: string; name: string }[]>([]);

    // Check if user is a mock account (from seed data)
    const isMockAccount = user?.email?.match(/^(teacher|student)\d+@school\.edu$/) !== null;

    // Load attendance history
    const loadAttendanceHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            // Load classes first
            const classesResponse = await classService.getMyClasses(1, 100);
            const studentClasses = classesResponse.data || [];
            setAvailableClasses(studentClasses.map(c => ({
                id: c.id,
                code: c.code,
                name: c.name
            })));

            // Load attendance records
            const response = await attendanceService.getMyAttendance({
                classId: filterClass !== 'all' ? filterClass : undefined,
                page: 1,
                limit: 100,
            });

            const history = response.attendances.map((a: any) => ({
                id: a.id,
                classId: a.classId,
                className: a.class?.name || 'Unknown Class',
                classCode: studentClasses.find(c => c.id === a.classId)?.code || 'N/A',
                date: new Date(a.markedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
                time: new Date(a.markedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                status: a.status,
                distance: a.distance,
            }));

            // Only use mock data if API fails AND user is a mock account
            if (history.length === 0 && isMockAccount) {
                setAttendanceHistory(mockAttendanceHistory);
            } else {
                setAttendanceHistory(history);
            }
        } catch (error: any) {
            console.error('Failed to load attendance history:', error);
            // Only use mock data if user is a mock account
            if (isMockAccount) {
                setAttendanceHistory(mockAttendanceHistory);
            } else {
                showToast('error', 'Failed to load history', 'Please try again');
            }
        } finally {
            setIsLoading(false);
        }
    }, [filterClass, isMockAccount, showToast]);

    useEffect(() => {
        loadAttendanceHistory();
    }, [loadAttendanceHistory]);

    // Listen for new attendance marked
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleAttendanceMarked = (data: {
            attendanceId: string;
            classId: string;
            status: string;
            markedAt: string;
        }) => {
            // Refresh attendance history
            loadAttendanceHistory();
        };

        socket.on('attendance-marked', handleAttendanceMarked);

        return () => {
            socket.off('attendance-marked', handleAttendanceMarked);
        };
    }, [loadAttendanceHistory]);

    const filteredHistory = attendanceHistory.filter((record) => {
        // filterClass contains class ID, so compare against record.classId (not classCode)
        const classMatch = filterClass === 'all' || record.classId === filterClass;
        const statusMatch = filterStatus === 'all' || record.status === filterStatus;
        return classMatch && statusMatch;
    });

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportService.exportMyAttendanceCSV({
                classId: filterClass !== 'all' ? filterClass : undefined,
            });
            showToast('success', 'Export successful', 'Your attendance report has been downloaded');
        } catch (error) {
            showToast('error', 'Export failed', 'Could not generate the report. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const uniqueClasses = [
        { value: 'all', label: 'All Classes' },
        ...availableClasses.map(c => ({ value: c.id, label: `${c.code} - ${c.name}` }))
    ];

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold">Attendance History</h1>
                        <p className="text-muted-foreground mt-1">View your attendance records across all classes</p>
                    </div>
                    <Button onClick={handleExport} disabled={isExporting} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        {isExporting ? 'Exporting...' : 'Export CSV'}
                    </Button>
                </div>

                {/* Filters */}
                <div className="bg-card rounded-xl border border-border shadow-soft p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">Filter by Class</label>
                            <Select value={filterClass} onValueChange={setFilterClass}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Classes" />
                                </SelectTrigger>
                                <SelectContent>
                                    {uniqueClasses.map((cls) => (
                                        <SelectItem key={cls.value} value={cls.value}>
                                            {cls.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">Filter by Status</label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="PRESENT">Present</SelectItem>
                                    <SelectItem value="LATE">Late</SelectItem>
                                    <SelectItem value="ABSENT">Absent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Attendance List */}
                <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
                    <div className="divide-y divide-border">
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                                <p className="text-muted-foreground">Loading attendance history...</p>
                            </div>
                        ) : filteredHistory.length === 0 ? (
                            <div className="p-8 text-center">
                                <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No attendance records found</p>
                            </div>
                        ) : (
                            filteredHistory.map((record, index) => {
                                const StatusIcon = statusConfig[record.status as keyof typeof statusConfig]?.icon || CheckCircle;
                                const statusData = statusConfig[record.status as keyof typeof statusConfig];

                                return (
                                    <motion.div
                                        key={record.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusData.bg}`}>
                                                    <StatusIcon className={`w-5 h-5 ${statusData.color}`} />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{record.className}</p>
                                                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {record.date}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {record.time}
                                                        </span>
                                                        {record.distance !== null && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {record.distance}m
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge
                                                variant={
                                                    record.status === 'PRESENT'
                                                        ? 'present'
                                                        : record.status === 'LATE'
                                                            ? 'late'
                                                            : 'destructive'
                                                }
                                            >
                                                {statusData.label}
                                            </Badge>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
            </motion.div>
        </DashboardLayout>
    );
}
