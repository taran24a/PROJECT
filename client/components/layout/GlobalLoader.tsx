import React from "react";
import { useUIStore } from "@/store/ui";

export default function GlobalLoader() {
  const globalLoading = useUIStore((s) => s.globalLoading);
  if (!globalLoading) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center pointer-events-none">
      <div className="glass rounded-full px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-foreground/90">Loading...</span>
        </div>
      </div>
    </div>
  );
}