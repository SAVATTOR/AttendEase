import React, { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, CircleF } from '@react-google-maps/api';

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

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.5rem',
};

const defaultOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
};

import { RefreshCw } from 'lucide-react';

export const LocationMap: React.FC<LocationMapProps> = ({
    center,
    studentLocation,
    allowedRadius = 50,
    showRadius = true,
    height = '300px',
    zoom = 17,
    onMapClick,
}) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const handleMapClick = useCallback(
        (e: google.maps.MapMouseEvent) => {
            if (onMapClick && e.latLng) {
                onMapClick(e.latLng.lat(), e.latLng.lng());
            }
        },
        [onMapClick]
    );

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
                center={center}
                zoom={zoom}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={handleMapClick}
                options={defaultOptions}
            >
                <MarkerF
                    position={center}
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

                {/* Allowed Radius Circle */}
                {showRadius && (
                    <CircleF
                        center={center}
                        radius={allowedRadius}
                        options={{
                            strokeColor: '#22C55E',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            fillColor: '#22C55E',
                            fillOpacity: 0.15,
                        }}
                    />
                )}

                {/* Student Location Marker */}
                {studentLocation && (
                    <MarkerF
                        position={studentLocation}
                        title="Your Location"
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: '#EF4444',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                        }}
                    />
                )}
            </GoogleMap>
        </div>
    );
};

export default LocationMap;
