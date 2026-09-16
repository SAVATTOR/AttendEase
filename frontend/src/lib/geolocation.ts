export interface FixedPosition {
    lat: number;
    lng: number;
    accuracy: number; // radius of uncertainty, in metres
}

interface AccuratePositionOptions {
    desiredAccuracy?: number; // resolve as soon as a reading is at least this good
    maxWait?: number; // how long to keep refining before settling for the best so far
    timeout?: number; // per-reading timeout handed to the geolocation API
}

const readableGeolocationError = (error: GeolocationPositionError): Error => {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            return new Error('Location permission denied. Please enable location access.');
        case error.POSITION_UNAVAILABLE:
            return new Error('Location information unavailable.');
        case error.TIMEOUT:
            return new Error('Location request timed out.');
        default:
            return new Error('Failed to get location');
    }
};

/**
 * getCurrentPosition() returns the first fix the device can produce, which indoors is
 * usually a WiFi/cell estimate accurate to hundreds of metres - useless for a 50m
 * geofence. A GPS fix sharpens over several seconds as satellites lock, so this watches
 * the position instead, keeps the most accurate reading seen, and returns early once a
 * reading is good enough. Callers get the accuracy so they can tell the user when a fix
 * is too coarse to trust, rather than silently treating it as an exact point.
 */
export function getAccuratePosition({
    desiredAccuracy = 10,
    maxWait = 8000,
    timeout = 15000,
}: AccuratePositionOptions = {}): Promise<FixedPosition> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        let best: FixedPosition | null = null;
        let watchId: number | null = null;
        let timer: ReturnType<typeof setTimeout> | null = null;
        let settled = false;

        const cleanup = () => {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
            if (timer) clearTimeout(timer);
        };

        const settle = () => {
            if (settled) return;
            settled = true;
            cleanup();
            if (best) {
                resolve(best);
            } else {
                reject(new Error('Could not determine your location. Please try again.'));
            }
        };

        watchId = navigator.geolocation.watchPosition(
            (position) => {
                const reading: FixedPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy ?? Number.POSITIVE_INFINITY,
                };

                if (
                    !Number.isFinite(reading.lat) ||
                    !Number.isFinite(reading.lng) ||
                    Math.abs(reading.lat) > 90 ||
                    Math.abs(reading.lng) > 180
                ) {
                    return; // ignore obviously bad readings and keep waiting
                }

                if (!best || reading.accuracy < best.accuracy) {
                    best = reading;
                }

                if (best.accuracy <= desiredAccuracy) settle();
            },
            (error) => {
                if (best) {
                    settle(); // a later reading failed but we already have a usable one
                    return;
                }
                if (settled) return;
                settled = true;
                cleanup();
                reject(readableGeolocationError(error));
            },
            { enableHighAccuracy: true, timeout, maximumAge: 0 }
        );

        timer = setTimeout(settle, maxWait);
    });
}
