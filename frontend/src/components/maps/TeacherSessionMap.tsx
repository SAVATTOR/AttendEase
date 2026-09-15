import React, { useState } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, CircleF, InfoWindow } from '@react-google-maps/api';

interface StudentMarker {
    id: string;
    name: string;
    lat: number;
    lng: number;
    status: 'PRESENT' | 'LATE' | 'INVALID_LOCATION';
    distance: number;
    markedAt: string;
}

interface TeacherSessionMapProps {
    teacherLocation: {
        lat: number;
        lng: number;
    };
    allowedRadius: number;
    students: StudentMarker[];
    height?: string;
}

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.5rem',
};

const statusColors = {
    PRESENT: '#22C55E',
    LATE: '#F59E0B',
    INVALID_LOCATION: '#EF4444',
};

import { RefreshCw } from 'lucide-react';

export const TeacherSessionMap: React.FC<TeacherSessionMapProps> = ({
    teacherLocation,
    allowedRadius,
    students,
    height = '400px',
}) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
    });

    const [selectedStudent, setSelectedStudent] = useState<StudentMarker | null>(null);

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
                className="flex flex-col items-center justify-center bg-gray-50 rounded-lg"
                style={{ height }}
            >
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 animate-pulse" />
                    <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-t-4 border-primary animate-spin" />
                </div>
                <div className="text-center mt-6">
                    <p className="text-gray-900 font-semibold">Initializing Maps</p>
                    <p className="text-gray-500 text-sm mt-1">This will only take a moment...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height }}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={teacherLocation}
                zoom={18}
                options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                }}
            >
                {/* Teacher Location */}
                <MarkerF
                    position={teacherLocation}
                    title="Your Location (Lecturer)"
                    icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 14,
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
                        strokeColor: '#22C55E',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: '#22C55E',
                        fillOpacity: 0.1,
                    }}
                />

                {/* Student Markers */}
                {students.map((student) => (
                    <MarkerF
                        key={student.id}
                        position={{ lat: student.lat, lng: student.lng }}
                        title={student.name}
                        onClick={() => setSelectedStudent(student)}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: statusColors[student.status as keyof typeof statusColors] || statusColors.INVALID_LOCATION,
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                        }}
                    />
                ))}

                {/* Info Window for Selected Student */}
                {selectedStudent && (
                    <InfoWindow
                        position={{ lat: selectedStudent.lat, lng: selectedStudent.lng }}
                        onCloseClick={() => setSelectedStudent(null)}
                    >
                        <div className="p-2 min-w-[150px]">
                            <h4 className="font-semibold text-gray-900">{selectedStudent.name}</h4>
                            <div className="mt-1 space-y-1 text-sm">
                                <p>
                                    Status:{' '}
                                    <span
                                        className={`font-medium ${selectedStudent.status === 'PRESENT'
                                            ? 'text-green-600'
                                            : selectedStudent.status === 'LATE'
                                                ? 'text-yellow-600'
                                                : 'text-red-600'
                                            }`}
                                    >
                                        {selectedStudent.status}
                                    </span>
                                </p>
                                <p className="text-gray-600">
                                    Distance: {selectedStudent.distance.toFixed(1)}m
                                </p>
                                <p className="text-gray-500 text-xs">
                                    {new Date(selectedStudent.markedAt).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Lecturer</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Present</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Late</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Invalid Location</span>
                </div>
            </div>
        </div>
    );
};

export default TeacherSessionMap;
