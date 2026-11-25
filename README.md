# LIFEOS — Complete Web + Native Android APK Build Bundle (v1.2)

This archive contains **both** the React + Vite + Tailwind web app (`src/`, `public/`) **and** the complete native Android Gradle + Capacitor project (`android/`) preconfigured with:
- **Package ID**: `com.lifeos.personal`
- **App Name**: `LIFEOS`
- **Native Adaptive Android Launcher Icons**: `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` & `ic_launcher_round.xml` using vector foreground/background drawables (`ic_launcher_foreground.xml`, `ic_launcher_background.xml`) — no manual PNG slicing required!
- **One-Click Cloud APK Builder**: `.github/workflows/build-apk.yml` builds a downloadable `.apk` automatically on GitHub Actions without needing local Android Studio.

---

## Option A: Build APK Locally (Android Studio or CLI)
```bash
npm install
npm run build
npx cap sync android
```
Then either:
1. Open `android/` in **Android Studio** → **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
2. Or build via command line:
   ```bash
   cd android
   gradle wrapper --gradle-version 8.7
   ./gradlew assembleDebug
   ```
   Output APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

## Option B: Zero-Setup APK Build via GitHub Actions
1. Push this extracted folder to a GitHub repository.
2. Open the **Actions** tab → run **Build Android APK**.
3. Download **`LIFEOS-android-debug-apk`** directly from the workflow artifacts.
