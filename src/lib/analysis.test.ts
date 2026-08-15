import assert from "node:assert/strict";
import test from "node:test";
import { analyzeImageData, checkCaptureQuality } from "./analysis.ts";
import { computeDailySkinScore, computeSkinAgeIndex, computeSubScores } from "./scoring.ts";

/**
 * The analysis pipeline runs on raw pixels, so it can be exercised directly
 * with synthetic frames — no camera, no browser, no image decoder.
 */

const W = 300;
const H = 400;

interface Blob {
  x: number;
  y: number;
  r: number;
  color: [number, number, number];
}

/** Builds a face-sized frame: flat skin tone, optional texture and blobs. */
function makeFrame(options: {
  base?: [number, number, number];
  noise?: number;
  blobs?: Blob[];
  /** Horizontal creases across the forehead ROI. */
  foreheadLines?: number;
  blur?: boolean;
}): ImageData {
  const { base = [220, 180, 165], noise = 2, blobs = [], foreheadLines = 0, blur = false } = options;
  const data = new Uint8ClampedArray(W * H * 4);

  // Deterministic pseudo-noise so the test never flakes.
  let seed = 12345;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const n = (rand() - 0.5) * 2 * noise;
      data[i] = base[0] + n;
      data[i + 1] = base[1] + n;
      data[i + 2] = base[2] + n;
      data[i + 3] = 255;
    }
  }

  // Forehead ROI is [0.3, 0.14, 0.4, 0.14] of the frame.
  if (foreheadLines > 0) {
    const y0 = Math.floor(0.14 * H);
    const y1 = Math.floor(0.28 * H);
    const spacing = Math.floor((y1 - y0) / (foreheadLines + 1));
    for (let k = 1; k <= foreheadLines; k++) {
      const ly = y0 + k * spacing;
      for (let x = Math.floor(0.3 * W); x < Math.floor(0.7 * W); x++) {
        for (const dy of [0, 1]) {
          const i = ((ly + dy) * W + x) * 4;
          data[i] = base[0] - 45;
          data[i + 1] = base[1] - 45;
          data[i + 2] = base[2] - 45;
        }
      }
    }
  }

  for (const blob of blobs) {
    for (let y = blob.y - blob.r; y <= blob.y + blob.r; y++) {
      for (let x = blob.x - blob.r; x <= blob.x + blob.r; x++) {
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const dx = x - blob.x;
        const dy = y - blob.y;
        if (dx * dx + dy * dy > blob.r * blob.r) continue;
        const i = (y * W + x) * 4;
        data[i] = blob.color[0];
        data[i + 1] = blob.color[1];
        data[i + 2] = blob.color[2];
      }
    }
  }

  if (blur) {
    // Cheap 3x3 box blur — enough to tank the Laplacian variance.
    const copy = new Uint8ClampedArray(data);
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              sum += copy[((y + dy) * W + (x + dx)) * 4 + c];
            }
          }
          data[(y * W + x) * 4 + c] = sum / 9;
        }
      }
    }
  }

  return { data, width: W, height: H, colorSpace: "srgb" } as ImageData;
}

/** Red blemishes scattered over the cheek and forehead ROIs. */
function troubleBlobs(count: number): Blob[] {
  const spots: Blob[] = [];
  for (let i = 0; i < count; i++) {
    const onLeft = i % 2 === 0;
    spots.push({
      x: Math.floor((onLeft ? 0.22 : 0.62) * W) + ((i * 13) % 50),
      y: Math.floor(0.44 * H) + ((i * 29) % 70),
      r: 4,
      color: [245, 120, 110],
    });
  }
  return spots;
}

