import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationMapProps {
    center: {
        lat: number;
        lng: number;
    };
    studentLocation?: {
        lat: number;
        lng: number;
    } | null;
    allowedRadius?: number;
    showRadius?: boolean;
    height?: string;
    zoom?: number;
    onMapClick?: (lat: number, lng: number) => void;
}

// react-leaflet's `center`/`zoom` props on MapContainer only apply on first render -
// this keeps the view in sync when `center` changes afterward (e.g. a new class selected).
function RecenterMap({ center }: { center: [number, number] }) {
    const map = useMap();
    React.useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

export const LocationMap: React.FC<LocationMapProps> = ({
    center,
    studentLocation,
    allowedRadius = 50,
    showRadius = true,
    height = '300px',
    zoom = 17,
    onMapClick,
}) => {
    const centerTuple: [number, number] = [center.lat, center.lng];

    return (
        <div style={{ height }}>
            <MapContainer
                center={centerTuple}
                zoom={zoom}
                style={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <RecenterMap center={centerTuple} />
                {onMapClick && <ClickHandler onMapClick={onMapClick} />}

                {/* Lecturer location */}
                <CircleMarker
                    center={centerTuple}
                    radius={12}
                    pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#3B82F6', fillOpacity: 1 }}
                />

                {/* Allowed Radius Circle */}
                {showRadius && (
                    <Circle
                        center={centerTuple}
                        radius={allowedRadius}
                        pathOptions={{
                            color: '#22C55E',
                            weight: 2,
                            opacity: 0.8,
                            fillColor: '#22C55E',
                            fillOpacity: 0.15,
                        }}
                    />
                )}

                {/* Student Location Marker */}
                {studentLocation && (
                    <CircleMarker
                        center={[studentLocation.lat, studentLocation.lng]}
                        radius={10}
                        pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#EF4444', fillOpacity: 1 }}
                    />
                )}
            </MapContainer>
        </div>
    );
};

export default LocationMap;
