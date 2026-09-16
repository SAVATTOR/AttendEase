import api from './api';

export interface Attendance {
    id: string;
    studentId: string;
    classId: string;
    qrSessionId: string;
    latitude: number;
    longitude: number;
    distance: number;
    status: 'PRESENT' | 'LATE' | 'ABSENT' | 'INVALID_LOCATION';
    markedAt: string;
    student?: {
        id: string;
        name: string;
        email: string;
        indexNumber?: string;
    };
    class?: {
        id: string;
        name: string;
    };
    qrSession?: {
        id: string;
        createdAt: string;
    };
}

export interface MarkAttendanceData {
    token: string;
    latitude: number;
    longitude: number;
    accuracy?: number; // metres of uncertainty; the server credits this back against the geofence
}

export interface MarkAttendanceResponse {
    success: boolean;
    message: string;
    data: Attendance & {
        isWithinRange: boolean;
        allowedRadius: number;
    };
}

export interface AttendanceFilters {
    classId?: string;
    sessionId?: string;
    startDate?: string;
    endDate?: string;
    status?: 'PRESENT' | 'LATE' | 'ABSENT' | 'INVALID_LOCATION';
    page?: number;
    limit?: number;
}

export interface AttendanceStats {
    totalClasses: number;
    totalSessions: number;
    attendedSessions?: number;
    attendanceRate?: number;
    totalStudents?: number;
    totalAttendances?: number;
    breakdown?: {
        present: number;
        late: number;
        absent: number;
        invalidLocation: number;
    };
}

export interface PaginatedAttendance {
    attendances: Attendance[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const attendanceService = {
    async markAttendance(data: MarkAttendanceData): Promise<MarkAttendanceResponse> {
        const response = await api.post('/attendance/mark', data);
        return response.data;
    },

    async getMyAttendance(filters: AttendanceFilters = {}): Promise<PaginatedAttendance> {
        const params = new URLSearchParams();
        if (filters.classId) params.append('classId', filters.classId);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.status) params.append('status', filters.status);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const response = await api.get(`/attendance/my?${params.toString()}`);
        return response.data.data;
    },

    async getClassAttendance(classId: string, filters: AttendanceFilters = {}): Promise<PaginatedAttendance> {
        const params = new URLSearchParams();
        if (filters.sessionId) params.append('sessionId', filters.sessionId);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.status) params.append('status', filters.status);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const response = await api.get(`/attendance/class/${classId}?${params.toString()}`);
        return response.data.data;
    },

    async getAttendanceStats(): Promise<AttendanceStats> {
        const response = await api.get('/attendance/stats');
        return response.data.data;
    },
};
