# 🚀 Quick Start Guide for Android Emulator

## Method 1: Using Expo DevTools (Easiest)

1. **Open Expo DevTools**
   - Go to: http://localhost:8081 in your browser
   - You should see the Expo DevTools interface

2. **Connect to Android**
   - In the terminal where Expo is running, press `a`
   - OR in the DevTools web interface, click "Run on Android device/emulator"

## Method 2: Using Expo Go App

1. **Install Expo Go on Emulator**
   - Open Google Play Store in your emulator
   - Search for "Expo Go"
   - Install the app

2. **Connect to Development Server**
   - Open Expo Go
   - Tap "Enter URL manually"
   - Type: `exp://10.0.2.2:8081`
   - Press "Connect"

## Method 3: Direct APK Build (Advanced)

If the above methods don't work, run in a new terminal:

```bash
cd /mnt/c/fitness-platform/apps/mobile-app
npx expo run:android
```

## Troubleshooting

### If you see connection errors:

1. **For Windows users with WSL2:**
   ```cmd
   # In Windows Command Prompt (not WSL)
   adb reverse tcp:8081 tcp:8081
   adb reverse tcp:3001 tcp:3001
   ```

2. **Check Metro Bundler:**
   - Make sure you see "Waiting on http://localhost:8081" in the terminal
   - If not, restart with: `npx expo start --clear`

3. **API Connection Issues:**
   - The app is configured to connect to `http://10.0.2.2:3001` (Android emulator's localhost)
   - Make sure the backend is running: `docker-compose ps`

### Current Status:
- ✅ Metro Bundler: Running on port 8081
- ✅ Backend API: Running on port 3001
- ✅ Database: Running on port 5432
- ✅ App configured for Android emulator

## What you'll see:

1. **Login Screen** - Use the test account:
   - Email: test@example.com
   - Password: TestPassword123!

2. **Main App** - Bottom navigation with:
   - Home
   - Stats
   - Records
   - Explore
   - Social

Enjoy testing your fitness app! 💪