"use client";

import { useEffect, useState } from "react";
import { getPhoto } from "@/lib/photoStore";

interface StoredPhotoProps {
  photoKey: string | null | undefined;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  /** Rendered while loading or when the photo is missing. */
  fallback?: React.ReactNode;
}

/** Loads a capture out of IndexedDB and renders it. */
export function StoredPhoto({ photoKey, alt, className = "", style, fallback }: StoredPhotoProps) {
  // Keyed by photoKey so a stale result never paints over a newer request.
  const [loaded, setLoaded] = useState<{ key: string; src: string | null } | null>(null);

  useEffect(() => {
    if (!photoKey) return;
    let active = true;
    void getPhoto(photoKey).then((value) => {
      if (active) setLoaded({ key: photoKey, src: value });
    });
    return () => {
      active = false;
    };
  }, [photoKey]);

  const src = photoKey && loaded?.key === photoKey ? loaded.src : null;

  if (!src) {
    return (
      <>
        {fallback ?? (
          <div
            className={`flex items-center justify-center bg-surface-container text-on-surface-variant ${className}`}
          >
            <span className="font-label-sm text-label-sm">사진 없음</span>
          </div>
        )}
      </>
    );
  }

  // Captures are local data: URLs, so next/image optimisation does not apply.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} style={style} />;
}