test("clean skin scores higher on trouble than blemished skin", () => {
  const clean = analyzeImageData(makeFrame({}));
  const blemished = analyzeImageData(makeFrame({ blobs: troubleBlobs(14) }));

  assert.ok(
    blemished.troubleAreaRatio > clean.troubleAreaRatio,
    `expected more flagged area with blemishes (${blemished.troubleAreaRatio} vs ${clean.troubleAreaRatio})`,
  );
  assert.ok(blemished.troubleCount > clean.troubleCount);

  const cleanScore = computeSubScores(clean).trouble;
  const blemishedScore = computeSubScores(blemished).trouble;
  assert.ok(
    cleanScore > blemishedScore,
    `clean trouble score ${cleanScore} should beat blemished ${blemishedScore}`,
  );
});

test("dark pigment patches raise spot density on the cheeks", () => {
  const clean = analyzeImageData(makeFrame({}));
  const spotted = analyzeImageData(
    makeFrame({
      blobs: Array.from({ length: 16 }, (_, i) => ({
        x: Math.floor(0.22 * W) + ((i * 7) % 50),
        y: Math.floor(0.44 * H) + ((i * 11) % 70),
        r: 3,
        color: [170, 130, 115] as [number, number, number],
      })),
    }),
  );

  assert.ok(
    spotted.spotDensity > clean.spotDensity,
    `expected higher spot density (${spotted.spotDensity} vs ${clean.spotDensity})`,
  );
  // All patches were on the left cheek, so the distribution must lean left.
  assert.ok(spotted.spotBalance.left > spotted.spotBalance.right);
});

test("forehead creases lower the forehead line score", () => {
  const smooth = analyzeImageData(makeFrame({}));
  const creased = analyzeImageData(makeFrame({ foreheadLines: 4 }));

  assert.ok(
    creased.foreheadLineProminence > smooth.foreheadLineProminence,
    `expected creases to register (${creased.foreheadLineProminence} vs ${smooth.foreheadLineProminence})`,
  );
  assert.ok(computeSubScores(creased).forehead < computeSubScores(smooth).forehead);
});

test("blur is detected and drags capture consistency down", () => {
  const sharp = analyzeImageData(makeFrame({ noise: 12, foreheadLines: 3 }));
  const blurred = analyzeImageData(makeFrame({ noise: 12, foreheadLines: 3, blur: true }));

  assert.ok(
    blurred.sharpness < sharp.sharpness,
    `blurred sharpness ${blurred.sharpness} should be below sharp ${sharp.sharpness}`,
  );
  assert.ok(
    computeSubScores(blurred).captureConsistency <
      computeSubScores(sharp).captureConsistency,
  );
});

test("capture quality gate rejects dark, blown-out and blurry frames", () => {
  const dark = checkCaptureQuality(makeFrame({ base: [30, 24, 22], noise: 10 }));
  assert.equal(dark.ok, false);
  assert.match(dark.message, /밝은/);

  const blownOut = checkCaptureQuality(makeFrame({ base: [250, 248, 245], noise: 10 }));
  assert.equal(blownOut.ok, false);

  const blurry = checkCaptureQuality(makeFrame({ noise: 30, blur: true }));
  assert.equal(blurry.ok, false);
});

test("daily score honours the spec weights", () => {
  // Trouble 30 + Spot 25 + Nasolabial 20 + Forehead 15 + Capture 10
  const score = computeDailySkinScore({
    trouble: 100,
    spot: 0,
    nasolabial: 0,
    forehead: 0,
    captureConsistency: 0,
  });
  assert.equal(score, 30);

  const all = computeDailySkinScore({
    trouble: 80,
    spot: 80,
    nasolabial: 80,
    forehead: 80,
    captureConsistency: 80,
  });
  assert.equal(all, 80);
});

test("skin age index sits on the stated age at a score of 75", () => {
  const survey = { concerns: [], skinType: "unknown", condition: "normal", outdoor: "none", products: [], age: 30 } as const;
  assert.equal(computeSkinAgeIndex(75, { ...survey, concerns: [], products: [] }), 30);
  // Worse score reads older, better score reads younger.
  assert.ok(computeSkinAgeIndex(45, { ...survey, concerns: [], products: [] }) > 30);
  assert.ok(computeSkinAgeIndex(95, { ...survey, concerns: [], products: [] }) < 30);
});
