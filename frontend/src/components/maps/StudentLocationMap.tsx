import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, CheckCircle, XCircle } from 'lucide-react';

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

// react-leaflet's `center` prop on MapContainer only applies on first render - this
// keeps the view centered as the student's location is (re)fetched.
function RecenterMap({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
}

export const StudentLocationMap: React.FC<StudentLocationMapProps> = ({
    teacherLocation,
    allowedRadius,
    onLocationVerified,
    height = '300px',
    autoRequestLocation = true,
    initialStudentLocation,
}) => {
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

    const mapCenter = studentLocation || teacherLocation;
    const mapCenterTuple: [number, number] = [mapCenter.lat, mapCenter.lng];
    const teacherTuple: [number, number] = [teacherLocation.lat, teacherLocation.lng];

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
            <div style={{ height }} className="relative">
                <MapContainer center={mapCenterTuple} zoom={18} style={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <RecenterMap center={mapCenterTuple} />

                    {/* Teacher Location */}
                    <CircleMarker
                        center={teacherTuple}
                        radius={12}
                        pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#3B82F6', fillOpacity: 1 }}
                    />

                    {/* Allowed Radius */}
                    <Circle
                        center={teacherTuple}
                        radius={allowedRadius}
                        pathOptions={{
                            color: isWithinRange ? '#22C55E' : '#EF4444',
                            weight: 2,
                            opacity: 0.8,
                            fillColor: isWithinRange ? '#22C55E' : '#EF4444',
                            fillOpacity: 0.1,
                        }}
                    />

                    {/* Student Location */}
                    {studentLocation && (
                        <CircleMarker
                            center={[studentLocation.lat, studentLocation.lng]}
                            radius={10}
                            pathOptions={{
                                color: '#ffffff',
                                weight: 2,
                                fillColor: isWithinRange ? '#22C55E' : '#EF4444',
                                fillOpacity: 1,
                            }}
                        />
                    )}
                </MapContainer>

                {isLocating && (
                    <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm transition-all duration-300">
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
