# Syncing WSL and Windows mobile projects

To keep **WSL** (`\\wsl.localhost\Ubuntu\home\karim\smart-notebook\mobile`) and **Windows** (`C:\Users\DELL\SmartNotebook\mobile`) identical, run one of these:

## Option 1: From Windows (PowerShell)

```powershell
cd C:\Users\DELL\SmartNotebook\mobile
.\scripts\sync-to-windows.ps1
```

This copies everything from the WSL `mobile` folder into the Windows `mobile` folder (except `node_modules`, `build`, `.gradle`, `.expo`). Run it after making changes in the WSL/workspace project.

## Option 2: From WSL (bash)

```bash
cd /home/karim/smart-notebook/mobile
chmod +x scripts/sync-to-windows.sh
./scripts/sync-to-windows.sh
```

Uses `rsync` to mirror the project to `C:\Users\DELL\SmartNotebook\mobile`.

## Option 3: Full sync with robocopy (PowerShell)

```powershell
cd C:\Users\DELL\SmartNotebook\mobile
.\scripts\sync-wsl-to-windows.ps1
```

Mirrors the entire tree with robocopy (excludes node_modules and build dirs).

## After syncing

- Run the app from Windows: `cd C:\Users\DELL\SmartNotebook\mobile && npx react-native run-android`
- Or start Metro from WSL/Windows and use the same codebase
