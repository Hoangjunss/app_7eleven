#!/bin/bash
# -----------------------------------------------------------------------------
# Frontend Production Build & Deploy Script
# -----------------------------------------------------------------------------
# Tự động đóng gói và xuất bản ứng dụng Next.js dưới dạng 'standalone'
# -----------------------------------------------------------------------------

set -e

echo "========================================================="
echo "   Khởi động tiến trình Đóng gói & Deploy Frontend...   "
echo "========================================================="

# Di chuyển vào thư mục frontend
cd "$(dirname "$0")/frontend"

echo "Step 1: Cài đặt dependencies sạch..."
npm ci --legacy-peer-deps || npm install --legacy-peer-deps

echo "Step 2: Chạy kiểm tra tĩnh và TypeScript..."
npm run lint

echo "Step 3: Chạy bộ unit test..."
npm run test

echo "Step 4: Khởi động build ứng dụng Next.js..."
npm run build

echo "========================================================="
echo "   ĐÓNG GÓI HOÀN TẤT THÀNH CÔNG!                        "
echo "========================================================="
echo "Thư mục sản phẩm standalone nằm tại: frontend/.next/standalone"
echo "Để chạy ứng dụng, bạn có thể sử dụng: "
echo "   node frontend/.next/standalone/server.js"
echo "========================================================="
