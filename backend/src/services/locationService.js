const { calculateDistance } = require('../utils/helpers');
const { DEFAULT_ALLOWED_RADIUS } = require('../utils/constants');

const verifyLocation = (studentLat, studentLng, teacherLat, teacherLng, allowedRadius = DEFAULT_ALLOWED_RADIUS) => {
  const distance = calculateDistance(studentLat, studentLng, teacherLat, teacherLng);
  const isWithinRange = distance <= allowedRadius;

  return {
    distance: Math.round(distance * 100) / 100,
    isWithinRange,
    allowedRadius,
    message: isWithinRange
      ? 'Location verified successfully'
      : `You are ${Math.round(distance)}m away. Maximum allowed distance is ${allowedRadius}m`,
  };
};

const formatCoordinates = (latitude, longitude) => {
  const latDirection = latitude >= 0 ? 'N' : 'S';
  const lngDirection = longitude >= 0 ? 'E' : 'W';

  return `${Math.abs(latitude).toFixed(6)}°${latDirection}, ${Math.abs(longitude).toFixed(6)}°${lngDirection}`;
};

const isValidCoordinate = (latitude, longitude) => {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  );
};

const getBoundingBox = (latitude, longitude, radiusMeters) => {
  const latDelta = (radiusMeters / 111320);
  const lngDelta = (radiusMeters / (111320 * Math.cos(latitude * (Math.PI / 180))));

  return {
    minLat: latitude - latDelta,
    maxLat: latitude + latDelta,
    minLng: longitude - lngDelta,
    maxLng: longitude + lngDelta,
  };
};

module.exports = {
  verifyLocation,
  formatCoordinates,
  isValidCoordinate,
  getBoundingBox,
};