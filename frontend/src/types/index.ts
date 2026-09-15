// Re-export all types from services
export type { User, LoginCredentials, RegisterData, AuthResponse } from '../services/authService';
export type { Class, CreateClassData, UpdateClassData, Student, PaginatedResponse } from '../services/classService';
export type { Attendance, MarkAttendanceData, MarkAttendanceResponse, AttendanceFilters, AttendanceStats, PaginatedAttendance } from '../services/attendanceService';
export type { QRSession, GenerateSessionData, ValidateQRData, ValidateQRResponse, SessionAttendance, SessionHistory } from '../services/qrService';
export type { UserSettings, UpdateSettingsData, UpdateProfileData, ChangePasswordData, UserProfile } from '../services/settingsService';
export type { ExportFilters } from '../services/exportService';

// Common types
export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Status badge colors
export const STATUS_COLORS = {
  PRESENT: 'bg-green-100 text-green-800',
  LATE: 'bg-yellow-100 text-yellow-800',
  ABSENT: 'bg-red-100 text-red-800',
  INVALID_LOCATION: 'bg-orange-100 text-orange-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  ENDED: 'bg-gray-100 text-gray-800',
  EXPIRED: 'bg-red-100 text-red-800',
} as const;

// Session status
export type SessionStatus = 'ACTIVE' | 'PAUSED' | 'ENDED' | 'EXPIRED';
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'INVALID_LOCATION';
