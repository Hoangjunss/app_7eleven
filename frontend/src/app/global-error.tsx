"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global system error caught:", error);
  }, [error]);

  return (
    <html lang="vi" className="dark">
      <head>
        <title>Lỗi hệ thống | 7Eleven Shop</title>
      </head>
      <body className="bg-zinc-950 text-white min-h-screen flex flex-col items-center justify-center p-6 antialiased font-sans">
        <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
          <div className="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-8 w-8 text-red-550" />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Lỗi hệ thống nghiêm trọng
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Ứng dụng đã gặp lỗi không thể tự khôi phục tại root layout. Vui lòng bấm vào nút bên dưới để tải lại hệ thống.
            </p>
            {error.message && (
              <div className="mt-4 p-3 bg-red-955/20 border border-red-500/10 rounded-lg text-xs font-mono text-red-400 text-left overflow-x-auto w-full">
                <span className="font-semibold text-zinc-450">Chi tiết:</span> {error.message}
              </div>
            )}
          </div>

          <button
            onClick={() => reset()}
            className="w-full bg-[#0C5CAB] hover:bg-[#0a4a8a] text-white rounded-lg py-2.5 font-semibold flex items-center justify-center gap-2 shadow-md shadow-black/25 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0C5CAB] transition-colors border-0"
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại hệ thống
          </button>
        </div>
      </body>
    </html>
  );
}
