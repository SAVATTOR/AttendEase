import api from './api';

export interface LoginCredentials {
    email: string;
    password: string;
    deviceId?: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    role: 'STUDENT' | 'TEACHER';
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'STUDENT' | 'TEACHER';
    createdAt: string;
}

export interface AuthResponse {
    success: boolean;
    message?: string;
    data: {
        user: User;
        token: string;
    };
    requiresVerification?: boolean;
}

export interface VerifyEmailData {
    email: string;
    code: string;
}

export interface ResetPasswordData {
    email: string;
    code: string;
    newPassword: string;
}

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await api.post('/auth/login', credentials);
        if (response.data.success && response.data.data?.token) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
        return response.data;
    },

    async register(data: RegisterData): Promise<AuthResponse & { requiresVerification?: boolean }> {
        const response = await api.post('/auth/register', data);
        if (response.data.success && response.data.data?.token) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
        return response.data;
    },

    async verifyEmail(data: VerifyEmailData): Promise<AuthResponse> {
        const response = await api.post('/auth/verify-email', data);
        if (response.data.success && response.data.data.token) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
        return response.data;
    },

    async sendPreRegistrationCode(email: string, name: string, role: 'STUDENT' | 'TEACHER'): Promise<void> {
        await api.post('/auth/send-pre-registration-code', { email, name, role });
    },

    async resendVerificationCode(email: string): Promise<void> {
        await api.post('/auth/resend-verification', { email });
    },

    async forgotPassword(email: string): Promise<void> {
        await api.post('/auth/forgot-password', { email });
    },

    async resetPassword(data: ResetPasswordData): Promise<void> {
        await api.post('/auth/reset-password', data);
    },

    async logout(): Promise<void> {
        try {
            await api.post('/auth/logout');
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },

    async logoutAll(): Promise<void> {
        try {
            await api.post('/auth/logout-all');
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },

    async getCurrentUser(): Promise<User | null> {
        try {
            const response = await api.get('/auth/me');
            return response.data.data?.user || null;
        } catch {
            return null;
        }
    },

    async checkCooldownStatus(email: string): Promise<{
        isOnCooldown: boolean;
        remainingMinutes: number;
        cooldownEndsAt?: string;
    }> {
        const response = await api.get(`/auth/cooldown-status?email=${encodeURIComponent(email)}`);
        return response.data.data;
    },

    getStoredUser(): User | null {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch {
            return null;
        }
    },

    getToken(): string | null {
        return localStorage.getItem('token');
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    },
};

export default authService;
