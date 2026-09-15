import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Attendance } from '@/types';
import {
  QrCode,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  Square,
  Download,
  RefreshCw,
  Pause,
  Play,
  Map as MapIcon,
  List,
  ChevronDown,
  Settings,
} from 'lucide-react';
import { LocationMap, TeacherSessionMap } from '@/components/maps';
import { exportService } from '@/services/exportService';
import { qrService, QRSession, SessionAttendance } from '@/services/qrService';
import { classService, Class } from '@/services/classService';
import { settingsService, UserSettings } from '@/services/settingsService';
import { getSocket, joinTeacherClassRoom } from '@/services/socketService';

// QR refresh interval in milliseconds. The backend emits the authoritative value
// via the 'qr-session-started' socket event; this is the fallback until it arrives.
const DEFAULT_QR_REFRESH_INTERVAL_MS = 15000;

// Extended AttendanceWithLocation with location
interface AttendanceWithLocation extends Attendance {
  latitude: number;
  longitude: number;
}


export default function StartSession() {
  const location = useLocation();
  const { showToast } = useToast();
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [currentSession, setCurrentSession] = useState<QRSession | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSessionPaused, setIsSessionPaused] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [qrData, setQrData] = useState<string>('');
  const [countdown, setCountdown] = useState(DEFAULT_QR_REFRESH_INTERVAL_MS / 1000);
  const [qrRefreshIntervalMs, setQrRefreshIntervalMs] = useState<number>(DEFAULT_QR_REFRESH_INTERVAL_MS);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceWithLocation[]>([]);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [pausedAt, setPausedAt] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isLocating, setIsLocating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true); // Track if we're checking for active session

  const qrRefreshIntervalSeconds = Math.floor(qrRefreshIntervalMs / 1000);

  // Advanced session options (per-session overrides)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [sessionDurationMins, setSessionDurationMins] = useState(60);
  const [allowedRadius, setAllowedRadius] = useState(50);
  const [lateThresholdMinutes, setLateThresholdMinutes] = useState(15);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  // Fetch the lecturer's saved preferences (same /settings endpoint the Settings page
  // reads/writes) so Advanced Options is pre-filled with the latest saved values on
  // every page load, not just whatever was in memory when the page last mounted.
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const settings = await settingsService.getSettings();
        setUserSettings(settings);
        setSessionDurationMins(settings.defaultSessionDuration);
        setAllowedRadius(settings.defaultAllowedRadius);
        setLateThresholdMinutes(settings.lateThresholdMinutes);
      } catch (error) {
        console.error('Failed to load session preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  // Load class defaults when a class is selected, falling back to the lecturer's
  // saved preferences (rather than hardcoded literals) so a class without its own
  // explicit override still reflects what was saved on the Settings page.
  useEffect(() => {
    if (selectedClassId && classes.length > 0) {
      const selectedClass = classes.find(c => c.id === selectedClassId);
      if (selectedClass) {
        setSessionDurationMins(userSettings?.defaultSessionDuration ?? selectedClass.sessionDurationMins ?? 60);
        setAllowedRadius(userSettings?.defaultAllowedRadius ?? selectedClass.allowedRadius ?? 50);
        setLateThresholdMinutes(userSettings?.lateThresholdMinutes ?? selectedClass.lateThresholdMinutes ?? 15);
      }
    }
  }, [selectedClassId, classes, userSettings]);
  // Fetch session attendance (defined early so it can be used in restoration)
  const fetchSessionAttendance = useCallback(async (sessionId?: string) => {
    const targetSessionId = sessionId || currentSession?.id;
    if (!targetSessionId) return;
    try {
      const data: SessionAttendance = await qrService.getSessionAttendance(targetSessionId);
      const records: AttendanceWithLocation[] = data.attendances.map((a: any) => ({
        id: a.id,
        studentId: a.student.id,
        student: {
          id: a.student.id,
          name: a.student.name,
          email: a.student.email,
          indexNumber: a.student.indexNumber,
        },
        classId: currentSession?.classId || '',
        qrSessionId: targetSessionId,
        status: a.status as any,
        markedAt: a.markedAt,
        distance: a.distance,
        latitude: (a as any).latitude || coordinates?.lat || 0,
        longitude: (a as any).longitude || coordinates?.lng || 0,
      }));
      setAttendanceRecords(records);
    } catch (error: any) {
      console.error('Failed to fetch attendance:', error);
    }
  }, [currentSession?.id, currentSession?.classId, coordinates]);

  // Check for active session in localStorage on mount and restore full state
  // This must run after classes are loaded
  useEffect(() => {
    const restoreActiveSession = async () => {
      const savedSessionId = localStorage.getItem('activeSessionId');
      const savedClassId = localStorage.getItem('activeSessionClassId');

      if (savedSessionId && savedClassId && !isSessionActive) {
        // Only restore if we don't already have an active session
        await checkActiveSession(savedClassId, savedSessionId);
      }
      setIsRestoringSession(false); // Mark restoration as complete
    };

    // Wait for classes to load before restoring session
    if (!isLoadingClasses) {
      if (classes.length > 0) {
        restoreActiveSession();
      } else {
        // If no classes, still mark restoration as complete
        setIsRestoringSession(false);
      }
    }
  }, [isLoadingClasses, classes.length, isSessionActive]);

  const checkActiveSession = async (classId: string, sessionId: string) => {
    try {
      // Use getActiveSession to get session details without modifying state
      const session = await qrService.getActiveSession(classId);

      if (!session || session.id !== sessionId) {
        // Session doesn't exist or doesn't match - clear storage
        localStorage.removeItem('activeSessionId');
        localStorage.removeItem('activeSessionClassId');
        localStorage.removeItem('activeSessionClassCode');
        setIsRestoringSession(false);
        return;
      }

      // Restore all session state in the correct order
      setSelectedClassId(session.classId);
      setQrData(session.token);
      setIsSessionPaused(session.status === 'PAUSED');
      setIsSessionActive(true); // Set this last so UI updates correctly
      setCurrentSession(session);

      // Restore paused state
      if (session.status === 'PAUSED' && session.pausedAt) {
        setPausedAt(new Date(session.pausedAt));
      }

      // Restore location if available
      if (session.latitude && session.longitude) {
        setCoordinates({ lat: session.latitude, lng: session.longitude });
        setLocationGranted(true);
      }

      // Calculate session duration from start time
      if (session.createdAt) {
        const startTime = new Date(session.createdAt).getTime();
        const now = Date.now();
        const duration = Math.floor((now - startTime) / 1000);
        setSessionDuration(duration);
      }

      // Fetch attendance records using the session ID
      try {
        const data: SessionAttendance = await qrService.getSessionAttendance(session.id);
        const records: AttendanceWithLocation[] = data.attendances.map((a: any) => ({
          id: a.id,
          studentId: a.student.id,
          student: {
            id: a.student.id,
            name: a.student.name,
            email: a.student.email,
            indexNumber: a.student.indexNumber,
          },
          classId: session.classId,
          qrSessionId: session.id,
          status: a.status as any,
          markedAt: a.markedAt,
          distance: a.distance,
          latitude: (a as any).latitude || session.latitude || 0,
          longitude: (a as any).longitude || session.longitude || 0,
        }));
        setAttendanceRecords(records);
      } catch (attendanceError) {
        console.error('Failed to fetch attendance during restoration:', attendanceError);
        // Continue even if attendance fetch fails
      }

      showToast('info', 'Session restored', 'Returned to your active session');
      setIsRestoringSession(false);
    } catch (error: any) {
      console.error('Failed to restore session:', error);
      // Clear storage if session restoration fails
      localStorage.removeItem('activeSessionId');
      localStorage.removeItem('activeSessionClassId');
      localStorage.removeItem('activeSessionClassCode');
      setIsRestoringSession(false);
    }
  };

  // Pre-fill class from navigation state (when coming from template/class card)
  // But prevent if there's an active session
  useEffect(() => {
    if (location.state?.classId && !isSessionActive) {
      setSelectedClassId(location.state.classId);
    } else if (location.state?.classId && isSessionActive && currentSession) {
      // If there's an active session, show warning and don't change class
      const activeClass = classes.find(c => c.id === currentSession.classId);
      showToast('warning', 'Active session in progress', `You have a live attendance session for ${activeClass?.code || 'a class'} course. Please end it before starting a new one.`);
    }
  }, [location.state, isSessionActive, currentSession, classes, showToast]);

  // Load classes on mount
  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setIsLoadingClasses(true);
      const response = await classService.getMyClasses(1, 100);
      // Backend returns: { success: true, data: [...], pagination: {...} }
      // classService.getMyClasses() returns { data: [...], pagination: {...} }
      const classesPayload = response?.data?.data ?? response?.data ?? [];
      setClasses(Array.isArray(classesPayload) ? classesPayload : []);
    } catch (error: any) {
      console.error('Failed to load classes:', error);
      showToast('error', 'Failed to load classes', error.response?.data?.message || 'Please try again');
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length;
  const lateCount = attendanceRecords.filter(r => r.status === 'LATE').length;
  const totalEnrolled = selectedClass?._count?.enrollments || 0;
  const remainingCount = totalEnrolled - attendanceRecords.length;

  // Request location permission
  const requestLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationGranted(true);
          setIsLocating(false);
          showToast('success', 'Location enabled', 'Your location will be used for attendance verification');
        },
        () => {
          setIsLocating(false);
          showToast('error', 'Location denied', 'Please enable location to start a session');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }
  };

  // Refresh QR token
  const refreshQRToken = useCallback(async () => {
    if (!currentSession?.id) return;
    try {
      const result = await qrService.refreshToken(currentSession.id);
      setQrData(result.token);
      setCountdown(Math.floor(qrRefreshIntervalMs / 1000));
    } catch (error: any) {
      console.error('Failed to refresh token:', error);
      showToast('error', 'Failed to refresh QR code', error.response?.data?.message || 'Please try again');
    }
  }, [currentSession?.id, qrRefreshIntervalMs, showToast]);


  // Start session
  const startSession = async () => {
    if (!selectedClassId) {
      showToast('error', 'Please select a class');
      return;
    }

    // Check if there's already an active session
    if (isSessionActive && currentSession) {
      const activeClass = classes.find(c => c.id === currentSession.classId);
      showToast('warning', 'Session already active', `You have a live attendance session for ${activeClass?.code || 'a class'} course. Please end it before starting a new one.`);
      return;
    }

    if (!locationGranted || !coordinates) {
      requestLocation();
      return;
    }

    setIsStarting(true);
    try {
      const session = await qrService.generateSession({
        classId: selectedClassId,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        duration: sessionDurationMins,
        allowedRadius: allowedRadius,
        lateThresholdMinutes: lateThresholdMinutes,
      });

      setCurrentSession(session);
      // Save session state to localStorage for restoration
      localStorage.setItem('activeSessionId', session.id);
      localStorage.setItem('activeSessionClassId', session.classId);
      // Save class code for toast reminder
      const sessionClass = classes.find(c => c.id === selectedClassId);
      if (sessionClass) {
        localStorage.setItem('activeSessionClassCode', sessionClass.code);
      }
      setQrData(session.token);
      setIsSessionActive(true);
      setIsSessionPaused(false);
      setSessionEnded(false);
      setAttendanceRecords([]);
      setSessionDuration(0);
      setPausedAt(null);
      setCountdown(Math.floor(qrRefreshIntervalMs / 1000));
      // Let the backend drive QR auto-refresh and join the class room for socket events
      const socket = getSocket();
      if (socket) {
        socket.emit('start-qr-session', { sessionId: session.id, classId: session.classId });
        joinTeacherClassRoom(session.classId);
      }
      showToast('success', 'Session started!', 'Students can now scan to mark attendance');
    } catch (error: any) {
      console.error('Failed to start session:', error);
      showToast('error', 'Failed to start session', error.response?.data?.message || 'Please try again');
    } finally {
      setIsStarting(false);
    }
  };

  // Pause session
  const pauseSession = async () => {
    if (!currentSession?.id) return;
    setIsPausing(true);
    try {
      const updatedSession = await qrService.pauseSession(currentSession.id);
      setCurrentSession(updatedSession);
      setIsSessionPaused(true);
      setPausedAt(updatedSession.pausedAt ? new Date(updatedSession.pausedAt) : new Date());
      // Update localStorage to maintain session state
      localStorage.setItem('activeSessionId', updatedSession.id);
      localStorage.setItem('activeSessionClassId', updatedSession.classId);
      showToast('warning', 'Session paused', 'Students cannot mark attendance while paused');
    } catch (error: any) {
      console.error('Failed to pause session:', error);
      showToast('error', 'Failed to pause session', error.response?.data?.message || 'Please try again');
    } finally {
      setIsPausing(false);
    }
  };

  // Resume session
  const resumeSession = async () => {
    if (!currentSession?.id) return;
    setIsPausing(true);
    try {
      const updatedSession = await qrService.resumeSession(currentSession.id);
      setCurrentSession(updatedSession);
      setIsSessionPaused(false);
      setPausedAt(null);
      setQrData(updatedSession.token);
      setCountdown(Math.floor(qrRefreshIntervalMs / 1000));
      // Restart the backend auto-refresh interval (it clears while paused)
      const socket = getSocket();
      if (socket) {
        socket.emit('start-qr-session', { sessionId: currentSession.id, classId: currentSession.classId });
        joinTeacherClassRoom(currentSession.classId);
      }
      // Update localStorage to maintain session state
      localStorage.setItem('activeSessionId', updatedSession.id);
      localStorage.setItem('activeSessionClassId', updatedSession.classId);
      showToast('success', 'Session resumed', 'Students can now continue marking attendance');
    } catch (error: any) {
      console.error('Failed to resume session:', error);
      showToast('error', 'Failed to resume session', error.response?.data?.message || 'Please try again');
    } finally {
      setIsPausing(false);
    }
  };

  // End session
  const endSession = async () => {
    if (!currentSession?.id) return;
    setIsEnding(true);
    try {
      // Stop the backend auto-refresh interval
      const socket = getSocket();
      if (socket) {
        socket.emit('stop-qr-session', { sessionId: currentSession.id, classId: currentSession.classId });
      }

      await qrService.endSession(currentSession.id);
      // Clear all session-related localStorage and stale session state
      localStorage.removeItem('activeSessionId');
      localStorage.removeItem('activeSessionClassId');
      localStorage.removeItem('activeSessionClassCode');
      setIsSessionActive(false);
      setIsSessionPaused(false);
      setSessionEnded(true);
      setQrData('');
      setSessionDuration(0);
      showToast('success', 'Session ended', `${attendanceRecords.length} students marked attendance`);
    } catch (error: any) {
      console.error('Failed to end session:', error);
      showToast('error', 'Failed to end session', error.response?.data?.message || 'Please try again');
    } finally {
      setIsEnding(false);
    }
  };

  // QR refresh countdown
  useEffect(() => {
    if (!isSessionActive || isSessionPaused || !currentSession) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          refreshQRToken();
          return qrRefreshIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSessionActive, isSessionPaused, currentSession, refreshQRToken, qrRefreshIntervalSeconds]);

  // Sync QR refresh interval and QR token from backend-driven socket events
  useEffect(() => {
    if (!isSessionActive || !currentSession?.id) return;

    const socket = getSocket();
    if (!socket) return;

    const handleSessionStarted = (data: { sessionId: string; interval?: number }) => {
      if (data.sessionId === currentSession.id && data?.interval) {
        setQrRefreshIntervalMs(data.interval);
        setCountdown(Math.floor(data.interval / 1000));
      }
    };

    const handleQrRefreshed = (data: { sessionId: string; token?: string }) => {
      if (data.sessionId === currentSession.id && data?.token) {
        setQrData(data.token);
        setCountdown(qrRefreshIntervalSeconds);
      }
    };

    socket.on('qr-session-started', handleSessionStarted);
    socket.on('qr-refreshed', handleQrRefreshed);

    return () => {
      socket.off('qr-session-started', handleSessionStarted);
      socket.off('qr-refreshed', handleQrRefreshed);
    };
  }, [isSessionActive, currentSession?.id, qrRefreshIntervalSeconds]);

  // Listen for new attendance via WebSocket (more efficient than polling)
  useEffect(() => {
    if (!isSessionActive || !currentSession?.id || !selectedClassId) return;

    const socket = getSocket();
    if (!socket) return;

    const handleNewAttendance = (data: {
      studentId: string;
      studentName: string;
      status: string;
      markedAt: string;
      classId: string;
    }) => {
      // Only handle if it's for the current session's class
      if (data.classId === selectedClassId) {
        fetchSessionAttendance(); // Refresh attendance list
      }
    };

    socket.on('new-attendance', handleNewAttendance);

    // Still poll as backup, but less frequently
    const interval = setInterval(() => {
      fetchSessionAttendance();
    }, 10000); // Poll every 10 seconds as backup

    // Initial fetch
    fetchSessionAttendance();

    return () => {
      socket.off('new-attendance', handleNewAttendance);
      clearInterval(interval);
    };
  }, [isSessionActive, currentSession?.id, selectedClassId, fetchSessionAttendance]);

  // Session duration timer
  useEffect(() => {
    if (!isSessionActive || isSessionPaused) return;

    const timer = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isSessionActive, isSessionPaused]);


  const handleDownloadReport = async () => {
    if (!currentSession?.id) {
      showToast('error', 'No session', 'Please start a session first to download a report');
      return;
    }
    setIsExporting(true);
    try {
      await exportService.exportSessionAttendanceCSV(currentSession.id);
      showToast('success', 'Report downloaded', 'Attendance report has been saved');
    } catch (error: any) {
      console.error('Export error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Could not generate the report. Please try again.';
      showToast('error', 'Download failed', errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Start Session</h1>
          <p className="text-muted-foreground mt-1">Generate QR codes for student attendance</p>
        </div>

        {isRestoringSession ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Restoring session...</p>
          </div>
        ) : !isSessionActive && !sessionEnded ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            {isLoadingClasses ? (
              <div className="bg-card rounded-xl border border-border shadow-soft p-12">
                <div className="flex flex-col items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Loading classes...</p>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border shadow-soft p-6 space-y-6">
                {/* Class Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Class</label>
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.length === 0 ? (
                        <SelectItem value="none" disabled>No classes available</SelectItem>
                      ) : (
                        classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.code})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  {coordinates && locationGranted ? (
                    <div className="rounded-lg overflow-hidden border border-border">
                      <LocationMap
                        center={coordinates}
                        height="200px"
                        zoom={16}
                        showRadius={true}
                        allowedRadius={selectedClass?.allowedRadius || 50}
                      />
                      <div className="bg-muted/50 p-2 text-xs text-center text-muted-foreground">
                        Session center location
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted border-border">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted">
                        {isLocating ? (
                          <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                          <MapPin className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {isLocating ? 'Determining location...' : 'Enable location'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isLocating ? 'Please wait a moment' : 'Required for proximity verification'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={requestLocation}
                        disabled={isLocating}
                      >
                        {isLocating ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                            Locating
                          </>
                        ) : (
                          'Enable'
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Advanced Options (Collapsible) */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">Advanced Options</span>
                      <span className="text-xs text-muted-foreground">(Override defaults for this session)</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showAdvancedOptions && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 space-y-5 border-t border-border">
                          {/* Session Duration */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Session Duration</label>
                            <Select
                              value={sessionDurationMins.toString()}
                              onValueChange={(v) => setSessionDurationMins(parseInt(v))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="45">45 minutes</SelectItem>
                                <SelectItem value="60">60 minutes</SelectItem>
                                <SelectItem value="90">90 minutes</SelectItem>
                                <SelectItem value="120">120 minutes</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">How long the QR code will remain active</p>
                          </div>

                          {/* Allowed Radius */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Allowed Radius</label>
                              <span className="text-sm font-medium text-primary">{allowedRadius}m</span>
                            </div>
                            <Slider
                              value={[allowedRadius]}
                              onValueChange={(v) => setAllowedRadius(v[0])}
                              min={10}
                              max={200}
                              step={5}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>10m</span>
                              <span>200m</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Maximum distance students can be from you to mark attendance</p>
                          </div>

                          {/* Late Threshold */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Late Threshold</label>
                            <Select
                              value={lateThresholdMinutes.toString()}
                              onValueChange={(v) => setLateThresholdMinutes(parseInt(v))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5 minutes</SelectItem>
                                <SelectItem value="10">10 minutes</SelectItem>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="20">20 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Students marking after this time will be marked as "Late"</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Start Button */}
                <Button
                  variant="gradient"
                  size="xl"
                  className="w-full"
                  onClick={startSession}
                  disabled={!selectedClassId || !locationGranted || isStarting}
                >
                  {isStarting ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-5 h-5 mr-2" />
                      Start Session
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        ) : null}

        {/* Active Session */}
        <AnimatePresence mode="wait">
          {isSessionActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid lg:grid-cols-2 gap-8"
            >
              {/* QR Code Section */}
              <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isSessionPaused && (
                      <Badge variant="warning" className="animate-pulse">
                        <Pause className="w-3 h-3 mr-1" />
                        Paused
                      </Badge>
                    )}
                    <div>
                      <h2 className="font-display font-semibold text-lg">{selectedClass?.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {isSessionPaused ? 'Session paused' : 'Scan to mark attendance'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    {formatDuration(sessionDuration)}
                  </div>
                </div>

                <div className="p-8 flex flex-col items-center">
                  {/* QR Code or Paused State */}
                  <div className="relative mb-6">
                    {isSessionPaused ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-[460px] max-w-[90vw] h-[460px] max-h-[90vw] bg-muted rounded-2xl flex flex-col items-center justify-center"
                      >
                        <Pause className="w-16 h-16 text-muted-foreground mb-4" />
                        <p className="text-lg font-semibold text-muted-foreground">SESSION PAUSED</p>
                        {pausedAt && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Paused at: {pausedAt.toLocaleTimeString()}
                          </p>
                        )}
                      </motion.div>
                    ) : (
                      <>
                        <motion.div
                          key={qrData}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-primary-foreground p-4 rounded-2xl shadow-lg"
                        >
                          {/* Medium error correction + a short opaque token (not a JWT) keep the
                              module count low, and includeMargin keeps the required quiet-zone
                              border, so the code stays reliably scannable at a distance. */}
                          <QRCodeSVG
                            value={qrData}
                            size={440}
                            level="M"
                            includeMargin={true}
                          />
                        </motion.div>

                        {/* Countdown Ring */}
                        <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-card rounded-full border-2 border-border flex items-center justify-center shadow-md">
                          <svg className="w-10 h-10 circular-progress" viewBox="0 0 40 40">
                            <circle className="circular-progress-track" cx="20" cy="20" r="16" />
                            <circle
                              className="circular-progress-fill"
                              cx="20"
                              cy="20"
                              r="16"
                              strokeDasharray="100"
                              strokeDashoffset={100 - (countdown / qrRefreshIntervalSeconds) * 100}
                            />
                          </svg>
                          <span className="absolute text-sm font-bold">{countdown}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {!isSessionPaused && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {`QR refreshes every ${qrRefreshIntervalSeconds} seconds`}
                    </div>
                  )}

                  {isSessionPaused && (
                    <p className="text-sm text-muted-foreground mb-6 text-center">
                      Students cannot mark attendance while paused
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex gap-6 mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-display font-bold text-success">{presentCount}</p>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-display font-bold text-warning">{lateCount}</p>
                      <p className="text-xs text-muted-foreground">Late</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-display font-bold text-muted-foreground">{remainingCount}</p>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                    </div>
                  </div>

                  {/* Session Controls */}
                  <div className="flex gap-3 w-full max-w-sm">
                    {isSessionPaused ? (
                      <Button
                        variant="default"
                        size="lg"
                        className="flex-1 bg-success hover:bg-success/90"
                        onClick={resumeSession}
                        disabled={isPausing}
                      >
                        {isPausing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Resuming...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Resume
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="lg"
                        className="flex-1 bg-warning hover:bg-warning/90 text-warning-foreground"
                        onClick={pauseSession}
                        disabled={isPausing}
                      >
                        {isPausing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Pausing...
                          </>
                        ) : (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="lg"
                      className="flex-1"
                      onClick={endSession}
                      disabled={isEnding}
                    >
                      {isEnding ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Ending...
                        </>
                      ) : (
                        <>
                          <Square className="w-4 h-4 mr-2" />
                          End Session
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Live Attendance Feed / Map */}
              <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden flex flex-col" style={{ height: '600px' }}>
                <div className="p-6 border-b border-border flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display font-semibold text-lg">
                      {isSessionPaused ? 'Attendance' : 'Live Attendance'}
                    </h2>
                    {!isSessionPaused && (
                      <Badge variant="outline" className="text-success border-success/30 bg-success/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse mr-1" />
                        Live
                      </Badge>
                    )}
                  </div>

                  {/* View Toggle */}
                  <div className="flex bg-muted p-1 rounded-lg">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-md transition-all ${viewMode === 'list'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`p-1.5 rounded-md transition-all ${viewMode === 'map'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      <MapIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden relative">
                  {viewMode === 'map' ? (
                    coordinates ? (
                      <TeacherSessionMap
                        teacherLocation={coordinates}
                        allowedRadius={selectedClass?.allowedRadius || 50}
                        students={attendanceRecords.map(r => ({
                          id: r.studentId,
                          name: r.student?.name || 'Unknown',
                          lat: r.latitude,
                          lng: r.longitude,
                          status: r.status as any,
                          distance: r.distance,
                          markedAt: r.markedAt
                        }))}
                        height="100%"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Location unavailable
                      </div>
                    )
                  ) : (
                    <div className="h-full overflow-y-auto">
                      {attendanceRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <Users className="w-12 h-12 mb-4 opacity-50" />
                          <p>Waiting for students...</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          <AnimatePresence>
                            {attendanceRecords.map((r, index) => (
                              <motion.div
                                key={r.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 flex items-center justify-between hover:bg-muted/50"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${r.status === 'PRESENT' ? 'bg-success/10' : 'bg-warning/10'
                                    }`}>
                                    <span className={`text-sm font-medium ${r.status === 'PRESENT' ? 'text-success' : 'text-warning'
                                      }`}>
                                      {(r.student?.name || 'U').split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium">{r.student?.name}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {r.distance}m away
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge variant={r.status === 'PRESENT' ? 'present' : 'late'}>
                                    {r.status.toLowerCase()}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(r.markedAt).toLocaleTimeString()}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Session Ended */}
        {sessionEnded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <div className="bg-card rounded-xl border border-border shadow-soft p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-display font-bold mb-2">Session Complete</h2>
              <p className="text-muted-foreground mb-6">
                {attendanceRecords.length} students marked attendance
              </p>

              <div className="flex gap-4 mb-6 justify-center">
                <div className="bg-success/10 px-4 py-2 rounded-lg">
                  <p className="text-2xl font-bold text-success">{presentCount}</p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
                <div className="bg-warning/10 px-4 py-2 rounded-lg">
                  <p className="text-2xl font-bold text-warning">{lateCount}</p>
                  <p className="text-xs text-muted-foreground">Late</p>
                </div>
                <div className="bg-destructive/10 px-4 py-2 rounded-lg">
                  <p className="text-2xl font-bold text-destructive">{remainingCount}</p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleDownloadReport} disabled={isExporting}>
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Report
                    </>
                  )}
                </Button>
                <Button
                  variant="gradient"
                  className="flex-1"
                  onClick={() => {
                    setSessionEnded(false);
                    setSelectedClassId('');
                    setCoordinates(null);
                    setLocationGranted(false);
                  }}
                >
                  New Session
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
