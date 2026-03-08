#!/bin/bash
# Copy updated files from WSL to Windows path
# Run this script from the project root in WSL

echo "📋 Copying updated files to Windows path..."
echo ""

# Define paths
WSL_PATH="/home/karim/smart-notebook/mobile"
WINDOWS_PATH="/mnt/c/Users/DELL/SmartNotebook/mobile"

# Check if Windows path exists
if [ ! -d "$WINDOWS_PATH" ]; then
    echo "❌ Error: Windows path not found: $WINDOWS_PATH"
    echo "Please make sure the path is correct."
    exit 1
fi

# Files to copy
echo "📄 Copying supabase.ts..."
cp "$WSL_PATH/src/lib/supabase.ts" "$WINDOWS_PATH/src/lib/supabase.ts" && echo "   ✓ Copied successfully" || echo "   ❌ Failed to copy"

echo "📄 Copying index.js..."
cp "$WSL_PATH/index.js" "$WINDOWS_PATH/index.js" && echo "   ✓ Copied successfully" || echo "   ❌ Failed to copy"

echo "📄 Copying package.json..."
cp "$WSL_PATH/package.json" "$WINDOWS_PATH/package.json" && echo "   ✓ Copied successfully" || echo "   ❌ Failed to copy"

echo ""
echo "✅ File copy completed!"
echo ""
echo "📦 Next steps:"
echo "   1. Go to Windows path: cd /mnt/c/Users/DELL/SmartNotebook/mobile"
echo "   2. Install the new package: npm install react-native-url-polyfill"
echo "   3. Rebuild the app: npx react-native run-android"
echo ""

