#!/bin/bash
# Copy all updated files from WSL to Windows path
# Run this from WSL in: /home/karim/smart-notebook

echo "📋 Copying all updated files to Windows path..."
echo ""

# Define paths
WSL_BASE="/home/karim/smart-notebook/mobile"
WINDOWS_BASE="/mnt/c/Users/DELL/SmartNotebook/mobile"

# Check if Windows path exists
if [ ! -d "$WINDOWS_BASE" ]; then
    echo "❌ Error: Windows path not found: $WINDOWS_BASE"
    echo "Please make sure the path exists."
    exit 1
fi

# Create directories if they don't exist
mkdir -p "$WINDOWS_BASE/src/lib"
mkdir -p "$WINDOWS_BASE/src/screens"

SUCCESS=0
FAIL=0

# Copy files
echo "📄 Copying supabase.ts..."
if cp "$WSL_BASE/src/lib/supabase.ts" "$WINDOWS_BASE/src/lib/supabase.ts" 2>/dev/null; then
    echo "   ✓ Copied successfully"
    ((SUCCESS++))
else
    echo "   ❌ Failed to copy"
    ((FAIL++))
fi

echo "📄 Copying LoginScreen.tsx..."
if cp "$WSL_BASE/src/screens/LoginScreen.tsx" "$WINDOWS_BASE/src/screens/LoginScreen.tsx" 2>/dev/null; then
    echo "   ✓ Copied successfully"
    ((SUCCESS++))
else
    echo "   ❌ Failed to copy"
    ((FAIL++))
fi

echo "📄 Copying index.js..."
if cp "$WSL_BASE/index.js" "$WINDOWS_BASE/index.js" 2>/dev/null; then
    echo "   ✓ Copied successfully"
    ((SUCCESS++))
else
    echo "   ❌ Failed to copy"
    ((FAIL++))
fi

echo "📄 Copying package.json..."
if cp "$WSL_BASE/package.json" "$WINDOWS_BASE/package.json" 2>/dev/null; then
    echo "   ✓ Copied successfully"
    ((SUCCESS++))
else
    echo "   ❌ Failed to copy"
    ((FAIL++))
fi

echo ""
echo "═══════════════════════════════════════"
echo "Summary:"
echo "  ✓ Successfully copied: $SUCCESS files"
if [ $FAIL -gt 0 ]; then
    echo "  ❌ Failed: $FAIL files"
fi
echo "═══════════════════════════════════════"
echo ""

if [ $SUCCESS -eq 4 ]; then
    echo "✅ All files copied successfully!"
    echo ""
    echo "📦 Next steps:"
    echo "   1. Go to Windows path: cd /mnt/c/Users/DELL/SmartNotebook/mobile"
    echo "   2. Install the new package: npm install react-native-url-polyfill"
    echo "   3. Rebuild the app: npx react-native run-android"
    echo ""
else
    echo "⚠️  Some files failed to copy. Please copy them manually."
    echo ""
fi

