import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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

const statusColors = {
    PRESENT: '#22C55E',
    LATE: '#F59E0B',
    INVALID_LOCATION: '#EF4444',
};

// react-leaflet's `center` prop on MapContainer only applies on first render - this
// keeps the view centered on the teacher as their location updates.
function RecenterMap({ center }: { center: [number, number] }) {
    const map = useMap();
    React.useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
}

export const TeacherSessionMap: React.FC<TeacherSessionMapProps> = ({
    teacherLocation,
    allowedRadius,
    students,
    height = '400px',
}) => {
    const center: [number, number] = [teacherLocation.lat, teacherLocation.lng];

    return (
        <div style={{ height }}>
            <MapContainer center={center} zoom={18} style={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <RecenterMap center={center} />

                {/* Teacher Location */}
                <CircleMarker
                    center={center}
                    radius={14}
                    pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#3B82F6', fillOpacity: 1 }}
                >
                    <Popup>Your Location (Lecturer)</Popup>
                </CircleMarker>

                {/* Allowed Radius */}
                <Circle
                    center={center}
                    radius={allowedRadius}
                    pathOptions={{ color: '#22C55E', weight: 2, opacity: 0.8, fillColor: '#22C55E', fillOpacity: 0.1 }}
                />

                {/* Student Markers */}
                {students.map((student) => (
                    <CircleMarker
                        key={student.id}
                        center={[student.lat, student.lng]}
                        radius={8}
                        pathOptions={{
                            color: '#ffffff',
                            weight: 2,
                            fillColor: statusColors[student.status] || statusColors.INVALID_LOCATION,
                            fillOpacity: 1,
                        }}
                    >
                        <Popup>
                            <div className="p-1 min-w-[150px]">
                                <h4 className="font-semibold text-gray-900">{student.name}</h4>
                                <div className="mt-1 space-y-1 text-sm">
                                    <p>
                                        Status:{' '}
                                        <span
                                            className={`font-medium ${student.status === 'PRESENT'
                                                ? 'text-green-600'
                                                : student.status === 'LATE'
                                                    ? 'text-yellow-600'
                                                    : 'text-red-600'
                                                }`}
                                        >
                                            {student.status}
                                        </span>
                                    </p>
                                    <p className="text-gray-600">
                                        Distance: {student.distance.toFixed(1)}m
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                        {new Date(student.markedAt).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>

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
