# 📱 QR Code Testing Guide

Since your app is on PC but QR scanning works best on mobile, here are **multiple ways** to test the QR code functionality:

## 🎯 **Option 1: Deploy to Firebase (Recommended)**

This is the easiest way to test on a real phone.

### Steps:
1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Firebase Hosting:**
   ```bash
   # Install Firebase CLI if not already installed
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase (if not done)
   firebase init hosting
   
   # Deploy
   firebase deploy --only hosting
   ```

3. **Test on Phone:**
   - Open the Firebase URL on your phone's browser
   - Login as teacher on laptop
   - Login as student on phone
   - Start QR session on laptop
   - Scan QR code with phone camera

### Pros:
- ✅ Real-world testing
- ✅ Works on any device
- ✅ No network configuration needed

---

## 🏠 **Option 2: Local Network Testing (No Deployment)**

Test on your phone using your local network IP.

### Steps:
1. **Find your laptop's local IP:**
   ```bash
   # Windows
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.100)
   
   # Mac/Linux
   ifconfig
   # Look for inet address
   ```

2. **Start frontend with network access:**
   ```bash
   cd frontend
   # Update vite.config.ts to allow network access
   npm run dev -- --host
   ```

3. **Update Vite config** (if needed):
   ```typescript
   // vite.config.ts
   export default defineConfig({
     server: {
       host: '0.0.0.0', // Allow external connections
       port: 5173,
     },
   });
   ```

4. **Access from phone:**
   - Make sure phone and laptop are on same WiFi
   - Open `http://YOUR_IP:5173` on phone browser
   - Test QR scanning

### Pros:
- ✅ No deployment needed
- ✅ Fast iteration
- ✅ Free

### Cons:
- ⚠️ Requires same WiFi network
- ⚠️ May need to configure firewall

---

## 📸 **Option 3: QR Scanner App (Easiest for Quick Testing)**

Use a QR scanner app on your phone to scan QR codes from your laptop screen.

### Steps:
1. **Install QR Scanner App:**
   - **iOS**: Built-in Camera app (no install needed!)
   - **Android**: Google Lens, QR Code Reader, etc.

2. **Test Flow:**
   - Open teacher dashboard on laptop
   - Start QR session (QR code appears on screen)
   - Open QR scanner app on phone
   - Point phone camera at laptop screen
   - Scan the QR code
   - Copy the scanned data
   - Manually test the attendance marking API

3. **Quick Test Script:**
   Create a test page that shows the QR data when scanned:
   ```javascript
   // You can add this to your student page temporarily
   // It will show what data the QR code contains
   ```

### Pros:
- ✅ Works immediately
- ✅ No setup required
- ✅ Good for quick validation

### Cons:
- ⚠️ Manual testing (not automated)
- ⚠️ Doesn't test full flow

---

## 🖥️ **Option 4: Browser DevTools Mobile Emulation**

Test using Chrome DevTools mobile emulation (limited camera support).

### Steps:
1. **Open Chrome DevTools:**
   - Press `F12`
   - Click device toggle (or `Ctrl+Shift+M`)

2. **Select Mobile Device:**
   - Choose iPhone or Android device
   - This simulates mobile viewport

3. **Note:**
   - Camera access may be limited
   - QR scanning might not work fully
   - Good for UI testing, not full functionality

### Pros:
- ✅ Quick UI testing
- ✅ No phone needed

### Cons:
- ⚠️ Camera/QR scanning limited
- ⚠️ Not real device testing

---

## 🔧 **Option 5: Create a Test Utility Page**

Create a simple test page that can manually input QR data.

### Implementation:
Create `frontend/src/pages/test/QRTestPage.tsx`:

```typescript
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function QRTestPage() {
  const [qrData, setQrData] = useState('');
  
  const handleTest = () => {
    // Parse QR data and test attendance marking
    try {
      const data = JSON.parse(qrData);
      console.log('QR Data:', data);
      // Call attendance API here
    } catch (e) {
      alert('Invalid QR data');
    }
  };
  
  return (
    <div className="p-8">
      <h1>QR Code Test Utility</h1>
      <Input
        value={qrData}
        onChange={(e) => setQrData(e.target.value)}
        placeholder="Paste QR code data here"
      />
      <Button onClick={handleTest}>Test Attendance</Button>
    </div>
  );
}
```

### Pros:
- ✅ Good for API testing
- ✅ No camera needed
- ✅ Easy debugging

---

## 🎯 **Recommended Testing Workflow**

### For Development:
1. Use **Option 2** (Local Network) for quick testing
2. Use **Option 3** (QR Scanner App) to verify QR data format

### For Production Testing:
1. Use **Option 1** (Firebase Deployment) for full end-to-end testing
2. Test on multiple devices (iOS, Android)

### For Debugging:
1. Use **Option 5** (Test Utility) to manually test API calls

---

## 📋 **Quick Start: Local Network Testing**

Here's the fastest way to test right now:

```bash
# 1. Find your IP
ipconfig  # Windows
# Note your IPv4 address (e.g., 192.168.1.100)

# 2. Start backend (if not running)
cd backend
npm run dev

# 3. Start frontend with network access
cd frontend
npm run dev -- --host

# 4. On your phone:
# - Connect to same WiFi
# - Open browser
# - Go to: http://192.168.1.100:5173
# - Login as student
# - Scan QR code from laptop screen
```

---

## 🔍 **Testing Checklist**

- [ ] QR code generates correctly
- [ ] QR code refreshes every 5 seconds
- [ ] QR code can be scanned from phone
- [ ] Scanned data is parsed correctly
- [ ] Location verification works
- [ ] Attendance is marked successfully
- [ ] Error handling for invalid QR codes
- [ ] Error handling for out-of-range locations
- [ ] Session pause/resume works
- [ ] Multiple students can scan same QR

---

## 💡 **Pro Tips**

1. **For best results:** Use Option 1 (Firebase) for production-like testing
2. **For quick testing:** Use Option 3 (QR Scanner App) to verify QR format
3. **For debugging:** Use browser DevTools Network tab to see API calls
4. **For location testing:** Use browser DevTools to override geolocation

---

## 🐛 **Troubleshooting**

### QR code not scanning?
- Make sure screen brightness is high
- Ensure QR code is large enough (at least 2x2 inches)
- Try different QR scanner apps
- Check if QR code is refreshing too fast

### Phone can't access local server?
- Check firewall settings
- Ensure both devices on same WiFi
- Try using IP address instead of localhost
- Check if port 5173 is accessible

### Camera not working?
- Grant camera permissions in browser
- Use HTTPS (required for camera on some browsers)
- Try different browser (Chrome, Safari, Firefox)

---

## 📱 **Mobile Browser Compatibility**

| Browser | Camera Support | QR Scanning |
|---------|---------------|-------------|
| Chrome (Android) | ✅ | ✅ |
| Safari (iOS) | ✅ | ✅ |
| Firefox Mobile | ✅ | ⚠️ Limited |
| Edge Mobile | ✅ | ✅ |

---

**Need help?** Check the console logs and network requests in DevTools!

