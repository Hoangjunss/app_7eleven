import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-white/10 bg-white/5 shadow-2xl max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-zinc-200 text-sm font-medium">Đang tải trang...</p>
      </div>
    </div>
  );
}
