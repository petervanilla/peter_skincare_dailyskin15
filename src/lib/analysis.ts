import type { PoseId, RawMetrics } from "./types.ts";

/**
 * MVP image pipeline (spec §17).
 *
 * There is no landmark model in the web MVP, so ROIs are taken from the fixed
 * oval guide the capture screen forces the user into: because the face is
 * aligned to the same on-screen guide every day, the same rectangle lands on
 * roughly the same part of the face across days. That is enough for the thing
 * that actually matters here — day-to-day *change* on a consistently framed
 * photo — and it is why capture consistency is scored and surfaced.
 *
 * Everything below is a "visible estimate", never a diagnosis.
 */

/** ROIs as fractions of the capture frame: [x, y, w, h]. */
type Rect = [number, number, number, number];

const ROI: Record<string, Rect> = {
  forehead: [0.3, 0.14, 0.4, 0.14],
  leftCheek: [0.2, 0.42, 0.2, 0.2],
  rightCheek: [0.6, 0.42, 0.2, 0.2],
  nose: [0.44, 0.4, 0.12, 0.18],
  chin: [0.4, 0.68, 0.2, 0.12],
  nasolabialLeft: [0.33, 0.55, 0.11, 0.16],
  nasolabialRight: [0.56, 0.55, 0.11, 0.16],
};

interface Pixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

function rectToPx(rect: Rect, w: number, h: number) {
  return {
    x0: Math.max(0, Math.floor(rect[0] * w)),
    y0: Math.max(0, Math.floor(rect[1] * h)),
    x1: Math.min(w, Math.ceil((rect[0] + rect[2]) * w)),
    y1: Math.min(h, Math.ceil((rect[1] + rect[3]) * h)),
  };
}

function luminance(d: Uint8ClampedArray, i: number) {
  return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
}

/**
 * Per-pixel redness: how far red runs ahead of the other channels, scaled by
 * overall brightness so a dim photo does not read as calmer skin.
 */
function redness(d: Uint8ClampedArray, i: number) {
  const r = d[i];
  const g = d[i + 1];
  const b = d[i + 2];
  const base = (g + b) / 2;
  const lum = Math.max(1, 0.299 * r + 0.587 * g + 0.114 * b);
  return ((r - base) / lum) * 100;
}

function collectRegion(px: Pixels, rects: Rect[]) {
  const values: number[] = [];
  const lums: number[] = [];
  for (const rect of rects) {
    const { x0, y0, x1, y1 } = rectToPx(rect, px.width, px.height);
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * px.width + x) * 4;
        values.push(redness(px.data, i));
        lums.push(luminance(px.data, i));
      }
    }
  }
  return { values, lums };
}

function mean(arr: number[]) {
  if (!arr.length) return 0;
  let s = 0;
  for (const v of arr) s += v;
  return s / arr.length;
}

function stdDev(arr: number[], m = mean(arr)) {
  if (arr.length < 2) return 0;
  let s = 0;
  for (const v of arr) s += (v - m) * (v - m);
  return Math.sqrt(s / (arr.length - 1));
}

/**
 * Trouble = pixels whose redness sits well above the region's own baseline.
 * Using the region's own mean/σ makes this robust to skin tone: we measure
 * localised flare-ups, not how red someone's face is overall.
 */
function measureTrouble(px: Pixels) {
  const { values } = collectRegion(px, [
    ROI.forehead,
    ROI.leftCheek,
    ROI.rightCheek,
    ROI.chin,
    ROI.nose,
  ]);
  if (!values.length) return { troubleAreaRatio: 0, troubleCount: 0 };
  const m = mean(values);
  const sd = stdDev(values, m);
  const threshold = m + 1.8 * sd;
  let flagged = 0;
  for (const v of values) if (v > threshold) flagged++;
  const troubleAreaRatio = flagged / values.length;
  // A visible blemish covers roughly 0.04% of the analysed area at our
  // capture scale; dividing by that turns area into a countable estimate.
  const troubleCount = Math.round(troubleAreaRatio / 0.0004);
  return { troubleAreaRatio, troubleCount };
}

/**
 * Spots = small patches meaningfully darker than the surrounding skin.
 * Compared against a blurred copy of the same region so that shading across
 * the face (which changes with lighting) does not register as pigmentation.
 */
