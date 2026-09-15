# Comprehensive Issues & Fixes Guide

## 1. Camera Access Denied (Error 1)
**Issue:** `html5-qrcode` scanner throws permission errors or fails to start because the DOM element (`qr-reader`) isn't ready when the scanner initializes. This is a common race condition in React `useEffect` hooks when interacting with the DOM directly.
**Fix (Applied):**
- **File:** `frontend/src/pages/student/MarkAttendance.tsx`
- **Technical Change:**
  - Wrapped `new Html5Qrcode('qr-reader')` and `scanner.start()` inside a `setTimeout(..., 100)` to push execution to the end of the event loop, ensuring the DOM node is rendered.
  - Implemented a cleanup function in `useEffect` that calls `scannerRef.current.stop()` to properly release the camera stream when the component unmounts, preventing "camera in use" errors.
  - Added specific error handling for `NotAllowedError` (Permission denied) and `NotFoundError` (No camera device).

## 2. Teacher Login Cooldown (Error 2)
**Issue:** Teachers were facing 429 Too Many Requests errors. This was caused by two layers of protection:
1. `checkLoginCooldown` middleware: Logic-based 20-minute cooldown (already correctly skipped for teachers).
2. `rateLimit` middleware: Global brute-force protection (10 requests/15 mins) in `app.js` which applies to ALL roles before authentication.
**Fix (Applied):**
- **File:** `backend/src/app.js`
- **Technical Change:**
  - Modified `limiter` (global) and `authLimiter` (login specific) configurations.
  - Set `max` requests to `50000` (from 100) when `process.env.NODE_ENV` is `development` or `test`.
  - **Note:** In production, you might want to implement a Redis-based rate limiter that can whitelist specific IPs or skip limiting based on a "Teacher" header (though trusting headers is risky).

## 3. Template/Class Code Issue (Error 3)
**Issue:** `TeacherClasses.tsx` used a static `mockClasses` array with ID `"1"`. `StartSession.tsx` expects a valid UUID to fetch class details from the backend. Clicking "Start Session" passed ID "1", resulting in a 404 Not Found from the API.
**Fix (Applied):**
- **File:** `frontend/src/pages/teacher/TeacherClasses.tsx`
- **Technical Change:**
  - Removed `mockClasses` constant.
  - Introduced `useEffect` hook to call `classService.getMyClasses(1, 100)`.
  - Mapped real API response data (UUIDs, names, codes) to the state.
  - The `StartSession` navigation now passes `state: { classId: classItem.id }` using a valid UUID from the database.

## 4. Password Leak & Demo Credentials (Error 4)
**Issue:** 
1. `LoginPage.tsx` displayed hardcoded demo credentials in the UI.
2. The password input lacked `autoComplete` attributes, causing some browsers/DevTools to cache or display the value in the DOM snapshot.
**Fix (Applied):**
- **File:** `frontend/src/pages/auth/LoginPage.tsx`
- **Technical Change:**
  - Deleted the JSX block rendering the demo credentials text.
  - Added `autoComplete="current-password"` to the password input field. This hints browsers to handle the field securely and not expose it in accessibility trees or insecure autocomplete caches.

## 5. Session Persistence (Error 5)
**Issue:** `StartSession.tsx` relied entirely on local React state. Browser refreshes or navigation events (e.g., clicking "Classes" then "Back") destroyed the `currentSessionId`, forcing the teacher to start a new session (and potentially locking students out of the old one).
**Fix (Applied):**
- **File:** `frontend/src/pages/teacher/StartSession.tsx`
- **Technical Change:**
  - **Save:** On successful `startSession`, execute `localStorage.setItem('activeSessionId', session.id)`.
  - **Restore:** Added `useEffect` on mount:
    ```javascript
    const savedId = localStorage.getItem('activeSessionId');
    if (savedId) checkActiveSession(savedId);
    ```
  - **Verify:** `checkActiveSession` calls `qrService.resumeSession(id)` (idempotent) to fetch current session details and restore `isSessionActive`, `qrData`, and `selectedClassId`.
  - **Cleanup:** `localStorage.removeItem('activeSessionId')` is called on `endSession` or if the restore API call fails (404).

