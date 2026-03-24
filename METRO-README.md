# Fix: "Metro is run from the wrong folder"

The app must load JavaScript from **the same project** you use to run Android.  
Use the **Windows** project folder only.

## Correct way to run the app

### Step 1: Start Metro from the Windows folder only

In PowerShell, run:

```powershell
cd C:\Users\DELL\SmartNotebook\mobile
.\scripts\START-METRO-FROM-WINDOWS.ps1
```

Or manually:

```powershell
cd C:\Users\DELL\SmartNotebook\mobile
npm run start
```

**Leave this terminal open.** Do not start Metro from WSL or from `\\wsl.localhost\...\smart-notebook\mobile`.

### Step 2: Run the app (in a second terminal)

```powershell
cd C:\Users\DELL\SmartNotebook\mobile
npm run android
```

## If you still see the error

1. **Stop all Metro/Node** – Close any terminal running `react-native start` or Metro.
2. **Kill port 8082** (optional):
   ```powershell
   Get-NetTCPConnection -LocalPort 8082 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
   ```
3. **Start Metro again from the Windows folder only:**
   ```powershell
   cd C:\Users\DELL\SmartNotebook\mobile
   .\scripts\START-METRO-FROM-WINDOWS.ps1
   ```
4. Then run the app in another terminal from the same folder.

## Rule

- **Metro** = always from `C:\Users\DELL\SmartNotebook\mobile`
- **Run Android** = always from `C:\Users\DELL\SmartNotebook\mobile`
- Do **not** run Metro from the WSL path (`\\wsl...\smart-notebook\mobile`).
