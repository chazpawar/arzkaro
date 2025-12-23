@echo off
echo ================================================
echo React Native Android Build Fix
echo ================================================
echo.

echo [Step 1/5] Applying CMakeLists.txt patch...
node android\fix-rnscreens.js
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to apply patch!
    exit /b 1
)
echo.

echo [Step 2/5] Cleaning Android build cache...
cd android
call gradlew.bat clean >nul 2>&1
cd ..
echo Build cache cleaned.
echo.

echo [Step 3/5] Removing CMake cache...
if exist "node_modules\react-native-screens\android\.cxx" (
    rmdir /s /q "node_modules\react-native-screens\android\.cxx"
    echo CMake cache removed.
) else (
    echo CMake cache not found (already clean).
)
echo.

echo [Step 4/5] Removing react-native-screens build artifacts...
if exist "node_modules\react-native-screens\android\build" (
    rmdir /s /q "node_modules\react-native-screens\android\build"
    echo Build artifacts removed.
) else (
    echo Build artifacts not found (already clean).
)
echo.

echo [Step 5/5] Building Android app...
echo This may take a few minutes...
echo.
call npm run android

echo.
echo ================================================
echo Build process completed!
echo ================================================