## 6. Enrollment 400 Error (Error 6)
**Issue:** Users entering class codes often include trailing spaces (e.g., "CS301 "), which caused the backend lookup `prisma.class.findUnique({ where: { code: classCode } })` to fail if the DB stored "CS301".
**Fix (Applied):**
- **File:** `frontend/src/pages/student/StudentClasses.tsx`
- **Technical Change:**
  - Added `.trim()` to the input value before sending the API request: `classService.enrollInClass(enrollCode.trim())`.
  - Enhanced `catch` block to log specific error messages from the backend response (`error.response?.data?.message`) instead of a generic "Failed".

---

## Pending Features: Technical Implementation Guide

### Feature 1: Clear Search Button
**Objective:** Improve UX by allowing one-click clearing of search filters.
**Implementation:**
- **File:** `frontend/src/pages/teacher/TeacherAttendance.tsx` (Search Component)
- **Code:**
  ```tsx
  <div className="relative">
    <Search className="..." />
    <Input 
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="pl-10 pr-10" // Add padding right for button
    />
    {searchQuery && (
      <button 
        onClick={() => setSearchQuery('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
  ```

### Feature 2: Teacher Approval for Enrollment
**Objective:** Teacher must explicitly approve students before they can join a class.
**Database Schema Change (`backend/prisma/schema.prisma`):**
```prisma
enum EnrollmentStatus {
  PENDING
  APPROVED
  REJECTED
}

model Enrollment {
  // ... existing fields
  status EnrollmentStatus @default(PENDING) // New field
}
```
**Backend Changes:**
1.  **Migration:** Run `npx prisma migrate dev --name add_enrollment_status`.
2.  **`enrollInClass` Controller:** Change creation logic to set `status: 'PENDING'`.
3.  **New Endpoints (`enrollmentController.js`):**
    - `PUT /api/classes/:classId/enrollments/:studentId/approve`: Updates status to `APPROVED`.
    - `PUT /api/classes/:classId/enrollments/:studentId/reject`: Deletes enrollment or sets status `REJECTED`.
4.  **Middleware:** Update `checkEnrollment` middleware (if exists) or query filters to only allow `status: 'APPROVED'` students to mark attendance.

**Frontend Changes:**
- **Student:** Update `StudentClasses` to show a "Pending" badge for non-approved classes. Disable clicking into them.
- **Teacher:** Create a "Requests" tab in `TeacherDashboard` fetching enrollments where `status === 'PENDING'`. Add "Approve" and "Reject" buttons calling the new endpoints.

### Feature 3: Live Class Notification
**Objective:** Real-time alert for students when a session starts.
**Technical Strategy:** WebSocket (Socket.io).
**Backend:**
- **File:** `backend/src/services/qrService.js` -> `generateSession` function.
- **Logic:**
  ```javascript
  // After creating session
  io.to(`class-${classId}`).emit('session-started', {
    classId,
    className: classRecord.name,
    teacherName: req.user.name
  });
  ```
**Frontend:**
- **File:** `frontend/src/context/SocketContext.tsx` or `StudentDashboard.tsx`.
- **Logic:**
  ```javascript
  useEffect(() => {
    socket.on('session-started', (data) => {
      showToast('info', 'Class Live!', `${data.className} has started attendance.`);
    });
    return () => socket.off('session-started');
  }, []);
  ```
- **Prerequisite:** Ensure students are joined to `class-${classId}` socket rooms upon connection (based on their approved enrollments).

### Feature 4: Remove Student & Check Other Classes
**Objective:** Enhanced student management for teachers.
**Backend:**
- **Remove:** Endpoint already exists: `DELETE /api/classes/:classId/students/:studentId`.
- **Check Other Classes:** New Endpoint `GET /api/teachers/student-check/:studentId`.
  - **Query:** Find all `Enrollment` records for `studentId`, `include: { class: true }`.
  - **Filter:** Filter results to only return classes where `class.teacherId === req.user.id` (privacy: teachers should only see their own classes).
**Frontend:**
- **UI:** In the Student List table, add a dropdown menu (three dots) -> "Remove" | "View Profile".
- **Modal:** "View Profile" opens a modal calling the new `student-check` endpoint and listing the classes.

