import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Camera, RefreshCw, MapPin, X } from 'lucide-react';
import { StudentLocationMap } from '@/components/maps';
import { attendanceService } from '@/services/attendanceService';
import { qrService } from '@/services/qrService';

type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

interface LocationData {
  lat: number;
  lng: number;
  isWithinRange: boolean;
  distance: number;
}

export default function MarkAttendance() {
  const { showToast } = useToast();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<{ className: string; time: string; status: string } | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [teacherLocation, setTeacherLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [allowedRadius, setAllowedRadius] = useState(50);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [scanFlash, setScanFlash] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  // html5-qrcode keeps decoding at ~10fps until stop() resolves, and the success
  // callback closure is fixed at scanner.start() time (won't see later re-renders),
  // so a plain state check can't guard re-entrancy - this ref can.
  const isHandlingScanRef = useRef(false);
  const qrReaderRef = useRef<HTMLDivElement | null>(null);

  const handleLocationVerified = (location: { lat: number; lng: number }, isWithinRange: boolean, distance: number) => {
    // Only update location data if we have valid coordinates and distance
    // This prevents the map component from overwriting correct location data with invalid values
    if (location &&
      location.lat && location.lng &&
      !isNaN(location.lat) && !isNaN(location.lng) &&
      distance !== undefined && distance !== null && !isNaN(distance) &&
      distance < 1000000) { // Sanity check: distance should be less than 1000km
      setLocationData({ ...location, isWithinRange, distance });
    }
  };

  useEffect(() => {
    // Cleanup scanner on unmount - this is critical to prevent white screen
    return () => {
      const cleanup = async () => {
        try {
          if (scannerRef.current) {
            try {
              const scanner = scannerRef.current;
              scannerRef.current = null; // Clear reference first to prevent race conditions
              await scanner.stop();
            } catch (stopError) {
              // Ignore stop errors - scanner might already be stopped
              console.debug('Scanner stop error (safe to ignore):', stopError);
            }
          }
        } catch (error) {
          console.debug('Scanner cleanup error (safe to ignore):', error);
        }
      };
      cleanup();
    };
  }, []);

  const startScanner = async () => {
    isHandlingScanRef.current = false;
    try {
      // Check if camera permissions are available
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Request camera permission first
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          // Stop the stream immediately - we just needed permission
          stream.getTracks().forEach(track => track.stop());
        } catch (permissionError: any) {
          console.error('Camera permission error:', permissionError);
          setScanState('error');

          if (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError') {
            setErrorMessage('Camera permission denied. Please enable camera access in your browser settings and try again.');
            showToast('error', 'Camera permission denied', 'Please allow camera access in your browser settings');
          } else if (permissionError.name === 'NotFoundError' || permissionError.name === 'DevicesNotFoundError') {
            setErrorMessage('No camera found. Please ensure your device has a camera and try again.');
            showToast('error', 'No camera found', 'Please check if your device has a camera');
          } else {
            setErrorMessage('Unable to access camera. Please check your browser settings and try again.');
            showToast('error', 'Camera access error', 'Please check your browser settings');
          }
          return;
        }
      } else {
        throw new Error('Camera API not supported in this browser');
      }

      // Request location permission before starting scanner
      if (!locationPermissionGranted) {
        try {
          const hasPermission = await checkLocationPermission();
          if (!hasPermission) {
            setScanState('error');
            setErrorMessage('Location permission is required to mark attendance. Please enable location access in your browser settings and try again.');
            showToast('error', 'Location permission required', 'Please allow location access to continue');
            return;
          }
        } catch (locationError: any) {
          console.error('Location permission error:', locationError);
          setScanState('error');
          setErrorMessage('Location permission is required to mark attendance. Please enable location access in your browser settings and try again.');
          showToast('error', 'Location permission required', 'Please allow location access to continue');
          return;
        }
      }

      setScanState('scanning');

      // Wait for React to render the DOM element - use a more reliable approach
      const waitForElement = (elementId: string, maxAttempts = 100, interval = 50): Promise<HTMLElement> => {
        return new Promise((resolve, reject) => {
          let attempts = 0;
          const checkElement = () => {
            const element = document.getElementById(elementId);
            if (element && element.offsetParent !== null) {
              // Element exists and is visible
              resolve(element);
            } else if (attempts < maxAttempts) {
              attempts++;
              setTimeout(checkElement, interval);
            } else {
              reject(new Error('Scanner element not found or not visible after waiting'));
            }
          };
          // Start checking after a small delay to let React render
          setTimeout(checkElement, 50);
        });
      };

      try {
        // Wait for the element to be rendered and visible
        await waitForElement('qr-reader');

        // Additional delay to ensure element is fully ready and mounted
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(resolve, 100);
            });
          });
        });

        const element = document.getElementById('qr-reader');
        if (!element) {
          throw new Error('Scanner element not found');
        }

        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          {
            facingMode: 'environment',
            // `focusMode` isn't in the standard MediaTrackConstraints typing, but Chrome/Android
            // support it for sharper, faster-focusing capture at range.
            advanced: [{ focusMode: 'continuous' }],
          } as any,
          {
            // No `qrbox`: the library would otherwise draw its own dimmed/boxed
            // scan-region UI on top of ours. It scans the full video frame instead,
            // while `.qr-scanner-frame` below is purely a visual guide, same as iOS.
            fps: 10,
            disableFlip: false,
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Ignore scanning errors - they're normal during scanning
            console.debug('Scanning error (normal):', errorMessage);
          }
        );
      } catch (err: any) {
        console.error('Scanner error:', err);
        setScanState('error');

        if (err.message?.includes('element not found') || err.message?.includes('Scanner element')) {
          setErrorMessage('Failed to initialize scanner. Please refresh the page and try again.');
          showToast('error', 'Scanner initialization failed', 'Please refresh the page');
        } else if (err.name === 'NotAllowedError' || err.message?.includes('permission')) {
          setErrorMessage('Camera permission denied. Please enable camera access in your browser settings and try again.');
          showToast('error', 'Camera permission denied', 'Please allow camera access in your browser settings');
        } else if (err.name === 'NotFoundError' || err.message?.includes('camera')) {
          setErrorMessage('No camera found. Please ensure your device has a camera and try again.');
          showToast('error', 'No camera found', 'Please check if your device has a camera');
        } else {
          setErrorMessage('Unable to access camera. Please ensure you have granted camera permissions and try again.');
          showToast('error', 'Camera access error', err.message || 'Please check your browser settings');
        }
      }
    } catch (err: any) {
      console.error('Camera setup error:', err);
      setScanState('error');
      setErrorMessage('Camera not supported. Please use a device with a camera and a modern browser.');
      showToast('error', 'Camera not supported', 'Please use a device with camera support');
    }
  };

  const checkLocationPermission = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(false);
        return;
      }

      // Try to get position to trigger permission prompt
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationPermissionGranted(true);
          resolve(true);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationPermissionGranted(false);
            resolve(false);
          } else {
            // Other errors (timeout, unavailable) - permission might be granted but location unavailable
            setLocationPermissionGranted(true);
            resolve(true);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        }
      );
    });
  };

  const playScanFeedback = () => {
    try {
      if (navigator.vibrate) navigator.vibrate(150);
    } catch {
      // Vibration API unsupported - ignore
    }
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.value = 0.1;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.12);
      oscillator.onended = () => ctx.close();
    } catch {
      // Web Audio API unsupported - ignore
    }
  };

  const handleScanSuccess = async (data: string) => {
    // The scanner keeps decoding frames until stop() resolves, so guard against
    // this firing again for the same still-in-view code while we're mid-transition.
    if (isHandlingScanRef.current) return;
    isHandlingScanRef.current = true;

    playScanFeedback();
    if (scannerRef.current) {
      await scannerRef.current.stop();
    }
    // Briefly flash the corner brackets green before transitioning, mirroring the
    // quick highlight-then-act behavior of iOS's code scanner.
    setScanFlash(true);
    await new Promise((resolve) => setTimeout(resolve, 180));
    setScanFlash(false);
    setScanState('processing');

    try {
      // The QR code contains a short opaque session token, not a full URL or JWT
      const token = data.trim();

      // Get student's current location first
      let studentLat: number;
      let studentLng: number;

      try {
        const location = await getCurrentLocation();
        studentLat = location.lat;
        studentLng = location.lng;

        // Set location data immediately so map can use it (prevents "Location not available" flash)
        setLocationData({
          lat: studentLat,
          lng: studentLng,
          isWithinRange: true, // Will be updated after API response
          distance: 0, // Will be updated after API response
        });
      } catch (locationError: any) {
        setScanState('error');
        setErrorMessage(locationError.message || 'Failed to get your location. Please enable location access and try again.');
        showToast('error', 'Location error', locationError.message || 'Please enable location access');
        return;
      }

      // Validate QR token first to get teacher location for the map
      let validationResult;
      try {
        validationResult = await qrService.validateQR({
          token,
          latitude: studentLat,
          longitude: studentLng,
        });

        // Set teacher location for map display
        setTeacherLocation({
          lat: validationResult.teacherLocation.latitude,
          lng: validationResult.teacherLocation.longitude,
        });
        setAllowedRadius(validationResult.allowedRadius);
      } catch (validationError: any) {
        // If validation fails, still try to mark attendance (it will validate again)
        console.warn('QR validation failed, proceeding with attendance marking:', validationError);
      }

      // Call the actual API to mark attendance
      const response = await attendanceService.markAttendance({
        token,
        latitude: studentLat,
        longitude: studentLng,
      });

      // Check if enrollment is pending
      if (response.message?.includes('enrollment request is pending') || response.message?.includes('pending approval')) {
        setScanState('error');
        setErrorMessage('You are not enrolled in this class. Enrollment request has been sent to your lecturer.');
        showToast('info', 'Enrollment Request Sent', 'Your lecturer will review your enrollment request');
        return;
      }

      // Success - attendance marked
      const attendance = response.data;

      // Only update location data if we have valid distance from the API response
      // This ensures we use the correct coordinates, not the map component's potentially incorrect ones
      if (attendance.distance !== undefined && attendance.distance !== null && !isNaN(attendance.distance)) {
        setLocationData({
          lat: studentLat,
          lng: studentLng,
          isWithinRange: attendance.isWithinRange ?? true,
          distance: attendance.distance,
        });
      }

      // Check if location was out of range (even though attendance was recorded)
      if (!attendance.isWithinRange) {
        setScanState('error');
        setErrorMessage(`You are too far from the class location (${Math.round(attendance.distance)}m away). Please move closer.`);
        showToast('warning', 'Location Issue', `You are ${Math.round(attendance.distance)}m away from the class`);
        return;
      }

      setScanState('success');
      setSuccessData({
        className: attendance.class?.name || validationResult?.className || 'Unknown Class',
        time: new Date(attendance.markedAt).toLocaleTimeString(),
        status: attendance.status === 'PRESENT' ? 'Present' : attendance.status === 'LATE' ? 'Late' : 'Present',
      });

      showToast('success', 'Attendance marked!', `Marked as ${attendance.status}`);
    } catch (error: any) {
      console.error('Attendance marking error:', error);
      setScanState('error');

      // Handle specific error cases
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;

        if (errorMessage.includes('enrollment request is pending') || errorMessage.includes('pending approval')) {
          setErrorMessage('You are not enrolled in this class. Enrollment request has been sent to your lecturer.');
          showToast('info', 'Enrollment Request Sent', 'Your lecturer will review your enrollment request');
        } else if (errorMessage.includes('already marked')) {
          setErrorMessage('You have already marked attendance for this session.');
          showToast('warning', 'Already Marked', 'You have already marked attendance for this session');
        } else if (errorMessage.includes('expired') || errorMessage.includes('ended')) {
          setErrorMessage('This QR session has expired or ended. Please ask your lecturer for a new QR code.');
          showToast('error', 'Session Expired', 'Please scan a new QR code');
        } else if (errorMessage.includes('location') || errorMessage.includes('range')) {
          setErrorMessage(errorMessage);
          showToast('warning', 'Location Issue', errorMessage);
        } else {
          setErrorMessage(errorMessage);
          showToast('error', 'Error', errorMessage);
        }
      } else if (error.message) {
        setErrorMessage(error.message);
        showToast('error', 'Error', error.message);
      } else {
        setErrorMessage('Failed to mark attendance. Please try again.');
        showToast('error', 'Error', 'Failed to mark attendance');
      }
    }
  };

  const resetScanner = () => {
    setScanState('idle');
    setErrorMessage('');
    setSuccessData(null);
    setLocationData(null);
    setTeacherLocation(null);
  };

  // Note: Scanner cleanup is handled by the first useEffect at component mount

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold mb-2">Mark Attendance</h1>
          <p className="text-muted-foreground">Scan your lecturer's QR code</p>
        </div>

        <AnimatePresence mode="wait">
          {scanState === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-card rounded-xl border border-border shadow-soft p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Camera className="w-10 h-10 text-primary" />
              </div>
              <p className="text-muted-foreground mb-6">Position your camera to scan the QR code displayed by your lecturer</p>
              <div className="space-y-3">
                <Button variant="gradient" size="lg" onClick={startScanner} className="w-full">
                  <Camera className="w-5 h-5 mr-2" />
                  Start Scanning
                </Button>
                {!locationPermissionGranted && (
                  <p className="text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    Location access will be requested to verify your attendance
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {scanState === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black"
            >
              <div id="qr-reader" />
              <div className="qr-scanner-overlay">
                <div className={`qr-scanner-frame ${scanFlash ? 'qr-scanner-frame-success' : ''}`}>
                  <span className="qr-corner qr-corner-tl" />
                  <span className="qr-corner qr-corner-tr" />
                  <span className="qr-corner qr-corner-bl" />
                  <span className="qr-corner qr-corner-br" />
                </div>
                <p className="qr-scanner-hint">Point your camera at the lecturer's QR code</p>
              </div>
              <button
                type="button"
                onClick={() => { isHandlingScanRef.current = false; scannerRef.current?.stop(); setScanState('idle'); }}
                className="qr-scanner-close"
                aria-label="Cancel scanning"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {scanState === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="bg-card rounded-xl border border-border shadow-soft p-8 text-center">
                <RefreshCw className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                <p className="font-medium">Verifying your location...</p>
              </div>

              {/* Show location map while processing - only if we have teacher location */}
              {teacherLocation && locationData && (
                <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
                  <StudentLocationMap
                    teacherLocation={teacherLocation}
                    allowedRadius={allowedRadius}
                    onLocationVerified={undefined}
                    height="200px"
                    autoRequestLocation={false}
                    initialStudentLocation={{ lat: locationData.lat, lng: locationData.lng }}
                  />
                </div>
              )}
            </motion.div>
          )}

          {scanState === 'success' && successData && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="bg-card rounded-xl border border-success/30 shadow-soft p-8 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                  <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                </motion.div>
                <h2 className="text-xl font-display font-bold text-success mb-2">Attendance Marked!</h2>
                <p className="font-medium mb-1">{successData.className}</p>
                <p className="text-sm text-muted-foreground mb-4">{successData.time}</p>
                <div className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${successData.status === 'Present' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                  {successData.status}
                </div>

                {locationData && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>You were {locationData.distance.toFixed(0)}m from class center</span>
                    </div>
                  </div>
                )}

                <Button variant="outline" className="w-full mt-6" onClick={resetScanner}>Scan Again</Button>
              </div>
            </motion.div>
          )}

          {scanState === 'error' && (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="bg-card rounded-xl border border-destructive/30 shadow-soft p-8 text-center">
                <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-display font-bold text-destructive mb-2">Unable to Mark</h2>
                <p className="text-muted-foreground mb-4">{errorMessage}</p>

                {errorMessage.includes('permission') && (
                  <div className="bg-muted/50 rounded-lg p-4 mb-4 text-left text-sm">
                    <p className="font-medium mb-2">How to enable camera access:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Check your browser's address bar for a camera icon</li>
                      <li>Click the icon and select "Allow" for camera access</li>
                      <li>On mobile: Go to Settings → Site Settings → Camera → Allow</li>
                      <li>Refresh the page and try again</li>
                    </ul>
                  </div>
                )}

                <Button variant="outline" className="w-full" onClick={resetScanner}>Try Again</Button>
              </div>

              {/* Show map on error to help student understand */}
              {teacherLocation && (
                <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-medium text-center">Move closer to the green zone</p>
                  </div>
                  <StudentLocationMap
                    teacherLocation={teacherLocation}
                    allowedRadius={allowedRadius}
                    onLocationVerified={undefined}
                    height="250px"
                    autoRequestLocation={false}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
}
