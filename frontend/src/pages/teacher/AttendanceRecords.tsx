import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { classService } from '@/services/classService';
import { attendanceService } from '@/services/attendanceService';
import { exportService } from '@/services/exportService';
import { useToast } from '@/hooks/use-toast';
import { getSocket, joinTeacherClassRoom } from '@/services/socketService';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  MoreVertical,
  UserX,
  User,
  BookOpen,
  Users,
  Loader2,
} from 'lucide-react';

// Types
interface Student {
  id: string;
  name: string;
  email: string;
  enrolledAt: string;
  indexNumber?: string;
  session?: string;
  program?: string;
}

interface PendingEnrollment {
  id: string;
  name: string;
  email: string;
  indexNumber?: string;
  enrolledAt: string;
}

interface StudentClass {
  id: string;
  name: string;
  code: string;
  teacher: {
    name: string;
    email: string;
  };
  enrolledAt: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  sessionId: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'INVALID_LOCATION';
  markedAt: Date | string;
  distance: number;
}

type TabType = 'students' | 'requests';

// Mock attendance records for demo
const mockRecords: AttendanceRecord[] = [
  { id: '1', studentId: '1', studentName: 'Emma Wilson', classId: '1', className: 'CS 101', sessionId: '1', status: 'PRESENT', markedAt: new Date('2024-12-20T09:05:00'), distance: 15 },
  { id: '2', studentId: '2', studentName: 'James Chen', classId: '1', className: 'CS 101', sessionId: '1', status: 'PRESENT', markedAt: new Date('2024-12-20T09:03:00'), distance: 8 },
  { id: '3', studentId: '3', studentName: 'Sofia Garcia', classId: '1', className: 'CS 101', sessionId: '1', status: 'LATE', markedAt: new Date('2024-12-20T09:18:00'), distance: 22 },
  { id: '4', studentId: '4', studentName: 'Liam Johnson', classId: '2', className: 'CS 201', sessionId: '2', status: 'PRESENT', markedAt: new Date('2024-12-19T14:02:00'), distance: 12 },
  { id: '5', studentId: '5', studentName: 'Olivia Brown', classId: '2', className: 'CS 201', sessionId: '2', status: 'ABSENT', markedAt: new Date('2024-12-19T14:00:00'), distance: 0 },
  { id: '6', studentId: '6', studentName: 'Noah Martinez', classId: '3', className: 'CS 301', sessionId: '3', status: 'PRESENT', markedAt: new Date('2024-12-18T11:01:00'), distance: 5 },
  { id: '7', studentId: '7', studentName: 'Ava Davis', classId: '1', className: 'CS 101', sessionId: '4', status: 'PRESENT', markedAt: new Date('2024-12-18T09:04:00'), distance: 18 },
  { id: '8', studentId: '8', studentName: 'Ethan Rodriguez', classId: '2', className: 'CS 201', sessionId: '5', status: 'LATE', markedAt: new Date('2024-12-17T14:22:00'), distance: 28 },
];

const classes = [
  { id: 'all', name: 'All Classes' },
  { id: '1', name: 'CS 101' },
  { id: '2', name: 'CS 201' },
  { id: '3', name: 'CS 301' },
];

const statuses = [
  { id: 'all', name: 'All Status' },
  { id: 'PRESENT', name: 'Present' },
  { id: 'LATE', name: 'Late' },
  { id: 'ABSENT', name: 'Absent' },
  { id: 'INVALID_LOCATION', name: 'Invalid Location' },
];

// Badge variant mapper
const getStatusBadgeVariant = (status: AttendanceRecord['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'PRESENT':
      return 'default';
    case 'LATE':
      return 'secondary';
    case 'ABSENT':
      return 'destructive';
    case 'INVALID_LOCATION':
      return 'outline';
    default:
      return 'secondary';
  }
};

// Status display text
const getStatusDisplayText = (status: AttendanceRecord['status']): string => {
  switch (status) {
    case 'PRESENT':
      return 'Present';
    case 'LATE':
      return 'Late';
    case 'ABSENT':
      return 'Absent';
    case 'INVALID_LOCATION':
      return 'Invalid Location';
    default:
      return status;
  }
};

