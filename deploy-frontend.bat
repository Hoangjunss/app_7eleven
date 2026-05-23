@echo off
rem -----------------------------------------------------------------------------
# Frontend Production Build & Deploy Script for Windows
rem -----------------------------------------------------------------------------

echo =========================================================
echo    Khoi dong tien trinh Dong goi ^& Deploy Frontend...   
echo =========================================================

cd /d "%~dp0\frontend"

echo Step 1: Cai dat dependencies sach...
call npm install --legacy-peer-deps

echo Step 2: Chay kiem tra tinh va TypeScript...
call npm run lint

echo Step 3: Chay bo unit test...
call npm run test

echo Step 4: Khoi dong build ung dung Next.js...
call npm run build

echo =========================================================
echo    DONG GOI HOAN TAT THANH CONG!                        
echo =========================================================
echo Thu muc san pham standalone nam tai: frontend\.next\standalone
echo De chay ung dung, ban co the su dung: 
echo    node frontend\.next\standalone\server.js
echo =========================================================
pause
