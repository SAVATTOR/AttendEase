import api from './api';

export interface QRSession {
    id: string;
    classId: string;
    token: string;
    latitude: number;
    longitude: number;
    status: 'ACTIVE' | 'PAUSED' | 'ENDED' | 'EXPIRED';
    createdAt: string;
    pausedAt?: string;
    resumedAt?: string;
    expiresAt: string;
    endedAt?: string;
    class?: {
        name: string;
        allowedRadius: number;
        lateThresholdMinutes: number;
    };
    _count?: {
        attendances: number;
    };
}

export interface GenerateSessionData {
    classId: string;
    latitude: number;
    longitude: number;
    duration?: number;
    allowedRadius?: number;
    lateThresholdMinutes?: number;
}

export interface ValidateQRData {
    token: string;
    latitude: number;
    longitude: number;
}

export interface ValidateQRResponse {
    sessionId: string;
    classId: string;
    className: string;
    teacherLocation: {
        latitude: number;
        longitude: number;
    };
    allowedRadius: number;
    lateThresholdMinutes: number;
    sessionStartedAt: string;
}

export interface SessionAttendance {
    session: {
        id: string;
        status: string;
        createdAt: string;
        expiresAt: string;
        pausedAt?: string;
        endedAt?: string;
    };
    attendances: Array<{
        id: string;
        status: string;
        markedAt: string;
        distance: number;
        latitude?: number;
        longitude?: number;
        student: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    stats: {
        total: number;
        present: number;
        late: number;
        invalidLocation: number;
        absent: number;
    };
}

export interface SessionHistory {
    sessions: QRSession[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const qrService = {
    async generateSession(data: GenerateSessionData): Promise<QRSession> {
        const response = await api.post('/qr/generate', data);
        return response.data.data;
    },

    async getActiveSession(classId: string): Promise<QRSession | null> {
        const response = await api.get(`/qr/active/${classId}`);
        return response.data.data;
    },

    async validateQR(data: ValidateQRData): Promise<ValidateQRResponse> {
        const response = await api.post('/qr/validate', data);
        return response.data.data;
    },

    async pauseSession(sessionId: string): Promise<QRSession> {
        const response = await api.post(`/qr/${sessionId}/pause`);
        return response.data.data;
    },

    async resumeSession(sessionId: string): Promise<QRSession> {
        const response = await api.post(`/qr/${sessionId}/resume`);
        return response.data.data;
    },

    async endSession(sessionId: string): Promise<void> {
        await api.delete(`/qr/${sessionId}`);
    },

    async getSessionAttendance(sessionId: string): Promise<SessionAttendance> {
        const response = await api.get(`/qr/session/${sessionId}/attendance`);
        return response.data.data;
    },

    async getSessionHistory(classId: string, page = 1, limit = 10): Promise<SessionHistory> {
        const response = await api.get(`/qr/history/${classId}?page=${page}&limit=${limit}`);
        return response.data.data;
    },

    async refreshToken(sessionId: string): Promise<{ token: string }> {
        const response = await api.post('/qr/refresh-token', { sessionId });
        return response.data.data;
    },
};
