import api from './api';

export interface ExportFilters {
    startDate?: string;
    endDate?: string;
    classId?: string;
}

export const exportService = {
    async exportClassAttendanceCSV(classId: string, filters: ExportFilters = {}): Promise<void> {
        const params = new URLSearchParams();
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        const response = await api.get(`/export/class/${classId}/csv?${params.toString()}`, {
            responseType: 'blob',
        });

        const filename = this.extractFilename(response) || `class_attendance_${new Date().toISOString().split('T')[0]}.csv`;
        this.downloadBlob(response.data, filename);
    },

    async exportSessionAttendanceCSV(sessionId: string): Promise<void> {
        const response = await api.get(`/export/session/${sessionId}/csv`, {
            responseType: 'blob',
        });

        const filename = this.extractFilename(response) || `session_attendance_${new Date().toISOString().split('T')[0]}.csv`;
        this.downloadBlob(response.data, filename);
    },

    async exportMyAttendanceCSV(filters: ExportFilters = {}): Promise<void> {
        const params = new URLSearchParams();
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.classId) params.append('classId', filters.classId);

        const response = await api.get(`/export/my-attendance/csv?${params.toString()}`, {
            responseType: 'blob',
        });

        const filename = this.extractFilename(response) || `my_attendance_${new Date().toISOString().split('T')[0]}.csv`;
        this.downloadBlob(response.data, filename);
    },

    // Extract filename from Content-Disposition header
    extractFilename(response: any): string | null {
        const contentDisposition = response.headers?.['content-disposition'];
        if (!contentDisposition) return null;

        // Match filename="..." or filename=...
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
            return filenameMatch[1].replace(/['"]/g, '');
        }
        return null;
    },

    downloadBlob(blob: Blob, filename: string): void {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },
};
