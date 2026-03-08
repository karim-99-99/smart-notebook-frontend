# Smart Notebook Mobile App

React Native mobile app for scanning notebook pages and extracting text using OCR.

## 🎯 Features

- **Camera Scanning** - Capture notebook pages with Vision Camera
- **Preview & Confirm** - Review images before processing
- **OCR Processing** - Extract Arabic & English text via backend API
- **Results Display** - View extracted text with confidence scores
- **Copy to Clipboard** - Easy text copying

## 📋 Prerequisites

1. **Node.js** >= 18
2. **React Native CLI** (NOT Expo)
3. **Android Studio** (for Android) or **Xcode** (for iOS/Mac)
4. **Backend API** running on your computer

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Backend API

Edit `src/services/api.ts`:

```typescript
// Replace with YOUR computer's IP address
const API_BASE_URL = 'http://192.168.1.100:8000';

// Get your auth token from backend
const AUTH_TOKEN = 'YOUR_TOKEN_HERE';
```

#### How to Get Auth Token:

```bash
# Register a user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'

# Login and get token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Copy the "access_token" from response
```

#### How to Find Your IP Address:

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address"
```

**Mac/Linux:**
```bash
ifconfig | grep inet
```

### 3. Install iOS Dependencies (Mac only)

```bash
cd ios
pod install
cd ..
```

### 4. Run the App

**Android:**
```bash
npm run android
```

**iOS (Mac only):**
```bash
npm run ios
```

## 📱 Testing

⚠️ **IMPORTANT**: Test on a **real device**, not simulator/emulator!
- Camera doesn't work on emulators
- Make sure your phone is on the same WiFi network as your computer

### Testing Checklist:

1. ✅ App opens and shows camera
2. ✅ Camera permission is granted
3. ✅ Can capture photo
4. ✅ Preview screen shows image
5. ✅ "Send to OCR" uploads to backend
6. ✅ Results screen displays extracted text
7. ✅ "Copy Text" copies to clipboard
8. ✅ "Scan Another" returns to camera

## 🐛 Troubleshooting

### Camera Not Working
- Make sure you granted camera permission
- Check you're testing on a real device, not emulator

### Upload Fails
- Verify backend is running: `docker compose ps`
- Check your IP address in `api.ts` is correct
- Ensure phone and computer are on same WiFi
- Test backend: Open `http://YOUR_IP:8000` in phone browser

### "Unauthorized" Error
- Your auth token may be invalid/expired
- Get a new token using the login endpoint

### Cannot Connect to Backend
```bash
# Test if backend is accessible from your phone
# Open in phone's browser:
http://YOUR_IP:8000

# Should see: {"message": "Welcome to Smart Notebook API"}
```

## 📂 Project Structure

```
mobile/
├── src/
│   ├── screens/
│   │   ├── ScanScreen.tsx       # Camera interface
│   │   ├── PreviewScreen.tsx    # Image preview
│   │   └── ResultScreen.tsx     # OCR results
│   ├── services/
│   │   └── api.ts               # Backend API calls
│   ├── navigation/
│   │   ├── AppNavigator.tsx     # Navigation setup
│   │   └── types.ts             # Navigation types
│   └── types/
│       └── index.ts             # TypeScript types
├── android/                      # Android config
├── ios/                          # iOS config
├── App.tsx                       # App entry point
└── package.json                  # Dependencies
```

## 🎨 User Flow

```
1. ScanScreen (Camera)
   ↓ Capture photo
2. PreviewScreen
   ↓ Send to OCR
3. Backend API (http://YOUR_IP:8000/api/notes/ocr)
   ↓ Process with OCR service
4. ResultScreen
   ↓ Display text + Copy
5. Scan Another → Back to ScanScreen
```

## 📝 What's NOT Included (Week 4 Scope)

- ❌ Login/Signup UI
- ❌ Note history/list
- ❌ Note editing
- ❌ Export to PDF/Doc
- ❌ Cloud sync
- ❌ Offline mode

These will be added in later weeks!

## 🔧 Development Tips

**View Logs:**
```bash
# React Native logs
npx react-native log-android  # Android
npx react-native log-ios      # iOS

# Or use React Native Debugger
```

**Clear Cache:**
```bash
npm start -- --reset-cache
```

**Rebuild:**
```bash
# Android
cd android && ./gradlew clean && cd ..
npm run android

# iOS
cd ios && pod install && cd ..
npm run ios
```

## ⚠️ Important Notes

1. **Real Device Only** - Camera requires physical device
2. **Same Network** - Phone and computer must be on same WiFi
3. **Update IP** - Change API_BASE_URL when network changes
4. **Auth Token** - Get fresh token from backend
5. **Backend Running** - Start with `docker compose up -d`

## 🎉 Success Criteria

Week 4 is complete when you can:
- ✅ Open camera and capture notebook image
- ✅ Preview and confirm image
- ✅ Upload to backend
- ✅ See extracted Arabic/English text
- ✅ Copy text to clipboard

That's it for Week 4! 🚀

