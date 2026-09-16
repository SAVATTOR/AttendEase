const env = require('../config/env');

module.exports = {
  // User Roles
  ROLES: {
    STUDENT: 'STUDENT',
    TEACHER: 'TEACHER',
  },

  // Attendance Status
  ATTENDANCE_STATUS: {
    PRESENT: 'PRESENT',
    LATE: 'LATE',
    ABSENT: 'ABSENT',
    INVALID_LOCATION: 'INVALID_LOCATION',
  },

  // Time Constants (in milliseconds)
  LOGIN_COOLDOWN: env.LOGIN_COOLDOWN_MINUTES * 60 * 1000,
  QR_REFRESH_INTERVAL: env.QR_REFRESH_INTERVAL_SECONDS * 1000,
  QR_SESSION_DURATION: env.QR_SESSION_DURATION_MINUTES * 60 * 1000,

  // Location
  DEFAULT_ALLOWED_RADIUS: env.DEFAULT_ALLOWED_RADIUS_METERS,
  EARTH_RADIUS_METERS: 6371000,

  // Upper bound on how much slack a student's reported GPS accuracy can buy them in the
  // proximity check. The value is client-reported and therefore forgeable, so it is
  // capped: it absorbs genuine indoor GPS error without letting someone claim a wildly
  // inaccurate fix to mark attendance from far outside the venue.
  MAX_GPS_ACCURACY_SLACK_METERS: 75,

  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // Late threshold (minutes after session start)
  LATE_THRESHOLD_MINUTES: 15,
};