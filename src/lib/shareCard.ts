/**
 * Face-free result card (deck §11 GTM: 개인 결과 카드 공유 → UGC).
 *
 * Rendered on a canvas so it can be saved or handed to the OS share sheet as
 * a PNG. Deliberately carries no photo: the score change is the story, and
 * the user's face stays on the device (spec §13, deck "Trust by design").
 */

export interface ShareCardData {
  nickname: string;
  fromDay: number;
  toDay: number;
  scoreStart: number;
  scoreEnd: number;
  experimentTitle?: string | null;
  deltas: Array<{ label: string; value: number }>;
  inviteCode?: string | null;
}

const W = 1080;
const H = 1350;

const COLOR = {
  bg: "#f7f6f2",
  primary: "#004339",
  mint: "#cfe8dc",
  cream: "#fff8e6",
  lavender: "#cbbeff",
  ink: "#1b1c1a",
  muted: "#404946",
  grid: "#e3e2df",
  white: "#ffffff",
};

const SERIF = 'Georgia, "Source Serif 4", "Times New Roman", serif';
const SANS = '"Hanken Grotesk", "Helvetica Neue", Arial, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

const signed = (n: number) => `${n > 0 ? "+" : ""}${n}`;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function pill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fill: string,
  color: string,
  font: string,
  padX = 28,
  height = 64,
) {
  ctx.font = font;
  const w = ctx.measureText(text).width + padX * 2;
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, height, height / 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(text, x + padX, y + height / 2 + 2);
  return w;
}

export async function renderShareCard(data: ShareCardData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  const delta = data.scoreEnd - data.scoreStart;
  const margin = 80;

  // Background
  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, W, H);

  // Wordmark
  ctx.fillStyle = COLOR.primary;
  ctx.font = `italic 700 60px ${SERIF}`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillText("DailySkin 15", margin, margin + 52);

  ctx.fillStyle = COLOR.muted;
  ctx.font = `500 26px ${SANS}`;
  ctx.textAlign = "right";
  ctx.fillText(data.nickname, W - margin, margin + 48);
  ctx.textAlign = "left";

  // Eyebrow
  ctx.fillStyle = COLOR.muted;
  ctx.font = `600 28px ${SANS}`;
  ctx.fillText(`MY SKIN RESPONSE · DAY ${data.fromDay}→${data.toDay}`, margin, 260);

  // Score
  ctx.fillStyle = COLOR.primary;
  ctx.font = `700 300px ${SERIF}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(String(data.scoreEnd), margin - 8, 530);
  const scoreW = ctx.measureText(String(data.scoreEnd)).width;

  ctx.fillStyle = COLOR.muted;
  ctx.font = `500 34px ${SANS}`;
  ctx.fillText("Skin Score", margin + scoreW + 24, 430);
  pill(ctx, `${signed(delta)} vs Day 1`, margin + scoreW + 20, 455, COLOR.mint, COLOR.primary, `700 32px ${SANS}`);

  // Step sketch
  const cx = margin;
  const cy = 600;
  const cw = W - margin * 2;
  const ch = 230;
  ctx.strokeStyle = COLOR.grid;
  ctx.lineWidth = 2;
  for (let i = 0; i <= 2; i++) {
    const y = cy + (ch / 2) * i;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx + cw, y);
    ctx.stroke();
  }
  const lo = Math.min(data.scoreStart, data.scoreEnd) - 6;
  const hi = Math.max(data.scoreStart, data.scoreEnd) + 6;
  const yFor = (v: number) => cy + ch - ((v - lo) / Math.max(1, hi - lo)) * ch;
  const steps = 5;
  ctx.strokeStyle = COLOR.primary;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const v = data.scoreStart + (data.scoreEnd - data.scoreStart) * t;
    const x0 = cx + (cw / steps) * i + 10;
    const x1 = cx + (cw / steps) * (i + 1) - 10;
    const y = yFor(v);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    ctx.fillStyle = COLOR.lavender;
    ctx.beginPath();
    ctx.arc(x0, y, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = COLOR.muted;
  ctx.font = `500 24px ${SANS}`;
  ctx.fillText(`D${data.fromDay}`, cx, cy + ch + 44);
  ctx.textAlign = "right";
  ctx.fillText(`D${data.toDay}`, cx + cw, cy + ch + 44);
  ctx.textAlign = "left";

  // Delta chips
  const chips = data.deltas.slice(0, 4);
  const gap = 20;
  const chipW = (W - margin * 2 - gap * (chips.length - 1)) / Math.max(1, chips.length);
  const chipY = 920;
  chips.forEach((d, i) => {
    const x = margin + (chipW + gap) * i;
    ctx.fillStyle = d.value >= 0 ? COLOR.mint : COLOR.cream;
    roundRect(ctx, x, chipY, chipW, 130, 20);
    ctx.fill();
    ctx.fillStyle = COLOR.muted;
    ctx.font = `600 22px ${SANS}`;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(d.label, x + 24, chipY + 48);
    ctx.fillStyle = COLOR.primary;
    ctx.font = `700 44px ${SANS}`;
    ctx.fillText(signed(d.value), x + 24, chipY + 104);
  });

  // Experiment line
  if (data.experimentTitle) {
    ctx.fillStyle = COLOR.ink;
    ctx.font = `500 30px ${SANS}`;
    ctx.fillText(`이번 15일의 실험 · ${data.experimentTitle}`, margin, 1120);
  }

  // Bottom band
  const bandH = 140;
  ctx.fillStyle = COLOR.primary;
  ctx.fillRect(0, H - bandH, W, bandH);
  ctx.fillStyle = COLOR.white;
  ctx.font = `500 26px ${SANS}`;
  ctx.textBaseline = "middle";
  ctx.fillText("얼굴 사진은 포함되지 않아요 · 보이는 추정치", margin, H - bandH / 2);
  if (data.inviteCode) {
    ctx.textAlign = "right";
    ctx.font = `700 30px ${SANS}`;
    ctx.fillText(`초대코드 ${data.inviteCode}`, W - margin, H - bandH / 2);
    ctx.textAlign = "left";
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png");
  });
}

/** Hands the PNG to the OS share sheet when possible, otherwise downloads it. */
export async function shareOrDownload(
  blob: Blob,
  filename: string,
  text?: string,
): Promise<"shared" | "downloaded"> {
  const file = new File([blob], filename, { type: "image/png" });
  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return "shared";
    } catch {
      /* user dismissed the sheet — fall through to download */
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
