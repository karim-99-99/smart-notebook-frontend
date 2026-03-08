# 🔍 Debug Login Screen Issue

## **Problem: Login Screen Not Appearing**

If the Login screen doesn't appear, follow these steps:

### **Step 1: Check Metro Console Logs**

When you run `npm start`, you should see logs like:
```
🔍 AppNavigator: Starting auth check...
✅ AppNavigator: Supabase configured, checking session...
📊 AppNavigator: Session exists: false
🚀 AppNavigator: Initial route: Login
```

If you see errors instead, share them!

### **Step 2: Force Show Login Screen (Test)**

To test if Login screen works, temporarily edit `AppNavigator.tsx`:

```typescript
// Force Login screen
initialRouteName="Login"
```

### **Step 3: Clear App Data**

The app might have cached auth state. Clear it:

```powershell
adb shell pm clear com.smartnotebook
```

Then rebuild:
```powershell
npm run android
```

### **Step 4: Check File Structure**

Verify these files exist:
- ✅ `src/lib/supabase.ts`
- ✅ `src/screens/LoginScreen.tsx`
- ✅ `src/navigation/AppNavigator.tsx`
- ✅ `src/navigation/types.ts` (with `Login: undefined`)

### **Step 5: Check Dependencies**

```powershell
cd C:\Users\DELL\SmartNotebook\mobile
npm install
```

### **Step 6: Rebuild from Scratch**

```powershell
# Stop Metro
# Press Ctrl+C

# Clear cache
npm start -- --reset-cache

# In another terminal
cd android
.\gradlew clean
cd ..
npm run android
```

---

## **Expected Console Output**

When app starts, you should see:
```
🔍 AppNavigator: Starting auth check...
✅ AppNavigator: Supabase configured, checking session...
📊 AppNavigator: Session exists: false
📱 AppNavigator: Render - isLoading: false isLoggedIn: false
🚀 AppNavigator: Initial route: Login
```

If you see different output, share it!

---

## **Quick Test**

1. Open `AppNavigator.tsx`
2. Find line: `initialRouteName={initialRoute}`
3. Change to: `initialRouteName="Login"`
4. Save and rebuild
5. Login screen should appear

If it still doesn't appear, there's a different issue (maybe LoginScreen component error).

