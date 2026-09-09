"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export function TrailerButton({ videoKey, title }: { videoKey: string; title: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)} className="gap-2">
        <span aria-hidden>▶</span> Watch Trailer
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} trailer`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm [animation:stagger-in_0.2s_ease-out]"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-xl2 border border-white/10 shadow-[0_0_60px_10px_rgba(245,183,34,0.15),0_20px_60px_-10px_rgba(0,0,0,0.7)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close trailer"
              className="absolute -top-10 right-0 cursor-pointer text-2xl text-white/70 transition-colors hover:text-brand-orange sm:top-2 sm:right-2 sm:z-10"
            >
              ✕
            </button>
            <div className="aspect-video w-full bg-black">
              <iframe
                key={videoKey}
                src={`https://www.youtube.com/embed/${videoKey}?autoplay=1`}
                title={`${title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
