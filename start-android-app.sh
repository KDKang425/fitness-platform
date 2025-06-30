#!/bin/bash

echo "🚀 Starting Fitness App for Android Emulator"
echo "==========================================="

# Change to app directory
cd /mnt/c/fitness-platform/apps/mobile-app

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "node.*metro" 2>/dev/null || true
pkill -f "node.*expo" 2>/dev/null || true
sleep 2

# Clear caches
echo "🗑️ Clearing caches..."
rm -rf .expo 2>/dev/null
rm -rf node_modules/.cache 2>/dev/null
npx expo start --clear &

# Wait for Metro to start
echo "⏳ Waiting for Metro Bundler to start..."
sleep 10

echo ""
echo "✅ Expo should now be running!"
echo ""
echo "📱 TO CONNECT YOUR ANDROID EMULATOR:"
echo "====================================="
echo ""
echo "Option 1: Press 'a'"
echo "  - Look for the terminal showing 'Metro waiting on http://localhost:8081'"
echo "  - Press the letter 'a' on your keyboard"
echo ""
echo "Option 2: Use Expo Go"
echo "  1. Install Expo Go from Play Store on your emulator"
echo "  2. Open Expo Go"
echo "  3. Tap 'Enter URL manually'"
echo "  4. Type: exp://10.0.2.2:8081"
echo ""
echo "Option 3: Direct Browser"
echo "  - Open http://localhost:8081 in your browser"
echo "  - Click 'Run on Android device/emulator'"
echo ""
echo "📝 Test Account:"
echo "  Email: test@example.com"
echo "  Password: TestPassword123!"
echo ""
echo "Press Ctrl+C to stop the server"

# Keep the script running
wait