"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Segment level error caught by boundary:", error);
  }, [error]);

  return (
    <div className="w-full max-w-xl mx-auto py-24 px-4 flex flex-col items-center justify-center text-center gap-6 text-white">
      <div className="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center shrink-0">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-white font-heading">
          Đã xảy ra sự cố ngoài ý muốn
        </h2>
        <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
          Hệ thống gặp sự cố khi tải trang này. Vui lòng thử lại hoặc quay lại trang chủ.
        </p>
        {error.message && (
          <div className="mt-4 p-3 bg-red-955/20 border border-red-500/10 rounded-lg text-xs font-mono text-red-400 text-left max-w-md overflow-x-auto">
            <span className="font-semibold text-zinc-450">Digest:</span> {error.digest || "N/A"}<br />
            <span className="font-semibold text-zinc-450">Lỗi:</span> {error.message}
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-2">
        <Button
          onClick={() => reset()}
          variant="ghost"
          className="border border-white/10 hover:bg-white/5 text-white rounded-lg px-4 py-2 cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </Button>
        <Link href="/">
          <Button className="bg-[#0C5CAB] hover:bg-[#0a4a8a] text-white rounded-lg px-4 py-2 cursor-pointer flex items-center gap-1.5">
            <Home className="h-4 w-4" />
            Về trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}
