# Android: `CKCamera` crash when taking a photo

## Cause

1. **`react-native-camera-kit`** uses `findNodeHandle` → native code crashes on New Architecture / when the view tag is null.
2. The app must use **`expo-camera`** (`CameraView` + `takePictureAsync`) only — see `src/screens/ScanScreen.tsx`.
3. If you still see **`RNCameraKitModule.kt`**, the device is running an **old JS bundle** (cached under `android/app/build` or an old `index.android.bundle` in assets), or **`node_modules` still contains `react-native-camera-kit`**.

## Fix (Windows, from your `mobile` folder)

Run in **PowerShell** (use `;` instead of `&&` if needed):

```powershell
cd C:\Users\DELL\SmartNotebook\mobile
```

1. **Sync source** with the repo (`ScanScreen.tsx` must import only `expo-camera`, not `react-native-camera-kit`).

2. **Remove camera-kit and reinstall** (updates native autolinking):

```powershell
Remove-Item -Recurse -Force .\node_modules\react-native-camera-kit -ErrorAction SilentlyContinue
npm install
```

3. **Delete the old packaged JS** (forces a new bundle on next build):

```powershell
Remove-Item -Recurse -Force .\android\app\build -ErrorAction SilentlyContinue
Remove-Item -Force .\android\app\src\main\assets\index.android.bundle -ErrorAction SilentlyContinue
```

4. **Stop Gradle** (helps if clean/delete fails):

```powershell
cd android
.\gradlew.bat --stop
cd ..
```

5. **Metro clean + reinstall app**:

```powershell
npx react-native start --reset-cache
```

In a **second** terminal:

```powershell
cd C:\Users\DELL\SmartNotebook\mobile
npx react-native run-android
```

6. On the phone: **uninstall** the app once, then run step 5 again (clears old embedded JS).

## If `gradlew clean` fails with “Unable to delete … expo-eas-client”

Close Android Studio and Metro, run `.\gradlew.bat --stop`, then delete the folder it names, or skip `clean` and only delete `android\app\build` as above.

---

## Windows: `C:\Users\...\SmartNotebook\mobile` vs WSL repo

If **`npm run kill-metro`** or **`scripts\kill-metro-8081.ps1`** is missing, your **Windows** copy is **not** synced with **`\\wsl.localhost\...\smart-notebook\mobile`**.

**Default dev setup:** **localhost + port 8082** everywhere (Windows often reserves **8081** for **svchost**). Matches `package.json`, `REACT_NATIVE_DEV_SERVER_PORT`, and `adb reverse`. Run **`npm run android`**.

**If you must use 8081:** change **both** `gradle.properties` and **`package.json`** ports to **8081**, then rebuild the debug APK (only if nothing system-owned listens on 8081).

**Option A — free port 8082 (if something else listens there, not svchost):**

```powershell
Get-NetTCPConnection -LocalPort 8082 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

**Option B — run the script from WSL over the network share:**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "\\wsl.localhost\Ubuntu\home\karim\smart-notebook\mobile\scripts\kill-metro-8081.ps1"
```

If that path fails, try:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "\\wsl$\Ubuntu\home\karim\smart-notebook\mobile\scripts\kill-metro-8081.ps1"
```

**Option C — copy** `mobile\scripts\kill-metro-8081.ps1` and **`kill-metro-8081.cmd`**, and merge **`package.json`** scripts from the WSL repo into your Windows `package.json`.

---

## “Unable to load script” / `loadJSBundleFromAssets`

The app could not download JS from **Metro** and tried to load **`index.android.bundle` from assets** (there is none in dev after cleanup).

### Rule: Metro and `adb` must be on the same “machine”

If the project lives in **WSL** but you use **Android Studio / `adb` on Windows**, then:

- `adb reverse tcp:8082 tcp:8082` forwards the phone to **Windows** `localhost:8082` (must match `REACT_NATIVE_DEV_SERVER_PORT`).
- Metro started **inside WSL** listens on **WSL’s** loopback — **Windows cannot reach it** through that reverse tunnel.

**Fix:** From **`C:\Users\DELL\SmartNotebook\mobile`** (Windows), run Metro and `adb`:

```powershell
cd C:\Users\DELL\SmartNotebook\mobile
npm run start
```

(`--host 0.0.0.0` is set so **Wi‑Fi devices on the same LAN** can open `http://<your-pc-ip>:8082`.)

In a **second** PowerShell window:

```powershell
cd C:\Users\DELL\SmartNotebook\mobile
npm run android
```

(`preandroid` runs **`adb reverse`** when a USB device exists; it **ignores errors** for Wi‑Fi‑only.)

### Same Wi‑Fi but still “Unable to load script”?

The debug APK must load JS from **`http://<PC-LAN-IP>:8082`**, not `http://localhost:8082` on Wi‑Fi (on the phone, **localhost** is the phone — USB + adb reverse is different).

**Option A — automatic (recommended):**

```powershell
npm run start
# second terminal:
npm run android:lan
```

`android:lan` picks your PC’s IPv4, sets `REACT_NATIVE_PACKAGER_HOSTNAME` for Gradle, and reinstalls the app.

**Option B — manual:** run `ipconfig`, copy your **Wi‑Fi IPv4** (e.g. `192.168.1.50`), put it in `android/gradle.properties` as `REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.50`, then `npm run android`.

**Windows Firewall:** allow **inbound TCP 8082** for **Node.js** (or Metro won’t be reachable from the phone).

**Guest / AP isolation:** some routers block phone ↔ PC; try another network or USB + `npm run android`.

### Checklist

1. **Start Metro on 8082:** `npm run start` (or `npm run start:android` — same port).
2. **USB:** use **`npm run android`** so **`preandroid`** runs `adb reverse`, or run `npm run adb:reverse` manually after `adb kill-server`.
3. **Same port everywhere:** prefer **`npm run android`** (includes `--port 8082`) so it matches the APK from `gradle.properties`.
4. **Rebuild** after changing `gradle.properties` (hostname/port are baked into the debug APK).
