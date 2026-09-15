import api from './api';

export interface Class {
    id: string;
    name: string;
    description?: string;
    code: string;
    teacherId: string;
    schedule?: {
        days: string[];
        startTime: string;
        endTime: string;
    };
    allowedRadius: number;
    lateThresholdMinutes: number;
    sessionDurationMins: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    teacher?: {
        id: string;
        name: string;
        email: string;
    };
    enrollmentStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
    _count?: {
        enrollments: number;
        qrSessions: number;
        attendances: number;
    };
}

export interface CreateClassData {
    name: string;
    description?: string;
    schedule?: {
        days: string[];
        startTime: string;
        endTime: string;
    };
    allowedRadius?: number;
    lateThresholdMinutes?: number;
    sessionDurationMins?: number;
    code?: string;
    group?: string;
}

export interface UpdateClassData extends Partial<CreateClassData> {
    isActive?: boolean;
}

export interface Student {
    id: string;
    name: string;
    email: string;
    indexNumber?: string;
    enrolledAt: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    enrollmentId?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export const classService = {
    async getMyClasses(page = 1, limit = 10): Promise<PaginatedResponse<Class>> {
        const response = await api.get(`/classes?page=${page}&limit=${limit}`);
        // Backend returns: { success: true, data: [...], pagination: {...} }
        // We need to return just { data: [...], pagination: {...} } to match PaginatedResponse
        return {
            data: response.data.data || [],
            pagination: response.data.pagination || {
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
                hasNextPage: false,
                hasPrevPage: false,
            },
        };
    },

    async getClassById(id: string): Promise<Class> {
        const response = await api.get(`/classes/${id}`);
        return response.data.data;
    },

    async createClass(data: CreateClassData): Promise<Class> {
        const response = await api.post('/classes', data);
        return response.data.data;
    },

    async updateClass(id: string, data: UpdateClassData): Promise<Class> {
        const response = await api.put(`/classes/${id}`, data);
        return response.data.data;
    },

    async deleteClass(id: string): Promise<void> {
        await api.delete(`/classes/${id}`);
    },

    async enrollInClass(classCode: string): Promise<{ class: Class }> {
        const response = await api.post('/classes/enroll', { classCode });
        return response.data.data;
    },

    async unenrollFromClass(classId: string): Promise<void> {
        await api.delete(`/classes/${classId}/unenroll`);
    },

    async getClassStudents(classId: string, page = 1, limit = 10): Promise<PaginatedResponse<Student>> {
        const response = await api.get(`/classes/${classId}/students?page=${page}&limit=${limit}`);
        return response.data;
    },

    async removeStudent(classId: string, studentId: string): Promise<void> {
        await api.delete(`/classes/${classId}/students/${studentId}`);
    },

    async getStudentOtherClasses(studentId: string): Promise<Array<{ id: string; name: string; code: string; teacher: { id: string; name: string; email: string }; enrolledAt: string }>> {
        const response = await api.get(`/classes/students/${studentId}/other-classes`);
        return response.data.data;
    },

    async getPendingEnrollments(classId: string, page = 1, limit = 10): Promise<PaginatedResponse<Student & { enrollmentId: string }>> {
        const response = await api.get(`/classes/${classId}/pending-enrollments?page=${page}&limit=${limit}`);
        return response.data;
    },

    async approveEnrollment(classId: string, studentId: string): Promise<void> {
        await api.put(`/classes/${classId}/enrollments/${studentId}/approve`);
    },

    async rejectEnrollment(classId: string, studentId: string): Promise<void> {
        await api.put(`/classes/${classId}/enrollments/${studentId}/reject`);
    },

    async regenerateClassCode(classId: string): Promise<{ code: string }> {
        const response = await api.post(`/classes/${classId}/regenerate-code`);
        return response.data.data;
    },

    async approveAllEnrollments(classId: string): Promise<{ approvedCount: number }> {
        const response = await api.put(`/classes/${classId}/enrollments/approve-all`);
        return response.data.data;
    },

    async removeAllStudents(classId: string): Promise<{ removedCount: number }> {
        const response = await api.delete(`/classes/${classId}/students`);
        return response.data.data;
    },
};

export default classService;
