#!/bin/bash
# Copy files from WSL to Windows - Run this in WSL terminal
# Usage: bash copy-files-now.sh

echo "📋 Copying files to Windows path..."
echo ""

# Define paths
WSL_BASE="/home/karim/smart-notebook/mobile"
WINDOWS_BASE="/mnt/c/Users/DELL/SmartNotebook/mobile"

# Check if source exists
if [ ! -d "$WSL_BASE" ]; then
    echo "❌ Error: Source directory not found: $WSL_BASE"
    exit 1
fi

# Create destination directories
echo "Creating directories..."
mkdir -p "$WINDOWS_BASE/src/lib"
mkdir -p "$WINDOWS_BASE/src/screens"
echo "✓ Directories created"
echo ""

# Copy files
echo "Copying files..."
echo ""

echo "1. Copying supabase.ts..."
if cp "$WSL_BASE/src/lib/supabase.ts" "$WINDOWS_BASE/src/lib/supabase.ts" 2>/dev/null; then
    echo "   ✓ Copied successfully"
else
    echo "   ❌ Failed to copy"
fi

echo "2. Copying LoginScreen.tsx..."
if cp "$WSL_BASE/src/screens/LoginScreen.tsx" "$WINDOWS_BASE/src/screens/LoginScreen.tsx" 2>/dev/null; then
    echo "   ✓ Copied successfully"
else
    echo "   ❌ Failed to copy"
fi

echo "3. Copying index.js..."
if cp "$WSL_BASE/index.js" "$WINDOWS_BASE/index.js" 2>/dev/null; then
    echo "   ✓ Copied successfully"
else
    echo "   ❌ Failed to copy"
fi

echo "4. Copying package.json..."
if cp "$WSL_BASE/package.json" "$WINDOWS_BASE/package.json" 2>/dev/null; then
    echo "   ✓ Copied successfully"
else
    echo "   ❌ Failed to copy"
fi

echo ""
echo "═══════════════════════════════════════"
echo "✅ Copy process completed!"
echo ""
echo "📦 Next steps:"
echo "   1. Go to Windows PowerShell"
echo "   2. cd C:\Users\DELL\SmartNotebook\mobile"
echo "   3. npm install react-native-url-polyfill"
echo "   4. npx react-native run-android"
echo "═══════════════════════════════════════"