function measureSpots(px: Pixels) {
  const cheeks: Array<{ side: "left" | "right"; rect: Rect }> = [
    { side: "left", rect: ROI.leftCheek },
    { side: "right", rect: ROI.rightCheek },
  ];
  let totalPixels = 0;
  let totalFlagged = 0;
  const perSide = { left: 0, right: 0 };

  for (const { side, rect } of cheeks) {
    const { x0, y0, x1, y1 } = rectToPx(rect, px.width, px.height);
    const w = x1 - x0;
    const h = y1 - y0;
    if (w < 8 || h < 8) continue;

    const lum: number[] = new Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        lum[y * w + x] = luminance(px.data, ((y + y0) * px.width + (x + x0)) * 4);
      }
    }

    // Box blur (radius 4) approximates the local skin-tone baseline.
    const r = 4;
    let flagged = 0;
    for (let y = r; y < h - r; y++) {
      for (let x = r; x < w - r; x++) {
        let sum = 0;
        let n = 0;
        for (let dy = -r; dy <= r; dy += 2) {
          for (let dx = -r; dx <= r; dx += 2) {
            sum += lum[(y + dy) * w + (x + dx)];
            n++;
          }
        }
        const local = sum / n;
        // 7 luminance levels below local average reads as a visible spot.
        if (local - lum[y * w + x] > 7) flagged++;
      }
    }
    const counted = (h - 2 * r) * (w - 2 * r);
    totalPixels += counted;
    totalFlagged += flagged;
    perSide[side] = counted > 0 ? flagged / counted : 0;
  }

  const spotDensity = totalPixels > 0 ? totalFlagged / totalPixels : 0;
  const spotCount = Math.round(spotDensity / 0.0006);
  const sideTotal = perSide.left + perSide.right;
  return {
    spotDensity,
    spotCount,
    spotBalance:
      sideTotal > 0
        ? { left: perSide.left / sideTotal, right: perSide.right / sideTotal }
        : { left: 0.5, right: 0.5 },
  };
}

/**
 * Line prominence via directional gradient energy.
 * `axis: "horizontal"` responds to horizontal creases (forehead lines);
 * `"diagonal"` responds to the nose-to-mouth fold.
 */
function measureLines(px: Pixels, rect: Rect, axis: "horizontal" | "diagonal") {
  const { x0, y0, x1, y1 } = rectToPx(rect, px.width, px.height);
  const w = x1 - x0;
  const h = y1 - y0;
  if (w < 4 || h < 4) return { prominence: 0, lineCount: 0 };

  const responses: number[] = [];
  for (let y = y0 + 1; y < y1 - 1; y++) {
    for (let x = x0 + 1; x < x1 - 1; x++) {
      const i = (y * px.width + x) * 4;
      const up = luminance(px.data, ((y - 1) * px.width + x) * 4);
      const down = luminance(px.data, ((y + 1) * px.width + x) * 4);
      const left = luminance(px.data, (y * px.width + (x - 1)) * 4);
      const right = luminance(px.data, (y * px.width + (x + 1)) * 4);
      const gy = Math.abs(down - up);
      const gx = Math.abs(right - left);
      void i;
      responses.push(axis === "horizontal" ? gy : (gx + gy) / 2);
    }
  }

  const m = mean(responses);
  const sd = stdDev(responses, m);
  // Only ridges standing clearly above local texture count as a line.
  const threshold = m + 1.5 * sd;
  let ridge = 0;
  for (const v of responses) if (v > threshold) ridge++;
  const prominence = responses.length ? ridge / responses.length : 0;
  return { prominence, lineCount: Math.round(prominence / 0.012) };
}

/** Variance of the Laplacian — the standard cheap blur detector. */
function measureSharpness(px: Pixels) {
  const step = 2;
  const vals: number[] = [];
  for (let y = 1; y < px.height - 1; y += step) {
    for (let x = 1; x < px.width - 1; x += step) {
      const c = luminance(px.data, (y * px.width + x) * 4);
      const up = luminance(px.data, ((y - 1) * px.width + x) * 4);
      const down = luminance(px.data, ((y + 1) * px.width + x) * 4);
      const left = luminance(px.data, (y * px.width + (x - 1)) * 4);
      const right = luminance(px.data, (y * px.width + (x + 1)) * 4);
      vals.push(Math.abs(4 * c - up - down - left - right));
    }
  }
  const m = mean(vals);
  return stdDev(vals, m) ** 2;
}

function measureExposure(px: Pixels) {
  const vals: number[] = [];
  for (let i = 0; i < px.data.length; i += 4 * 16) vals.push(luminance(px.data, i));
  return mean(vals);
}

