import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { buildDemoRecords, DEMO_SURVEY } from "./demo.ts";
import { deriveNeeds, focusHeadline, recommendProducts } from "./matching.ts";
import { PRODUCTS } from "./products.ts";

const FIXED_TODAY = new Date("2026-09-20T12:00:00Z");

test("default catalog contains Korean products with local, labelled mockups", () => {
  const curated = PRODUCTS.filter((p) => p.id.startsWith("kb-"));
  assert.ok(curated.length >= 30);
  for (const p of curated) {
    assert.ok(p.kbeauty && p.mockup && p.image);
    const assetPath = p.image!.replace(process.env.NEXT_PUBLIC_BASE_PATH ?? "", "");
    assert.ok(existsSync(new URL(`../../public${assetPath}`, import.meta.url)), p.image!);
  }
  if (process.env.NEXT_PUBLIC_CATALOG_GLOBAL !== "1") {
    assert.equal(curated.length, PRODUCTS.length);
  } else {
    assert.ok(PRODUCTS.some((p) => p.source && p.ingredients && !p.mockup));
  }
  assert.equal(new Set(PRODUCTS.map((p) => p.id)).size, PRODUCTS.length);
});

test("needs follow the weakest index first", () => {
  const day1 = buildDemoRecords(1, FIXED_TODAY)[0]; // trouble is the lowest index
  const needs = deriveNeeds(DEMO_SURVEY, day1);
  assert.equal(needs[0].id, "calm");
  assert.match(needs[0].reason, /트러블/);
});

test("recommendations serve the top need and explain themselves", () => {
  const day1 = buildDemoRecords(1, FIXED_TODAY)[0];
  const picks = recommendProducts(DEMO_SURVEY, day1, { limit: 5 });
  assert.equal(picks.length, 5);
  assert.ok(picks[0].needs.includes("calm"));
  for (const m of picks) {
    assert.ok(m.reason.length > 8);
    assert.doesNotMatch(m.reason, /진단|치료|처방/);
  }
});

test("diversify yields one product per category", () => {
  const day1 = buildDemoRecords(1, FIXED_TODAY)[0];
  const picks = recommendProducts(DEMO_SURVEY, day1, { diversify: true, limit: 4 });
  const cats = picks.map((m) => m.product.category);
  assert.equal(new Set(cats).size, cats.length);
});

test("sensitive skin demotes fragranced products and flags them", () => {
  const day1 = buildDemoRecords(1, FIXED_TODAY)[0];
  const sensitive = { ...DEMO_SURVEY, condition: "sensitive" as const };
  const picks = recommendProducts(sensitive, day1, { limit: 8 });
  const fragranced = picks.filter((m) => m.product.actives.includes("fragrance"));
  for (const m of fragranced) assert.ok(m.cautions.some((c) => c.includes("향료")));
});

test("minors never get retinol at the top", () => {
  const day1 = buildDemoRecords(1, FIXED_TODAY)[0];
  const picks = recommendProducts({ ...DEMO_SURVEY, age: 15 }, day1, { limit: 3 });
  assert.ok(!picks.some((m) => m.product.actives.includes("retinol")));
});

test("stable skin falls back to hydration", () => {
  const needs = deriveNeeds(null, null);
  assert.equal(needs[0].id, "hydration");
  assert.equal(focusHeadline(needs).title, "Keep & Hydrate");
});
