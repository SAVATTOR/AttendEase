import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Security: Remove password from request logs if present
        if (config.data && typeof config.data === 'object') {
            const sanitizedData = { ...config.data };
            if ('password' in sanitizedData) {
                sanitizedData.password = '[REDACTED]';
            }
            if ('currentPassword' in sanitizedData) {
                sanitizedData.currentPassword = '[REDACTED]';
            }
            if ('newPassword' in sanitizedData) {
                sanitizedData.newPassword = '[REDACTED]';
            }
            if ('confirmPassword' in sanitizedData) {
                sanitizedData.confirmPassword = '[REDACTED]';
            }
            // Only log sanitized data in development
            if (import.meta.env.DEV && console.debug) {
                console.debug('API Request:', { ...config, data: sanitizedData });
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Ignore errors from blocked requests (browser extensions)
        if (error.message?.includes('blocked') || error.code === 'ERR_BLOCKED_BY_CLIENT') {
            console.debug('Request blocked by browser extension (non-critical)');
            // Return a mock response to prevent app crashes
            return Promise.resolve({ data: { success: false, message: 'Request blocked' } });
        }

        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Only redirect if not already on login page to prevent loops
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
