# 🚀 Quick Setup Guide

## Step 1: Install Dependencies

```bash
cd mobile
npm install
```

⏱️ This will take 5-10 minutes

## Step 2: Get Your Computer's IP Address

### Windows (PowerShell):
```bash
ipconfig
```
Look for "IPv4 Address" like `192.168.1.100`

### Mac/Linux:
```bash
ifconfig | grep inet
```

## Step 3: Get Authentication Token

```bash
# 1. Register a test user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'

# 2. Login to get token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# 3. Copy the "access_token" from the response
```

## Step 4: Configure the App

Edit `src/services/api.ts`:

```typescript
// Line 7: Replace with YOUR IP
const API_BASE_URL = 'http://192.168.1.100:8000';  // ⚠️ CHANGE THIS

// Line 14: Replace with your token
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';  // ⚠️ CHANGE THIS
```

## Step 5: Make Sure Backend is Running

```bash
cd ../
docker compose ps
```

All services should be "Up (healthy)"

## Step 6: Run the App

### For Android:
```bash
npm run android
```

### For iOS (Mac only):
```bash
cd ios
pod install
cd ..
npm run ios
```

## Step 7: Test on Real Device

⚠️ **IMPORTANT**: 
- Must use a REAL phone (camera doesn't work on emulator)
- Phone must be on SAME WiFi as your computer

## ✅ Success Checklist

- [ ] App opens and shows camera
- [ ] Camera permission granted  
- [ ] Can capture photo
- [ ] Preview screen shows image
- [ ] Upload works (shows "Processing...")
- [ ] Results screen shows Arabic/English text
- [ ] Copy button works

## 🐛 Common Issues

**"Cannot connect to backend"**
- Open `http://YOUR_IP:8000` in phone's browser
- Should see: `{"message": "Welcome to Smart Notebook API"}`

**"Unauthorized"**
- Get a new auth token (Step 3)

**Camera not working**
- Make sure you're on a real device, not emulator

## 📱 Testing Flow

1. Open app → Camera screen
2. Point at notebook page
3. Tap capture button (white circle)
4. Preview screen → Tap "Send to OCR"
5. Wait for processing
6. Results screen → See extracted text
7. Tap "Copy Text" → Text copied!
8. Tap "Scan Another" → Back to camera

## 🎉 You're Done!

If you see extracted text on the Results screen, Week 4 is complete! 🚀

