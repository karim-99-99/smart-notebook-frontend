# Run sync now (WSL ↔ Windows)

To make **WSL** and **Windows** mobile folders identical, run **one** of these in a terminal:

## From Windows (PowerShell)

```powershell
cd C:\Users\DELL\SmartNotebook\mobile
.\scripts\sync-to-windows.ps1
```

## From WSL (bash)

```bash
cd /home/karim/smart-notebook/mobile
./scripts/sync-to-windows.sh
```

Or with Node (from repo root):

```bash
cd /home/karim/smart-notebook
node mobile/scripts/sync-all-to-windows.js
```

After running, both paths will have the same source files. Rebuild the app from Windows if needed: `npx react-native run-android`