export default function AttendanceRecords() {
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user is a mock account (from seed data)
  const isMockAccount = user?.email?.match(/^(teacher|student)\d+@school\.edu$/) !== null;

  // Attendance records state (for viewing all records, not class-specific)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<{ id: string; name: string }[]>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Tab state (for class management view)
  const [activeTab, setActiveTab] = useState<TabType>('students');

  // Student management state
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentOtherClasses, setStudentOtherClasses] = useState<StudentClass[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  // Pending enrollments state
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState<string | null>(null);

  // Bulk action state
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [isRemovingAll, setIsRemovingAll] = useState(false);

  // Export loading state
  const [isExporting, setIsExporting] = useState(false);

  // Load students
  const loadStudents = useCallback(async () => {
    if (!classId) return;
    setIsLoadingStudents(true);
    try {
      const response = await classService.getClassStudents(classId, 1, 100);
      setStudents(response.data || []);
    } catch (error: any) {
      console.error('Failed to load students:', error);
      toast({
        title: 'Failed to load students',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingStudents(false);
    }
  }, [classId, toast]);

  // Load pending enrollments
  const loadPendingEnrollments = useCallback(async () => {
    if (!classId) return;
    setIsLoadingPending(true);
    try {
      // Backend endpoint: GET /classes/:id/pending-enrollments
      const response = await classService.getPendingEnrollments(classId, 1, 100);
      setPendingEnrollments(response.data || []);
    } catch (error: any) {
      console.error('Failed to load pending enrollments:', error);
      toast({
        title: 'Failed to load requests',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPending(false);
    }
  }, [classId, toast]);

  // Fetch pending enrollments on mount to show badge count immediately
  useEffect(() => {
    if (classId) {
      loadPendingEnrollments();
    }
  }, [classId, loadPendingEnrollments]);

  // Load data when classId or tab changes
  useEffect(() => {
    if (classId) {
      if (activeTab === 'students') {
        loadStudents();
      } else {
        loadPendingEnrollments();
      }
    }
  }, [classId, activeTab, loadStudents, loadPendingEnrollments]);

  // Load attendance records (when not viewing a specific class)
  const loadAttendanceRecords = useCallback(async () => {
    if (classId) return; // Don't load if viewing a specific class

    setIsLoadingRecords(true);
    try {
      // Load all classes first to get class list
      const classesResponse = await classService.getMyClasses(1, 100);
      const teacherClasses = classesResponse.data || [];
      setAvailableClasses([
        { id: 'all', name: 'All Classes' },
        ...teacherClasses.map(c => ({ id: c.id, name: c.name })),
      ]);

      // Load attendance for all classes
      const allRecords: AttendanceRecord[] = [];
      for (const classItem of teacherClasses) {
        try {
          const response = await attendanceService.getClassAttendance(classItem.id, {
            page: 1,
            limit: 100,
          });
          const records = response.attendances.map((a: any) => ({
            id: a.id,
            studentId: a.studentId,
            studentName: a.student?.name || 'Unknown',
            classId: a.classId,
            className: a.class?.name || classItem.name,
            sessionId: a.qrSessionId,
            status: a.status,
            markedAt: new Date(a.markedAt),
            distance: a.distance,
          }));
          allRecords.push(...records);
        } catch (error) {
          console.error(`Failed to load attendance for class ${classItem.id}:`, error);
        }
      }

      // Only use mock data if API fails AND user is a mock account
      if (allRecords.length === 0 && isMockAccount) {
        setAttendanceRecords(mockRecords);
      } else {
        setAttendanceRecords(allRecords);
      }
    } catch (error: any) {
      console.error('Failed to load attendance records:', error);
      // Only use mock data if user is a mock account
      if (isMockAccount) {
        setAttendanceRecords(mockRecords);
      } else {
        toast({
          title: 'Failed to load records',
          description: error.response?.data?.message || 'Please try again',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoadingRecords(false);
    }
  }, [classId, isMockAccount, toast]);

  // Load attendance records when not viewing a specific class
  useEffect(() => {
    if (!classId) {
      loadAttendanceRecords();
    }
  }, [classId, loadAttendanceRecords]);

  // Listen for enrollment requests via WebSocket
  useEffect(() => {
    if (!classId) return;

    const socket = getSocket();
    if (!socket) return;

    const handleEnrollmentRequest = (data: {
      enrollmentId: string;
      classId: string;
      className: string;
      studentId: string;
      studentName: string;
      studentEmail: string;
      requestedAt: string;
    }) => {
      // Only handle if it's for the current class
      if (data.classId === classId) {
        // Always refresh pending enrollments to update the badge count
        loadPendingEnrollments();
        // Show notification
        toast({
          title: 'New Enrollment Request',
          description: `${data.studentName} wants to join ${data.className}`,
        });
      }
    };

    socket.on('enrollment-request', handleEnrollmentRequest);

    // Join the class room to receive notifications (teachers use join-class-room)
    joinTeacherClassRoom(classId);

    const handleEnrollmentApproved = (data: { classId: string; studentId: string; studentName: string }) => {
      if (data.classId === classId) {
        if (activeTab === 'students') {
          loadStudents(); // Refresh students list
        } else {
          loadPendingEnrollments(); // Remove from pending list
        }
      }
    };

    const handleEnrollmentRejected = (data: { classId: string; studentId: string; studentName: string }) => {
      if (data.classId === classId && activeTab === 'requests') {
        loadPendingEnrollments(); // Remove from pending list
      }
    };

    const handleStudentRemoved = (data: { classId: string; studentId: string }) => {
      if (data.classId === classId && activeTab === 'students') {
        loadStudents(); // Refresh students list
      }
    };

    socket.on('enrollment-approved', handleEnrollmentApproved);
    socket.on('enrollment-rejected', handleEnrollmentRejected);
    socket.on('student-removed', handleStudentRemoved);

    return () => {
      socket.off('enrollment-request', handleEnrollmentRequest);
      socket.off('enrollment-approved', handleEnrollmentApproved);
      socket.off('enrollment-rejected', handleEnrollmentRejected);
      socket.off('student-removed', handleStudentRemoved);
    };
  }, [classId, activeTab, loadPendingEnrollments, loadStudents, toast]);

  // Handle approve enrollment
  const handleApproveEnrollment = async (studentId: string, studentName: string) => {
    if (!classId) return;
    setIsApproving(studentId);
    try {
      // Backend endpoint: PUT /classes/:id/enrollments/:studentId/approve
      await classService.approveEnrollment(classId, studentId);
      toast({
        title: 'Enrollment approved',
        description: `${studentName} has been approved`,
      });
      await loadPendingEnrollments();
      await loadStudents();
    } catch (error: any) {
      console.error('Failed to approve enrollment:', error);
      toast({
        title: 'Failed to approve',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsApproving(null);
    }
  };

  // Handle reject enrollment
  const handleRejectEnrollment = async (studentId: string, studentName: string) => {
    if (!classId) return;
    if (!window.confirm(`Are you sure you want to reject ${studentName}'s enrollment request?`)) {
      return;
    }
    setIsRejecting(studentId);
    try {
      // Backend endpoint: PUT /classes/:id/enrollments/:studentId/reject
      await classService.rejectEnrollment(classId, studentId);
      toast({
        title: 'Enrollment rejected',
        description: `${studentName}'s request has been rejected`,
      });
      await loadPendingEnrollments();
    } catch (error: any) {
      console.error('Failed to reject enrollment:', error);
      toast({
        title: 'Failed to reject',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsRejecting(null);
    }
  };

  // Handle remove student
  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!classId) return;
    if (!window.confirm(`Are you sure you want to remove ${studentName} from this class?`)) {
      return;
    }

    setIsRemoving(studentId);
    try {
      await classService.removeStudent(classId, studentId);
      toast({
        title: 'Student removed',
        description: `${studentName} has been removed from the class`,
      });
      await loadStudents();
    } catch (error: any) {
      console.error('Failed to remove student:', error);
      toast({
        title: 'Failed to remove student',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(null);
    }
  };

  // Handle approve all enrollments
  const handleApproveAllEnrollments = async () => {
    if (!classId) return;
    if (!window.confirm(`Are you sure you want to approve all ${pendingEnrollments.length} pending enrollment(s)?`)) {
      return;
    }

    setIsApprovingAll(true);
    try {
      const result = await classService.approveAllEnrollments(classId);
      toast({
        title: 'All enrollments approved',
        description: `${result.approvedCount} student(s) have been enrolled`,
      });
      await loadPendingEnrollments();
      await loadStudents();
    } catch (error: any) {
      console.error('Failed to approve all:', error);
      toast({
        title: 'Failed to approve all',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsApprovingAll(false);
    }
  };

  // Handle remove all students
  const handleRemoveAllStudents = async () => {
    if (!classId) return;
    if (!window.confirm(`Are you sure you want to remove ALL ${students.length} student(s) from this class? This action cannot be undone.`)) {
      return;
    }

    setIsRemovingAll(true);
    try {
      const result = await classService.removeAllStudents(classId);
      toast({
        title: 'All students removed',
        description: `${result.removedCount} student(s) have been removed from the class`,
      });
      await loadStudents();
    } catch (error: any) {
      console.error('Failed to remove all:', error);
      toast({
        title: 'Failed to remove all',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsRemovingAll(false);
    }
  };

  // Handle view profile
  const handleViewProfile = async (student: Student) => {
    setSelectedStudent(student);
    setIsProfileModalOpen(true);
    setStudentOtherClasses([]);

    // Backend endpoint: GET /classes/students/:studentId/other-classes
    try {
      const otherClasses = await classService.getStudentOtherClasses(student.id);
      setStudentOtherClasses(otherClasses);
    } catch (error: any) {
      console.error('Failed to load student other classes:', error);
      // Silently fail - modal will still show, just without other classes
    }
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (classId) {
        await exportService.exportClassAttendanceCSV(classId);
      } else {
        // Export all - create CSV from filtered records
        const csvContent = filteredRecords
          .map((r) => {
            const date = r.markedAt instanceof Date ? r.markedAt : new Date(r.markedAt);
            return `${r.studentName},${r.className},${r.status},${date.toISOString()}`;
          })
          .join('\n');
        const blob = new Blob([`Student,Class,Status,Time\n${csvContent}`], {
          type: 'text/csv',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attendance-records.csv';
        a.click();
        URL.revokeObjectURL(url);
      }
      toast({
        title: 'Export complete',
        description: 'Attendance records have been exported',
      });
    } catch (error: any) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Filter records
  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch = record.studentName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesClass =
      selectedClass === 'all' || record.classId === selectedClass;
    const matchesStatus =
      selectedStatus === 'all' || record.status === selectedStatus;
    return matchesSearch && matchesClass && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Filter students by search
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter pending enrollments by search
  const filteredPendingEnrollments = pendingEnrollments.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">
              {classId ? 'Class Students' : 'Attendance Records'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {classId
                ? 'Manage students enrolled in this class'
                : 'View and export attendance data'}
            </p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export CSV
          </Button>
        </div>

        {/* Filters (when NOT viewing class students) */}
        {!classId && (
          <div className="bg-card rounded-xl border border-border shadow-sm p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-0 pointer-events-none" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 relative z-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    type="button"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {(availableClasses.length > 0 ? availableClasses : classes).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Search for Students (when classId is provided) */}
        {classId && (
          <div className="bg-card rounded-xl border border-border shadow-sm p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-0 pointer-events-none" />
              <Input
                placeholder="Search students by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 relative z-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  type="button"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content based on classId */}
        {classId ? (
          <>
            {/* Tabs for Students/Requests */}
            <div className="flex gap-2 border-b border-border">
              <button
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'students'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Students ({students.length})
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === 'requests'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Enrollment Requests
                {pendingEnrollments.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                    {pendingEnrollments.length}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'requests' ? (
              /* Pending Enrollments Table */
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                {/* Bulk action header */}
                {pendingEnrollments.length > 0 && (
                  <div className="p-4 border-b border-border flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {pendingEnrollments.length} pending request(s)
                    </span>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleApproveAllEnrollments}
                      disabled={isApprovingAll}
                    >
                      {isApprovingAll ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Enroll All
                    </Button>
                  </div>
                )}
                {isLoadingPending ? (
                  <div className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading requests...</p>
                  </div>
                ) : filteredPendingEnrollments.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No pending enrollment requests
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Index Number</TableHead>
                          <TableHead>Requested</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPendingEnrollments.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-medium text-primary">
                                    {student.name
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')}
                                  </span>
                                </div>
                                <span className="font-medium">{student.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {student.indexNumber || student.email}
                            </TableCell>
                            <TableCell>
                              {format(new Date(student.enrolledAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() =>
                                    handleApproveEnrollment(student.id, student.name)
                                  }
                                  disabled={
                                    isApproving === student.id ||
                                    isRejecting === student.id
                                  }
                                >
                                  {isApproving === student.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Approve'
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleRejectEnrollment(student.id, student.name)
                                  }
                                  disabled={
                                    isApproving === student.id ||
                                    isRejecting === student.id
                                  }
                                >
                                  {isRejecting === student.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Reject'
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ) : (
              /* Students Table */
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                {/* Bulk action header */}
                {students.length > 0 && (
                  <div className="p-4 border-b border-border flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {students.length} enrolled student(s)
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveAllStudents}
                      disabled={isRemovingAll}
                    >
                      {isRemovingAll ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <UserX className="w-4 h-4 mr-2" />
                      )}
                      Remove All
                    </Button>
                  </div>
                )}
                {isLoadingStudents ? (
                  <div className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading students...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? 'No students match your search'
                        : 'No students enrolled in this class'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Index Number</TableHead>
                          <TableHead>Enrolled</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-medium text-primary">
                                    {student.name
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')}
                                  </span>
                                </div>
                                <span className="font-medium">{student.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {student.indexNumber || student.email}
                            </TableCell>
                            <TableCell>
                              {format(new Date(student.enrolledAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleViewProfile(student)}
                                  >
                                    <User className="w-4 h-4 mr-2" />
                                    View Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleRemoveStudent(student.id, student.name)
                                    }
                                    className="text-destructive focus:text-destructive"
                                    disabled={isRemoving === student.id}
                                  >
                                    {isRemoving === student.id ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                      <UserX className="w-4 h-4 mr-2" />
                                    )}
                                    {isRemoving === student.id
                                      ? 'Removing...'
                                      : 'Remove'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Attendance Records Table (default view) */
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Distance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingRecords ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Loading attendance records...
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : paginatedRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No attendance records found
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRecords.map((record) => {
                      const markedAt =
                        record.markedAt instanceof Date
                          ? record.markedAt
                          : new Date(record.markedAt);
                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">
                                  {record.studentName
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                                </span>
                              </div>
                              <span className="font-medium">
                                {record.studentName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{record.className}</TableCell>
                          <TableCell>
                            <div>
                              <p>{format(markedAt, 'MMM d, yyyy')}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(markedAt, 'h:mm a')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(record.status)}>
                              {getStatusDisplayText(record.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {record.distance ? `${record.distance}m` : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of{' '}
                  {filteredRecords.length} results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Student Profile Modal */}
        <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Student Profile</DialogTitle>
              <DialogDescription>
                {selectedStudent?.name} - Other classes you teach
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Student Info */}
              {selectedStudent && (
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {selectedStudent.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{selectedStudent.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedStudent.indexNumber || selectedStudent.email}
                    </p>
                    {selectedStudent.indexNumber && (
                      <p className="text-xs text-muted-foreground">
                        Email: {selectedStudent.email}
                      </p>
                    )}
                    {selectedStudent.program && (
                      <p className="text-xs text-muted-foreground">
                        Program: {selectedStudent.program}
                      </p>
                    )}
                    {selectedStudent.session && (
                      <p className="text-xs text-muted-foreground">
                        Session: {selectedStudent.session}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Other Classes */}
              {studentOtherClasses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  This student is not enrolled in any other classes you teach.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Other Classes
                  </p>
                  {studentOtherClasses.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{classItem.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Code: {classItem.code} • Enrolled:{' '}
                            {format(new Date(classItem.enrolledAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
}