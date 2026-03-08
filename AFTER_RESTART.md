# 🔄 After PC Restart - Complete Rebuild Steps

## **After you restart your PC, follow these steps:**

### **Step 1: Open Terminal and Navigate**
```powershell
cd C:\Users\DELL\SmartNotebook\mobile
```

### **Step 2: Clear App Data**
```powershell
adb shell pm clear com.smartnotebook
```

### **Step 3: Clean Gradle Build**
```powershell
cd android
.\gradlew.bat clean
cd ..
```

### **Step 4: Start Metro with Cache Clear**
```powershell
npm start -- --reset-cache
```
**Keep this terminal running!**

### **Step 5: In a NEW Terminal, Build and Run**
```powershell
cd C:\Users\DELL\SmartNotebook\mobile
npm run android
```

---

## **What Should Happen:**

1. ✅ Metro bundler starts with fresh cache
2. ✅ App builds from scratch
3. ✅ App installs on device
4. ✅ **Login screen should appear first!**

---

## **If Login Screen Still Doesn't Appear:**

Check logs:
```powershell
adb logcat | Select-String -Pattern "LoginScreen|AppNavigator|Error"
```

Look for:
- `🔵 LoginScreen: Component rendered!`
- `🚀 AppNavigator: Initial route set to: Login`
- Any error messages

---

## **Quick Test:**

After restart, the code is set to **ALWAYS show Login screen first** with no conditions. If it still shows Scan screen, there's likely a build cache issue that needs deeper investigation.

