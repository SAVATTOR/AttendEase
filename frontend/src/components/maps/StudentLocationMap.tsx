import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, CircleF } from '@react-google-maps/api';
import { MapPin, Navigation, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface StudentLocationMapProps {
    teacherLocation: {
        lat: number;
        lng: number;
    };
    allowedRadius: number;
    onLocationVerified?: (location: { lat: number; lng: number }, isWithinRange: boolean, distance: number) => void;
    height?: string;
    autoRequestLocation?: boolean; // If false, won't automatically request location on mount
    initialStudentLocation?: { lat: number; lng: number }; // Pre-provided student location to avoid requesting
}

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.5rem',
};

// Haversine formula to calculate distance
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const StudentLocationMap: React.FC<StudentLocationMapProps> = ({
    teacherLocation,
    allowedRadius,
    onLocationVerified,
    height = '300px',
    autoRequestLocation = true,
    initialStudentLocation,
}) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
    });

    const [studentLocation, setStudentLocation] = useState<{ lat: number; lng: number } | null>(initialStudentLocation || null);
    const [distance, setDistance] = useState<number | null>(null);
    const [isWithinRange, setIsWithinRange] = useState<boolean>(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isLocating, setIsLocating] = useState<boolean>(false);

    // Calculate distance if we have initial location
    useEffect(() => {
        if (initialStudentLocation && teacherLocation && !studentLocation) {
            const dist = calculateDistance(
                initialStudentLocation.lat,
                initialStudentLocation.lng,
                teacherLocation.lat,
                teacherLocation.lng
            );
            if (!isNaN(dist) && dist >= 0 && dist < 1000000) {
                setStudentLocation(initialStudentLocation);
                setDistance(dist);
                setIsWithinRange(dist <= allowedRadius);
                if (onLocationVerified) {
                    onLocationVerified(initialStudentLocation, dist <= allowedRadius, dist);
                }
            }
        }
    }, [initialStudentLocation, teacherLocation, allowedRadius, onLocationVerified]);

    const getStudentLocation = useCallback(() => {
        setIsLocating(true);
        setLocationError(null);

        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser');
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                // Validate coordinates before using them
                if (!location.lat || !location.lng ||
                    isNaN(location.lat) || isNaN(location.lng) ||
                    location.lat === 0 || location.lng === 0 ||
                    Math.abs(location.lat) > 90 || Math.abs(location.lng) > 180) {
                    setLocationError('Invalid location coordinates received');
                    setIsLocating(false);
                    return;
                }

                // Validate teacher location before calculating distance
                if (!teacherLocation ||
                    !teacherLocation.lat || !teacherLocation.lng ||
                    isNaN(teacherLocation.lat) || isNaN(teacherLocation.lng)) {
                    setLocationError('Lecturer location not available');
                    setIsLocating(false);
                    return;
                }

                setStudentLocation(location);

                const dist = calculateDistance(
                    location.lat,
                    location.lng,
                    teacherLocation.lat,
                    teacherLocation.lng
                );

                // Validate calculated distance (should be reasonable)
                if (isNaN(dist) || dist < 0 || dist > 1000000) { // More than 1000km is suspicious
                    setLocationError('Invalid distance calculated');
                    setIsLocating(false);
                    return;
                }

                setDistance(dist);

                const withinRange = dist <= allowedRadius;
                setIsWithinRange(withinRange);

                if (onLocationVerified) {
                    onLocationVerified(location, withinRange, dist);
                }

                setIsLocating(false);
            },
            (error) => {
                let errorMessage = 'Failed to get location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable location access.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.';
                        break;
                }
                setLocationError(errorMessage);
                setIsLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }, [teacherLocation, allowedRadius, onLocationVerified]);

    useEffect(() => {
        if (autoRequestLocation) {
            getStudentLocation();
        }
    }, [autoRequestLocation, getStudentLocation]);

    // Automatically request location when teacherLocation becomes available
    // (even if autoRequestLocation is false, we still want to show student location on map)
    // BUT only if onLocationVerified is provided (meaning we want to update parent state)
    useEffect(() => {
        if (teacherLocation &&
            !studentLocation &&
            !isLocating &&
            !locationError &&
            !autoRequestLocation &&
            onLocationVerified) { // Only auto-request if callback is provided
            // Small delay to ensure component is fully mounted
            const timer = setTimeout(() => {
                getStudentLocation();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [teacherLocation, studentLocation, isLocating, locationError, autoRequestLocation, onLocationVerified, getStudentLocation]);

    if (!apiKey || apiKey === 'your-google-maps-api-key-here' || apiKey.trim() === '') {
        return (
            <div
                className="flex flex-col items-center justify-center bg-yellow-50 border border-yellow-200 rounded-lg p-6"
                style={{ height }}
            >
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                    <RefreshCw className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-center">
                    <p className="text-yellow-800 font-semibold text-lg">Google Maps API Key Not Configured</p>
                    <p className="text-yellow-700 text-sm mt-2">Please set VITE_GOOGLE_MAPS_API_KEY in your .env file</p>
                    <p className="text-yellow-600 text-xs mt-1">Restart the dev server after adding the key</p>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div
                className="flex flex-col items-center justify-center bg-red-50 border border-red-200 rounded-lg p-6"
                style={{ height }}
            >
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <RefreshCw className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-center">
                    <p className="text-red-600 font-semibold text-lg">Failed to load Map</p>
                    <p className="text-red-500 text-sm mt-1">
                        {loadError.message?.includes('InvalidKey') || loadError.message?.includes('InvalidKeyMapError')
                            ? 'Invalid Google Maps API Key. Please check your API key configuration.'
                            : 'Please verify your internet connection or API key'}
                    </p>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div
                className="flex items-center justify-center bg-gray-100 rounded-lg animate-pulse"
                style={{ height }}
            >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const mapCenter = studentLocation || teacherLocation;

    return (
        <div className="space-y-3">
            {/* Status Bar */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">
                        {isLocating ? (
                            'Getting your location...'
                        ) : locationError ? (
                            <span className="text-red-600">{locationError}</span>
                        ) : distance !== null ? (
                            <>
                                Distance: <strong>{distance.toFixed(1)}m</strong> / {allowedRadius}m allowed
                            </>
                        ) : studentLocation ? (
                            'Calculating distance...'
                        ) : (
                            'Location not available'
                        )}
                    </span>
                </div>

                {!isLocating && (
                    <div className="flex items-center gap-2">
                        {distance !== null && (
                            <div
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isWithinRange
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                    }`}
                            >
                                {isWithinRange ? (
                                    <>
                                        <CheckCircle className="w-3 h-3" />
                                        Within Range
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-3 h-3" />
                                        Out of Range
                                    </>
                                )}
                            </div>
                        )}
                        <button
                            onClick={getStudentLocation}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Navigation className="w-3 h-3" />
                            Refresh
                        </button>
                    </div>
                )}
            </div>

            {/* Map */}
            <div style={{ height }}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={mapCenter}
                    zoom={18}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                    }}
                >
                    {isLocating && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm transition-all duration-300">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-4 border-primary/20 animate-pulse" />
                                <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-t-4 border-primary animate-spin" />
                            </div>
                            <div className="text-center mt-6">
                                <p className="text-gray-900 font-semibold">Updating Location</p>
                                <p className="text-gray-500 text-sm mt-1">Getting your precise coordinates...</p>
                            </div>
                        </div>
                    )}

                    {/* Teacher Location */}
                    <MarkerF
                        position={teacherLocation}
                        title="Lecturer Location"
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 12,
                            fillColor: '#3B82F6',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 3,
                        }}
                    />

                    {/* Allowed Radius */}
                    <CircleF
                        center={teacherLocation}
                        radius={allowedRadius}
                        options={{
                            strokeColor: isWithinRange ? '#22C55E' : '#EF4444',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            fillColor: isWithinRange ? '#22C55E' : '#EF4444',
                            fillOpacity: 0.1,
                        }}
                    />

                    {/* Student Location */}
                    {studentLocation && (
                        <MarkerF
                            position={studentLocation}
                            title="Your Location"
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 10,
                                fillColor: isWithinRange ? '#22C55E' : '#EF4444',
                                fillOpacity: 1,
                                strokeColor: '#ffffff',
                                strokeWeight: 2,
                            }}
                        />
                    )}
                </GoogleMap>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Lecturer</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${isWithinRange ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>You</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-full border-2 ${isWithinRange ? 'border-green-500' : 'border-red-500'}`}></div>
                    <span>{allowedRadius}m Radius</span>
                </div>
            </div>
        </div>
    );
};

export default StudentLocationMap;
