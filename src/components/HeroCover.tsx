"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { StoredPhoto } from "@/components/StoredPhoto";
import { IMG } from "@/lib/assets";
import { fileToDataUrl } from "@/lib/image";
import { useStore } from "@/lib/store";

interface HeroCoverProps {
  /** Today's capture, which outranks the uploaded cover when it exists. */
  todayPhotoKey?: string | null;
  todayAlt?: string;
  /** Score panel and badges, hidden while the user is framing the photo. */
  children?: ReactNode;
}

const clamp = (n: number) => Math.min(100, Math.max(0, n));

/**
 * Dashboard cover image.
 *
 * Falls back through today's capture → the user's uploaded cover → the comp's
 * stand-in portrait. An uploaded cover can be dragged into place: `object-fit`
 * decides how much of the photo is cropped, and the saved `object-position`
 * decides which part survives the crop.
 */
export function HeroCover({ todayPhotoKey, todayAlt = "오늘 기록", children }: HeroCoverProps) {
  const { state, saveHeroPhoto, moveHeroPhoto, removeHeroPhoto } = useStore();
  const hero = state.heroPhoto;

  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState({ x: 50, y: 50 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  const position = editing ? draft : (hero ?? { x: 50, y: 50 });
  const objectPosition = `${position.x}% ${position.y}%`;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await saveHeroPhoto(await fileToDataUrl(file));
      setDraft({ x: 50, y: 50 });
    } catch {
      setError("사진을 불러오지 못했어요. 다른 파일로 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const startEditing = () => {
    setDraft(hero ? { x: hero.x, y: hero.y } : { x: 50, y: 50 });
    setEditing(true);
    setMenuOpen(false);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!editing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, ox: draft.x, oy: draft.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const start = drag.current;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!start || !rect) return;
    // Dragging the photo down reveals more of its top, i.e. a lower position %.
    const dx = ((e.clientX - start.px) / rect.width) * 100;
    const dy = ((e.clientY - start.py) / rect.height) * 100;
    setDraft({ x: clamp(start.ox - dx), y: clamp(start.oy - dy) });
  };

  const endDrag = () => {
    drag.current = null;
  };

  return (
    <section
      ref={frameRef}
      className={`relative mb-4 aspect-square w-full overflow-hidden rounded-[32px] bg-surface-container shadow-[0_8px_30px_rgba(0,67,57,0.1)] ${
        editing ? "cursor-grab touch-none select-none active:cursor-grabbing" : ""
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <StoredPhoto
        photoKey={todayPhotoKey}
        alt={todayAlt}
        className="h-full w-full object-cover"
        fallback={
          hero ? (
            <StoredPhoto
              photoKey={hero.key}
              alt="내가 올린 사진"
              className="h-full w-full object-cover"
              style={{ objectPosition }}
            />
          ) : (
            <Image
              src={IMG.heroPortrait}
              alt=""
              fill
              priority
              sizes="430px"
              // 30% down from a plain top-crop, so the frame holds less
              // empty headroom and more of the subject.
              className="object-cover"
              style={{ objectPosition: "50% 30%" }}
            />
          )
        }
      />

      {editing ? (
        <>
          {/* Rule-of-thirds guides while framing */}
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="border border-pure-white/25" />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center">
            <span className="rounded-full bg-graphite/70 px-3 py-1.5 font-label-sm text-label-sm text-pure-white">
              드래그해서 위치를 맞춰보세요
            </span>
          </div>
          <div className="absolute inset-x-4 bottom-4 flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 rounded-full bg-pure-white/85 py-3 font-label-bold text-label-bold text-graphite backdrop-blur-sm transition-colors hover:bg-pure-white active:bg-pure-white/70"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => {
                moveHeroPhoto(draft.x, draft.y);
                setEditing(false);
              }}
              className="flex-1 rounded-full bg-primary py-3 font-label-bold text-label-bold text-pure-white transition-colors hover:bg-primary-container active:bg-primary-container"
            >
              저장
            </button>
          </div>
        </>
      ) : (
        <>
          {/*
            One trigger, not a row of three. With no cover photo yet there is
            only one action anyway, so the trigger opens the file picker
            directly; once a cover exists it opens an accordion of the three
            actions instead, stacked underneath.
          */}
          <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
            <CoverButton
              icon={busy ? "hourglass_top" : hero ? "more_horiz" : "add_photo_alternate"}
              label={hero ? "사진 옵션" : "사진 올리기"}
              onClick={() => (hero ? setMenuOpen((v) => !v) : fileRef.current?.click())}
              disabled={busy}
            />

            {/* Accordion: height/opacity animate together so it reads as
                unfolding, not just appearing. */}
            <div
              className={`flex flex-col items-end gap-1.5 overflow-hidden transition-all duration-200 ${
                menuOpen && hero ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <CoverButton icon="open_with" label="위치 조정" onClick={startEditing} />
              <CoverButton
                icon="add_photo_alternate"
                label="사진 변경"
                onClick={() => {
                  setMenuOpen(false);
                  fileRef.current?.click();
                }}
                disabled={busy}
              />
              <CoverButton
                icon="delete"
                label="사진 삭제"
                onClick={() => {
                  removeHeroPhoto();
                  setMenuOpen(false);
                }}
              />
            </div>
          </div>

          {error ? (
            <p className="absolute inset-x-4 top-16 rounded-xl bg-error-container px-3 py-2 text-center font-label-sm text-label-sm text-on-error-container">
              {error}
            </p>
          ) : null}

          {children}
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </section>
  );
}

function CoverButton({
  icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      // The visible circle is half the previous 40px; the button itself stays
      // larger so the tap target doesn't drop below a usable size.
      className="flex h-9 w-9 items-center justify-center text-graphite disabled:opacity-60"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-glass-overlay backdrop-blur-md transition-colors hover:bg-pure-white active:bg-pure-white/70">
        <Icon name={icon} size={10} />
      </span>
    </button>
  );
}
