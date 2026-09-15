import api from './api';

export interface UserSettings {
    id: string;
    userId: string;
    emailNotifications: boolean;
    sessionReminders: boolean;
    defaultSessionDuration: number;
    defaultAllowedRadius: number;
    lateThresholdMinutes: number;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateSettingsData {
    emailNotifications?: boolean;
    sessionReminders?: boolean;
    defaultSessionDuration?: number;
    defaultAllowedRadius?: number;
    lateThresholdMinutes?: number;
}

export interface UpdateProfileData {
    name?: string;
    email?: string;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: 'STUDENT' | 'TEACHER';
    createdAt: string;
    updatedAt: string;
}

export const settingsService = {
    async getSettings(): Promise<UserSettings> {
        const response = await api.get('/settings');
        return response.data.data;
    },

    async updateSettings(data: UpdateSettingsData): Promise<UserSettings> {
        const response = await api.put('/settings', data);
        return response.data.data;
    },

    async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
        const response = await api.put('/settings/profile', data);
        return response.data.data;
    },

    async changePassword(data: ChangePasswordData): Promise<void> {
        await api.put('/settings/password', data);
    },

    async deleteAccount(password: string): Promise<void> {
        await api.delete('/settings/account', { data: { password } });
    },
};
