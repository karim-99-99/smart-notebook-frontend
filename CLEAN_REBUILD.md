# 🧹 Complete Clean Rebuild Instructions

## **Step-by-Step Clean Rebuild**

### **Step 1: Stop Everything**
- Press `Ctrl+C` in Metro bundler terminal
- Close any other terminals running the app

### **Step 2: Clear App Data**
```powershell
adb shell pm clear com.smartnotebook
```

### **Step 3: Clean Gradle Build**
```powershell
cd C:\Users\DELL\SmartNotebook\mobile\android
.\gradlew.bat clean
cd ..
```

### **Step 4: Rebuild and Run**
```powershell
cd C:\Users\DELL\SmartNotebook\mobile
npm run android
```

---

## **Check Logs**

After the app starts, check logs in a NEW terminal:

```powershell
adb logcat -c
adb logcat | Select-String -Pattern "LoginScreen|AppNavigator"
```

You should see:
```
🔵 LoginScreen: Component rendered!
🔵 LoginScreen: Component mounted!
🔍 AppNavigator: Starting auth check...
🚀 AppNavigator: Initial route: Login
```

---

## **What Should Happen**

1. **App opens** → Login screen should appear
2. **You see email/password fields** → Login screen is working!
3. **If you see camera instead** → There's still a navigation issue

---

## **If Login Screen Still Doesn't Appear**

Share the logcat output so we can see what's happening!

