"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { IMG } from "@/lib/assets";
import { analyzeImageData, checkCaptureQuality, combinePoseMetrics } from "@/lib/analysis";
import { photoKey, putPhoto } from "@/lib/photoStore";
import { computeDailySkinScore, computeSkinAgeIndex, computeSubScores } from "@/lib/scoring";
import { useStore } from "@/lib/store";
import { POSES, type DayRecord, type PoseId, type RawMetrics } from "@/lib/types";

/**
 * Guided capture (spec §5).
 *
 * The auto-capture conditions the spec lists that need a landmark model
 * (face centring, rotation, eyes-open, occlusion) are not available in the web
 * MVP; `checkCaptureQuality` enforces the subset a plain canvas can verify —
 * exposure, blur and subject presence — and the ring only fills on those.
 * A manual shutter is always available so the user is never stuck.
 */

const ANALYSIS_SIZE = 320;
const HOLD_FRAMES = 8; // consecutive good frames (~1s) before auto-capture

export default function ScanPage() {
  const router = useRouter();
  const { state, hydrated, upsertRecord, nextDay } = useStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const goodFramesRef = useRef(0);
  const capturingRef = useRef(false);

  const [poseIndex, setPoseIndex] = useState(0);
  const [feedback, setFeedback] = useState("카메라를 준비하고 있어요");
  const [progress, setProgress] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<Partial<Record<PoseId, RawMetrics>>>({});
  const [busy, setBusy] = useState(false);

  const pose = POSES[poseIndex];
  const done = poseIndex >= POSES.length;

  useEffect(() => {
    if (hydrated && !state.survey) router.replace("/onboarding/survey");
  }, [hydrated, state.survey, router]);

  // --- camera lifecycle -----------------------------------------------------
  /**
   * Opens the front camera. Callable again from the retry control, since a
   * first attempt can fail simply because the permission prompt was still open.
   */
  const startCamera = useCallback(async () => {
    setFeedback("카메라를 준비하고 있어요");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraError(null);
      setFeedback("얼굴을 가이드 안에 맞춰주세요");
    } catch {
      setCameraError("camera-unavailable");
      setFeedback("카메라 권한을 허용해주세요");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off getUserMedia on mount, not a render-driven state sync
    void startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [startCamera]);

  /** Draws the current video frame into the offscreen analysis canvas. */
  const grabFrame = useCallback((): ImageData | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return null;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    const aspect = video.videoHeight / video.videoWidth;
    canvas.width = ANALYSIS_SIZE;
    canvas.height = Math.round(ANALYSIS_SIZE * aspect);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, []);

  const commitCapture = useCallback(
    async (imageData: ImageData, dataUrl: string, poseId: PoseId) => {
      const metrics = analyzeImageData(imageData);
      await putPhoto(photoKey(nextDay, poseId), dataUrl);
      setCaptured((prev) => ({ ...prev, [poseId]: metrics }));
      setPoseIndex((i) => i + 1);
      goodFramesRef.current = 0;
    },
    [nextDay],
  );

  const captureNow = useCallback(async () => {
    if (capturingRef.current || done) return;
    const imageData = grabFrame();
    const canvas = canvasRef.current;
    if (!imageData || !canvas) return;

    capturingRef.current = true;
    setBusy(true);
    try {
      await commitCapture(imageData, canvas.toDataURL("image/jpeg", 0.82), pose.id);
    } finally {
      capturingRef.current = false;
      setBusy(false);
    }
  }, [commitCapture, done, grabFrame, pose]);

  // --- quality loop ---------------------------------------------------------
  useEffect(() => {
    if (cameraError || done) return;
    const interval = window.setInterval(() => {
      if (capturingRef.current) return;
      const frame = grabFrame();
      if (!frame) return;

      const check = checkCaptureQuality(frame);
      setFeedback(check.ok ? "좋아요. 그대로 1초만!" : check.message);

      if (check.ok) {
        goodFramesRef.current += 1;
        setProgress(Math.min(1, goodFramesRef.current / HOLD_FRAMES));
        if (goodFramesRef.current >= HOLD_FRAMES) void captureNow();
      } else {
        goodFramesRef.current = 0;
        setProgress(check.progress * 0.6);
      }
    }, 120);

    return () => window.clearInterval(interval);
  }, [cameraError, done, grabFrame, captureNow]);

  // --- finish ---------------------------------------------------------------
  useEffect(() => {
    if (!done || !hydrated) return;
    const combined = combinePoseMetrics(captured);
    if (!combined) return;

    const subScores = computeSubScores(combined);
    const dailySkinScore = computeDailySkinScore(subScores);
    const record: DayRecord = {
      day: nextDay,
      date: new Date().toISOString().slice(0, 10),
      metrics: combined,
      subScores,
      dailySkinScore,
      skinAgeIndex: computeSkinAgeIndex(dailySkinScore, state.survey),
      photoKeys: Object.fromEntries(
        (Object.keys(captured) as PoseId[]).map((p) => [p, photoKey(nextDay, p)]),
      ),
      completedActions: [],
    };
    upsertRecord(record);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    router.replace(`/analysis/vision?day=${nextDay}`);
  }, [done, hydrated, captured, nextDay, state.survey, upsertRecord, router]);

  /** Fallback path when there is no camera: analyse an uploaded photo. */
  const handleUpload = async (file: File) => {
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      // createElement, not `new Image()` — the next/image component owns that name here.
      const img = document.createElement("img");
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("이미지를 읽을 수 없어요"));
        img.src = dataUrl;
      });

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d", { willReadFrequently: true });
      if (!canvas || !ctx) return;
      const aspect = img.height / img.width;
      canvas.width = ANALYSIS_SIZE;
      canvas.height = Math.round(ANALYSIS_SIZE * aspect);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      await commitCapture(imageData, canvas.toDataURL("image/jpeg", 0.82), pose.id);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-graphite text-pure-white">
        <Icon name="biotech" size={48} className="animate-pulse text-tertiary-fixed-dim" />
        <p className="font-body-lg text-body-lg">피부 지표를 분석하고 있어요…</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-graphite text-pure-white">
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 z-0 h-full w-full -scale-x-100 object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {cameraError ? (
        <div className="absolute inset-0 z-0">
          <Image src={IMG.scanFace} alt="" fill sizes="430px" className="object-cover opacity-70" />
          <div className="absolute inset-0 bg-graphite/50" />
        </div>
      ) : null}

      {/* Header */}
      <header className="relative z-10 flex w-full flex-col items-center gap-stack-md bg-gradient-to-b from-graphite/70 to-transparent px-margin-main pt-12 pb-4">
        <button
          type="button"
          aria-label="닫기"
          onClick={() => router.push(state.records.length ? "/today" : "/")}
          className="absolute top-12 right-margin-main text-pure-white transition-opacity hover:opacity-70 active:scale-95"
        >
          <Icon name="close" size={28} weight={200} />
        </button>
        <h1 className="font-headline-md text-headline-md drop-shadow-md">Face Scan</h1>

        <div className="mx-auto mt-2 flex w-full max-w-[300px] items-center justify-between">
          {POSES.map((p, i) => (
            <div key={p.id} className="flex w-0 flex-1 flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full font-label-bold text-label-bold ${
                  i < poseIndex
                    ? "bg-primary text-pure-white"
                    : i === poseIndex
                      ? "bg-tertiary-fixed text-on-tertiary-fixed"
                      : "bg-glass-overlay text-graphite backdrop-blur-sm"
                }`}
              >
                {i < poseIndex ? <Icon name="check" size={16} /> : i + 1}
              </div>
              {/* break-keep + a single line keeps all five labels on one row,
                  so the numbered circles above them stay aligned. */}
              <span className="font-label-sm text-[11px] break-keep whitespace-nowrap text-pure-white/80 drop-shadow-sm">
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </header>

      {/* Guide oval */}
      <main className="pointer-events-none relative z-10 flex flex-1 flex-col items-center justify-center px-margin-main">
        <div className="relative mb-8 flex h-[380px] w-[280px] items-center justify-center">
          <svg viewBox="0 0 280 380" className="absolute inset-0 h-full w-full">
            <ellipse
              cx="140"
              cy="190"
              rx="135"
              ry="185"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2"
              strokeDasharray="10 8"
            />
            <ellipse
              cx="140"
              cy="190"
              rx="135"
              ry="185"
              fill="none"
              stroke="#cbbeff"
              strokeWidth="4"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={100}
              strokeDashoffset={100 - progress * 100}
              style={{ transition: "stroke-dashoffset 140ms linear" }}
            />

            {/*
              Alignment guides. Eye line and mouth line sit at the usual
              proportions of a front-facing face inside this oval, so the user
              can line the same features up the same way every day — which is
              what makes day-to-day comparison meaningful.
            */}
            <g stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none">
              <line x1="140" y1="60" x2="140" y2="300" strokeDasharray="3 7" />
              <line x1="52" y1="160" x2="228" y2="160" />
              <ellipse cx="102" cy="160" rx="19" ry="10" />
              <ellipse cx="178" cy="160" rx="19" ry="10" />
              <line x1="86" y1="266" x2="194" y2="266" />
              <path d="M112 266 q28 14 56 0" />
            </g>
          </svg>
        </div>

        <div className="pointer-events-auto mt-stack-md flex items-center gap-2 rounded-full bg-glass-overlay px-6 py-3 backdrop-blur-xl">
          <Icon name="info" className="text-xl text-primary" />
          <p className="font-label-bold text-label-bold text-graphite">{feedback}</p>
        </div>
        <p className="mt-2 text-center font-body-md text-body-md text-pure-white/80 drop-shadow-md">
          {pose.instruction}
        </p>
        <p className="mt-1 text-center font-label-sm text-label-sm text-pure-white/60">
          {pose.purpose}
        </p>
      </main>

      {/* Shutter */}
      <footer className="relative z-10 flex w-full flex-col items-center gap-4 bg-gradient-to-t from-graphite/80 to-transparent px-margin-main pt-8 pb-[50px]">
        <div className="flex w-full items-center justify-center gap-6">
          {/* Only offered when the camera itself refused — otherwise the
              shutter is the single path, as the comp intends. */}
          {cameraError ? (
            <label
              aria-label={`${pose.label} 사진 올리기`}
              title={`${pose.label} 사진 올리기`}
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-glass-overlay text-graphite backdrop-blur-md transition-colors hover:bg-pure-white active:bg-pure-white/70"
            >
              <Icon name="upload" size={20} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
          ) : null}

          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[3px] border-pure-white/40" />
            <button
              type="button"
              aria-label="촬영"
              disabled={busy || Boolean(cameraError)}
              onClick={() => void captureNow()}
              className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-tertiary-fixed shadow-[0_0_20px_rgba(203,190,255,0.4)] transition-all duration-200 hover:bg-tertiary-fixed-dim active:scale-95 disabled:opacity-60"
            >
              <div className="h-14 w-14 rounded-full bg-tertiary-container shadow-inner" />
            </button>
          </div>

          {cameraError ? (
            <button
              type="button"
              aria-label="카메라 다시 시도"
              title="카메라 다시 시도"
              onClick={() => void startCamera()}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-glass-overlay text-graphite backdrop-blur-md"
            >
              <Icon name="refresh" size={20} />
            </button>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
