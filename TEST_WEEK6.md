# Week 6 Testing Guide

## 🧪 Quick Testing Instructions

### Prerequisites
- Backend server must be running on WSL
- Android device/emulator connected

---

## Step-by-Step Testing

### 1. Start Backend Server (in WSL)
```bash
cd ~/smart-notebook/backend
source venv/bin/activate
python app.py
```

### 2. Start Metro Bundler (Windows)
```bash
cd C:\Users\DELL\SmartNotebook\mobile
npm start
```

### 3. Run on Android (new terminal)
```bash
cd C:\Users\DELL\SmartNotebook\mobile
npm run android
```

---

## 🎯 Test Scenarios

### Test 1: Auto-Title Generation ⏱️ (2 minutes)

**Steps:**
1. Open app
2. Click "📸 Scan"
3. Take a photo of notebook page
4. Click "✓ Use Photo"
5. Wait for OCR processing
6. **DO NOT enter a title** (leave blank)
7. Select a folder
8. Click "💾 Save"
9. Go to History
10. Verify note has auto-generated title like "Math - Dec 8, 2025 at 2:30 PM"

**Expected Result:** ✅ Auto-generated title appears

---

### Test 2: Folder Rename ⏱️ (2 minutes)

**Steps:**
1. Click "📁 Folders" from scan screen
2. Find any folder
3. Click ✏️ (edit button) next to folder name
4. Change the folder name to "Test Folder Updated"
5. Click a different icon (e.g., 📚 or 📖)
6. Click a different color
7. Click "Update"
8. Verify changes are saved

**Expected Result:** ✅ Folder name, icon, and color updated

---

### Test 3: JSON Export ⏱️ (1 minute)

**Steps:**
1. Go to "📁 Folders" screen
2. Look at top-right corner
3. Click "🧪 Test Export" button
4. Read the alert message
5. Check console/logs for JSON output

**Expected Result:** 
✅ Alert shows: "X folders, Y notes"
✅ Console shows complete JSON structure

---

### Test 4: Complete Workflow ⏱️ (5 minutes)

**Steps:**
1. Create 2 folders: "Physics" and "Chemistry"
2. Scan 2 pages and save to "Physics" folder
3. Scan 1 page and save to "Chemistry" folder
4. Open one note from Physics
5. Edit the text (make corrections)
6. Change the title to "Physics Lecture 1"
7. Save changes
8. Go back to Folders
9. Click ✏️ on "Physics" folder
10. Rename it to "Physics 101"
11. Go to "🧪 Test Export"
12. Verify all data is correct

**Expected Results:**
✅ All folders created
✅ All notes saved correctly
✅ Edits saved properly
✅ Folder rename worked
✅ Export shows all data

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to server"
**Solution:** 
- Check WSL backend is running
- Verify port forwarding: `netsh interface portproxy show all`
- Check firewall settings

### Issue 2: "Database error"
**Solution:**
- Clear app data: `adb shell pm clear com.smartnotebook`
- Reinstall app: `npm run android`

### Issue 3: "Photo capture fails"
**Solution:**
- Check camera permissions
- Restart app
- Check device camera works

### Issue 4: "OCR not working"
**Solution:**
- Verify backend server logs
- Check network connection
- Test OCR endpoint directly: `curl http://localhost:5000/health`

---

## 📊 Success Criteria

All tests pass if:
- ✅ Auto-titles generate when title is blank
- ✅ Folders can be renamed with new icon/color
- ✅ JSON export returns valid data structure
- ✅ Complete workflow executes without errors
- ✅ Database stores all data correctly
- ✅ No crashes or freezes
- ✅ UI responds smoothly

---

## 🔍 Verification Commands

### Check Database (if needed)
```bash
# Connect to device
adb shell

# Navigate to app data
cd /data/data/com.smartnotebook/databases

# Open database
sqlite3 SmartNotebook.db

# Check tables
.tables

# Check folders
SELECT * FROM folders;

# Check notes
SELECT id, title, folder_id, timestamp FROM notes;

# Exit
.exit
```

### Check Logs
```bash
# Android logs
npx react-native log-android

# Filter for our app
adb logcat | grep -i "smartnotebook"

# Check Metro bundler
# Look at terminal where "npm start" is running
```

---

## 📝 Test Results Log

Use this checklist while testing:

```
Date: _______________
Tester: _______________

[ ] Test 1: Auto-Title Generation - PASS/FAIL
    Notes: ________________________________

[ ] Test 2: Folder Rename - PASS/FAIL
    Notes: ________________________________

[ ] Test 3: JSON Export - PASS/FAIL
    Notes: ________________________________

[ ] Test 4: Complete Workflow - PASS/FAIL
    Notes: ________________________________

Overall Status: PASS/FAIL

Issues Found:
1. ___________________________________
2. ___________________________________
3. ___________________________________
```

---

## 🎉 After Testing

Once all tests pass:

1. ✅ Mark Week 6 as complete
2. 📋 Document any issues found
3. 🔄 Copy all changes to WSL path:
   ```bash
   # From Windows
   cd C:\Users\DELL\SmartNotebook
   .\sync-to-wsl.ps1
   ```
4. 🚀 Ready for Week 7 (Cloud Sync)

---

## 💡 Tips

- Test on a real device (not just emulator)
- Test with both Arabic and English text
- Test with multiple users/folders
- Test edge cases (empty notes, long titles, etc.)
- Take screenshots of successful tests

Good luck! 🍀

