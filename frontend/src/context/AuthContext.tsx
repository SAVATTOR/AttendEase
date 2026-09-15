import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { authService } from '@/services/authService';
import { checkDeviceRestriction, recordSuccessfulLogin } from '@/utils/restriction';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'STUDENT' | 'TEACHER';
  // Student-specific fields
  indexNumber?: string;
  session?: string;
  program?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<any>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    return authService.getStoredUser();
  });
  const [isLoading, setIsLoading] = useState(true); // Start with true to prevent redirect loops

  // Verify token on mount and refresh user data
  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      try {
        const token = authService.getToken();
        if (token) {
          try {
            const currentUser = await authService.getCurrentUser();
            if (isMounted) {
              if (currentUser) {
                setUser(currentUser);
                localStorage.setItem('user', JSON.stringify(currentUser));
              } else {
                // Token invalid, clear everything
                setUser(null);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
              }
            }
          } catch (error) {
            // Token invalid, clear everything silently
            if (isMounted) {
              setUser(null);
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          }
        } else {
          // No token, ensure user is null
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (error) {
        // Any error, clear everything
        if (isMounted) {
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } finally {
        // Always set loading to false after verification
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Set a timeout to ensure loading never gets stuck
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 2000); // Max 2 seconds for loading

    verifyAuth().then(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { getDeviceId } = await import('@/utils/device');
      const deviceId = getDeviceId();
      const response = await authService.login({ email, password, deviceId });
      if (response.success && response.data) {
        // Only apply device restriction for students, not teachers
        if (response.data.user.role === 'STUDENT') {
          const restriction = checkDeviceRestriction(email);
          if (!restriction.allowed) {
            // Logout since we already logged in
            await authService.logout();
            throw new Error(
              `Login blocked. Please wait ${restriction.remainingMinutes} minute${restriction.remainingMinutes === 1 ? '' : 's'} before logging in with a different account on this device.`
            );
          }
          recordSuccessfulLogin(email);
        }
        setUser(response.data.user);
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Invalid email or password';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      if (response.success && response.data) {
        // Only set user/token if verification is not required
        if (!response.data.requiresVerification && response.data.token) {
          setUser(response.data.user);
        } else {
          // Return the response so the component can handle verification
          return response;
        }
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || error.message || 'Registration failed';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Even if logout API fails, clear local storage
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return prevUser;
      const updatedUser = { ...prevUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && !isLoading, // Only authenticated if user exists and not loading
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function getUserRole(email: string): UserRole | null {
  // This function is kept for backward compatibility
  // In real implementation, you'd query the API or use the current user
  return null;
}
