# 🧪 Comprehensive UI Testing Checklist

## ✅ **Automated Testing Plan**

Since browser automation is having connection issues, here's a comprehensive checklist to test all functionality:

---

## 🔐 **1. Authentication Flow**

### Login Page
- [ ] Navigate to `http://localhost:5173/login`
- [ ] Enter `teacher1@school.edu` / `Password123`
- [ ] Click "Sign in" button
- [ ] Should redirect to `/teacher` dashboard
- [ ] Check console for errors (F12 → Console)
- [ ] Verify user name appears in sidebar

### Logout
- [ ] Click logout button in sidebar
- [ ] Should redirect to login page
- [ ] localStorage should be cleared

---

## 📚 **2. Teacher Classes Page**

### View Classes
- [ ] Navigate to `/teacher/classes`
- [ ] Should see list of classes
- [ ] Check if classes load from API (not mock data)

### Create Class
- [ ] Click "Create Class" button
- [ ] Fill in form:
  - Name: "Test Class"
  - Code: "TEST101"
  - Description: "Test description"
  - Allowed Radius: 50
- [ ] Click "Create"
- [ ] Should see success toast
- [ ] New class should appear in list

### Manage Class Button (FIXED)
- [ ] Click "Manage" button on any class
- [ ] Should navigate to `/teacher/attendance?classId={id}`
- [ ] Should NOT show 404 error
- [ ] Should show attendance records for that class

### Start Session Button
- [ ] Click "Start Session" on a class
- [ ] Should navigate to `/teacher/session`
- [ ] Should pre-select the class

---

## ⚙️ **3. Settings Page**

### Profile Tab (FIXED)
- [ ] Navigate to `/teacher/settings`
- [ ] Go to "Profile" tab
- [ ] Change name to "New Name"
- [ ] Click "Save Profile"
- [ ] Should see success toast
- [ ] **VERIFY:** Name should update immediately in:
  - Sidebar (user name)
  - Profile section
  - Anywhere else name is displayed
- [ ] Refresh page - name should persist

### Password Tab (FIXED)
- [ ] Go to "Password" tab
- [ ] Enter current password: `Password123`
- [ ] Enter new password: `Password123` (same as current)
- [ ] Click "Update Password"
- [ ] **VERIFY:** Should show error: "Current and new password cannot be the same"
- [ ] Should NOT show network error
- [ ] Enter different new password: `NewPassword123`
- [ ] Confirm password: `NewPassword123`
- [ ] Click "Update Password"
- [ ] Should see success toast
- [ ] Try logging out and back in with new password

### Preferences Tab
- [ ] Go to "Preferences" tab
- [ ] Change session duration
- [ ] Change allowed radius
- [ ] Change late threshold
- [ ] Click "Save Preferences"
- [ ] Should see success toast

### Notifications Tab
- [ ] Go to "Notifications" tab
- [ ] Toggle email notifications
- [ ] Toggle session reminders
- [ ] Click "Save Notifications"
- [ ] Should see success toast

---

## 📊 **4. Attendance Records**

### View Records
- [ ] Navigate to `/teacher/attendance`
- [ ] Should see attendance records
- [ ] Test filters (if available)
- [ ] Test pagination (if available)

### Filter by Class
- [ ] Navigate to `/teacher/attendance?classId={someId}`
- [ ] Should show only records for that class
- [ ] Should NOT show 404

---

## 🎯 **5. Start Session**

### Create QR Session
- [ ] Navigate to `/teacher/session`
- [ ] Select a class
- [ ] Click "Generate QR Code"
- [ ] Should see QR code
- [ ] Should see countdown
- [ ] Should see attendance records updating

### Download Report (FIXED)
- [ ] After starting a session
- [ ] Click "Download Report"
- [ ] Should download CSV file
- [ ] Should NOT crash or redirect to homepage

---

## 📱 **6. Student Pages**

### Login as Student
- [ ] Logout
- [ ] Login with `student1@school.edu` / `Password123`
- [ ] Should redirect to `/student` dashboard

### My Classes
- [ ] Navigate to `/student/classes`
- [ ] Should see enrolled classes
- [ ] Test enrollment:
  - Enter class code
  - Click "Enroll"
  - Should see success toast
  - **VERIFY:** Class should appear in list (not fake toast)

### Mark Attendance
- [ ] Navigate to `/student/attendance/mark`
- [ ] Should see QR scanner
- [ ] Test location permission
- [ ] Test QR code scanning (if possible)

### Attendance History
- [ ] Navigate to `/student/attendance`
- [ ] Should see attendance history
- [ ] Check sidebar highlighting (should NOT highlight both "Mark" and "History")

---

## 🐛 **7. Console Error Check**

### Check for Errors
- [ ] Open DevTools (F12)
- [ ] Go to Console tab
- [ ] Check for:
  - Red errors
  - Network errors (429, 400, 500, etc.)
  - CORS errors
  - React errors
- [ ] Go to Network tab
- [ ] Test all buttons
- [ ] Check for failed requests
- [ ] Check response status codes

---

## ✅ **8. Fixed Issues Verification**

### Issue 1: Manage Class 404 ✅
- [ ] Click "Manage" on any class
- [ ] Should navigate to attendance records
- [ ] Should NOT show 404

### Issue 2: Profile Name Update ✅
- [ ] Change name in settings
- [ ] Should update immediately in UI
- [ ] Should persist after refresh

### Issue 3: Password Validation ✅
- [ ] Try same password for current and new
- [ ] Should show clear error message
- [ ] Should NOT show network error

### Issue 4: Network Errors ✅
- [ ] All API calls should work
- [ ] No connection refused errors
- [ ] No 400/500 errors (unless expected)

---

## 🔍 **9. Sidebar Navigation**

### Teacher Sidebar
- [ ] Click each navigation item
- [ ] Should navigate correctly
- [ ] Active item should be highlighted
- [ ] User info should display correctly

### Student Sidebar
- [ ] Login as student
- [ ] Click "Mark Attendance"
- [ ] **VERIFY:** Only "Mark Attendance" is highlighted (not "History")
- [ ] Click "Attendance History"
- [ ] **VERIFY:** Only "History" is highlighted (not "Mark")

---

## 📝 **10. Error Handling**

### Test Error Scenarios
- [ ] Invalid login credentials → Should show error
- [ ] Network offline → Should handle gracefully
- [ ] Invalid form data → Should show validation errors
- [ ] 401 Unauthorized → Should redirect to login
- [ ] 429 Rate limit → Should show cooldown message

---

## 🎯 **Quick Test Script**

Run this in browser console to test API endpoints:

```javascript
// Test login
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'teacher1@school.edu', password: 'Password123' })
}).then(r => r.json()).then(console.log);

// Test profile update (after login, get token first)
const token = localStorage.getItem('token');
fetch('http://localhost:5000/api/settings/profile', {
  method: 'PUT',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ name: 'Test Name' })
}).then(r => r.json()).then(console.log);
```

---

**All tests should pass!** 🚀