/** Runs the full pipeline over one captured frame. */
export function analyzeImageData(imageData: ImageData): RawMetrics {
  const px: Pixels = {
    data: imageData.data,
    width: imageData.width,
    height: imageData.height,
  };

  const trouble = measureTrouble(px);
  const spots = measureSpots(px);
  const forehead = measureLines(px, ROI.forehead, "horizontal");
  const nasoLeft = measureLines(px, ROI.nasolabialLeft, "diagonal");
  const nasoRight = measureLines(px, ROI.nasolabialRight, "diagonal");

  const nasolabialProminence = (nasoLeft.prominence + nasoRight.prominence) / 2;
  const asymmetry = Math.abs(nasoLeft.prominence - nasoRight.prominence);
  const nasolabialSymmetry =
    nasolabialProminence > 0
      ? Math.max(0, 1 - asymmetry / nasolabialProminence)
      : 1;

  return {
    ...trouble,
    ...spots,
    nasolabialProminence,
    nasolabialSymmetry,
    foreheadLineProminence: forehead.prominence,
    foreheadLineCount: forehead.lineCount,
    sharpness: measureSharpness(px),
    exposure: measureExposure(px),
  };
}

/**
 * Averages the per-pose metrics into one daily reading, weighting each pose
 * toward what it was captured for (spec §5-1).
 */
export function combinePoseMetrics(
  perPose: Partial<Record<PoseId, RawMetrics>>,
): RawMetrics | null {
  const entries = Object.entries(perPose) as Array<[PoseId, RawMetrics]>;
  if (!entries.length) return null;

  const weightFor = (pose: PoseId, field: keyof RawMetrics): number => {
    if (field === "foreheadLineProminence" || field === "foreheadLineCount") {
      return pose === "chinDown" ? 2 : pose === "front" ? 1 : 0.25;
    }
    if (field === "nasolabialProminence" || field === "nasolabialSymmetry") {
      return pose === "chinUp" ? 2 : pose === "front" ? 1 : 0.5;
    }
    if (field === "spotDensity" || field === "spotCount") {
      return pose === "left30" || pose === "right30" ? 1.5 : 1;
    }
    return pose === "front" ? 1.5 : 1;
  };

  const numericFields: Array<keyof RawMetrics> = [
    "troubleAreaRatio",
    "troubleCount",
    "spotDensity",
    "spotCount",
    "nasolabialProminence",
    "nasolabialSymmetry",
    "foreheadLineProminence",
    "foreheadLineCount",
    "sharpness",
    "exposure",
  ];

  const out = {} as RawMetrics;
  for (const field of numericFields) {
    let acc = 0;
    let wsum = 0;
    for (const [pose, metrics] of entries) {
      const w = weightFor(pose, field);
      acc += (metrics[field] as number) * w;
      wsum += w;
    }
    (out[field] as number) = wsum > 0 ? acc / wsum : 0;
  }

  const left = mean(entries.map(([, m]) => m.spotBalance.left));
  const right = mean(entries.map(([, m]) => m.spotBalance.right));
  out.spotBalance = { left, right };
  out.troubleCount = Math.round(out.troubleCount);
  out.spotCount = Math.round(out.spotCount);
  out.foreheadLineCount = Math.round(out.foreheadLineCount);
  return out;
}

/**
 * Live capture-quality gate (spec §5-1 "자동 촬영 조건").
 * Face centring/rotation would need a landmark model; what a plain canvas can
 * honestly check is framing brightness, blur and subject presence, so those
 * are the conditions actually enforced — and the ones reported to the user.
 */
export interface QualityCheck {
  ok: boolean;
  message: string;
  /** 0–1, drives the progress ring on the scan screen. */
  progress: number;
}

export function checkCaptureQuality(imageData: ImageData): QualityCheck {
  const px: Pixels = {
    data: imageData.data,
    width: imageData.width,
    height: imageData.height,
  };
  const exposure = measureExposure(px);
  const sharpness = measureSharpness(px);

  // Centre box: is there a subject filling the guide oval at all?
  const { x0, y0, x1, y1 } = rectToPx([0.25, 0.2, 0.5, 0.6], px.width, px.height);
  const centreLums: number[] = [];
  for (let y = y0; y < y1; y += 3) {
    for (let x = x0; x < x1; x += 3) {
      centreLums.push(luminance(px.data, (y * px.width + x) * 4));
    }
  }
  const centreVariation = stdDev(centreLums);

  const checks: Array<[boolean, string]> = [
    [exposure >= 55, "조금 더 밝은 곳에서 촬영해주세요"],
    [exposure <= 215, "빛이 너무 강해요. 정면 조명을 살짝 피해주세요"],
    [sharpness >= 45, "흔들렸어요. 잠시만 그대로 있어주세요"],
    [centreVariation >= 12, "얼굴을 가이드 안에 맞춰주세요"],
  ];

  const passed = checks.filter(([ok]) => ok).length;
  const failed = checks.find(([ok]) => !ok);
  return {
    ok: !failed,
    message: failed ? failed[1] : "좋아요. 그대로 1초만!",
    progress: passed / checks.length,
  };
}
