import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../authService';
import api from '../api';

// Mock the api module
vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('authService', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully and store token', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              id: '1',
              email: 'test@example.com',
              name: 'Test User',
              role: 'STUDENT',
              createdAt: new Date().toISOString(),
            },
            token: 'mock-token',
          },
        },
      };

      (api.post as any).mockResolvedValue(mockResponse);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.success).toBe(true);
      expect(localStorage.getItem('token')).toBe('mock-token');
      expect(localStorage.getItem('user')).toBeTruthy();
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'Password123',
      });
    });
  });

  describe('register', () => {
    it('should register successfully and store token', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              id: '1',
              email: 'newuser@example.com',
              name: 'New User',
              role: 'STUDENT',
              createdAt: new Date().toISOString(),
            },
            token: 'mock-token',
          },
        },
      };

      (api.post as any).mockResolvedValue(mockResponse);

      const result = await authService.register({
        email: 'newuser@example.com',
        password: 'Password123',
        name: 'New User',
        role: 'STUDENT',
      });

      expect(result.success).toBe(true);
      expect(localStorage.getItem('token')).toBe('mock-token');
    });
  });

  describe('logout', () => {
    it('should logout and clear localStorage', async () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: '1' }));

      (api.post as any).mockResolvedValue({ data: { success: true } });

      await authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(api.post).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('getStoredUser', () => {
    it('should return stored user from localStorage', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'STUDENT',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('user', JSON.stringify(user));

      const result = authService.getStoredUser();
      expect(result).toEqual(user);
    });

    it('should return null if no user stored', () => {
      const result = authService.getStoredUser();
      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if token exists', () => {
      localStorage.setItem('token', 'mock-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false if no token', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});

