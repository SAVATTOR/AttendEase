# 🚀 Quick Start: Test QR Code on Phone (5 Minutes)

## Method 1: Local Network (Fastest)

### Step 1: Find Your Laptop's IP
```bash
# Windows PowerShell
ipconfig | findstr IPv4

# You'll see something like:
# IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

### Step 2: Start Frontend with Network Access
```bash
cd frontend
npm run dev -- --host
```

### Step 3: On Your Phone
1. Make sure phone and laptop are on **same WiFi**
2. Open phone browser
3. Go to: `http://192.168.1.100:5173` (use YOUR IP)
4. Login as student
5. Go to "Mark Attendance"
6. Start scanning!

### Step 4: On Your Laptop
1. Open `http://localhost:5173` on laptop
2. Login as teacher
3. Go to "Start Session"
4. Select class and start session
5. QR code appears on screen
6. Scan it with your phone!

---

## Method 2: Use Phone Camera App (Even Faster!)

### Steps:
1. **On Laptop:**
   - Open teacher dashboard
   - Start QR session
   - QR code appears on screen

2. **On Phone:**
   - Open Camera app (iOS) or Google Lens (Android)
   - Point at laptop screen
   - QR code is automatically detected
   - Tap the notification to see the data
   - Copy the JSON data

3. **Test the Data:**
   - The QR code contains JSON like:
   ```json
   {
     "sessionId": "abc123",
     "classId": "1",
     "timestamp": 1234567890,
     "location": { "lat": 40.7128, "lng": -74.0060 }
   }
   ```

---

## Method 3: Deploy to Firebase (Best for Real Testing)

### Quick Deploy:
```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Initialize (if first time)
cd frontend
firebase init hosting
# Select: Use existing project or create new
# Public directory: dist
# Single-page app: Yes

# 4. Build
npm run build

# 5. Deploy
firebase deploy --only hosting
```

### Then:
- Get the Firebase URL (e.g., `your-app.web.app`)
- Open on phone
- Test full flow!

---

## 🎯 Which Method Should I Use?

- **Quick test?** → Method 2 (Phone Camera)
- **Full testing?** → Method 1 (Local Network) or Method 3 (Firebase)
- **Production demo?** → Method 3 (Firebase)

---

## ✅ Testing Checklist

1. [ ] QR code appears on teacher screen
2. [ ] QR code refreshes every 5 seconds
3. [ ] Phone can scan QR code from laptop screen
4. [ ] Student can mark attendance after scanning
5. [ ] Location verification works
6. [ ] Attendance appears in teacher dashboard

---

**That's it! You're ready to test! 🎉**

