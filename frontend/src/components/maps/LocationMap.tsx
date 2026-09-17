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

// react-leaflet's `center`/`zoom` props on MapContainer only apply on first render, so
// the view has to be driven imperatively afterwards.
//
// A fixed zoom also can't represent a radius that ranges from 10m to 200m: at zoom 16 a
// 10m circle is an 8px dot and a 200m one nearly fills the frame. Framing the view to the
// circle instead means the drawn geofence matches the configured radius at any value.
function RecenterMap({ center, fitRadius }: { center: [number, number]; fitRadius?: number }) {
    const map = useMap();
    React.useEffect(() => {
        if (fitRadius && fitRadius > 0) {
            const [lat, lng] = center;
            const latDelta = fitRadius / 111320;
            const lngDelta = fitRadius / (111320 * Math.cos((lat * Math.PI) / 180));
            map.fitBounds(
                [
                    [lat - latDelta, lng - lngDelta],
                    [lat + latDelta, lng + lngDelta],
                ],
                { padding: [16, 16] }
            );
        } else {
            map.setView(center);
        }
    }, [center, fitRadius, map]);
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
                <RecenterMap center={centerTuple} fitRadius={showRadius ? allowedRadius : undefined} />
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
