import { ACTIVE_LABELS, PRODUCTS, type ActiveKey, type Product, type ProductCategoryId } from "./products.ts";
import { SUB_SCORE_LABELS } from "./scoring.ts";
import type { DayRecord, Survey } from "./types.ts";

/**
 * Skin-state → product matching (deck: "AI 피부 분석 → 나를 위한 맞춤 제품 추천").
 *
 * Scores every catalog product against the latest capture's four indices and
 * the survey, then explains each pick in one line of plain Korean. It is a
 * rule-based ranker, not a claim: it says which *ingredients* line up with
 * which *index*, never that a product will fix anything.
 */

export interface SkinNeed {
  id: "calm" | "pigment" | "lines" | "hydration" | "uv" | "barrier" | "oil";
  label: string;
  /** Why this need is on — shown as the section caption. */
  reason: string;
  /** Actives that serve this need, in priority order. */
  wants: ActiveKey[];
  weight: number;
}

const NEED_DEFS: Record<SkinNeed["id"], Omit<SkinNeed, "id" | "reason" | "weight">> = {
  calm: { label: "진정", wants: ["centella", "madecassoside", "heartleaf", "panthenol", "zinc", "snail", "aloe", "thermalWater"] },
  pigment: { label: "잡티 · 톤", wants: ["niacinamide", "vitaminC", "tranexamic", "propolis", "rice", "fermented"] },
  lines: { label: "라인 · 탄력", wants: ["peptide", "retinol", "hyaluronic", "squalane"] },
  hydration: { label: "수분", wants: ["hyaluronic", "panthenol", "ceramide", "squalane", "birch", "snail"] },
  uv: { label: "자외선", wants: ["chemicalUv", "mineralUv"] },
  barrier: { label: "장벽", wants: ["ceramide", "panthenol", "squalane", "shea", "madecassoside"] },
  oil: { label: "피지 · 모공", wants: ["salicylic", "aha", "niacinamide", "zinc", "oilFree"] },
};

/** Reads the four indices + survey into a ranked list of needs. */
export function deriveNeeds(survey: Survey | null, record: DayRecord | null): SkinNeed[] {
  const needs: SkinNeed[] = [];
  const s = record?.subScores;
  const push = (id: SkinNeed["id"], reason: string, weight: number) =>
    needs.push({ id, ...NEED_DEFS[id], reason, weight });

  if (s) {
    if (s.trouble < 70) push("calm", `${SUB_SCORE_LABELS.trouble} 지표 ${s.trouble}`, 100 - s.trouble);
    if (s.spot < 70) push("pigment", `${SUB_SCORE_LABELS.spot} 지표 ${s.spot}`, 100 - s.spot);
    const lines = Math.min(s.nasolabial, s.forehead);
    if (lines < 70) push("lines", `${lines === s.forehead ? SUB_SCORE_LABELS.forehead : SUB_SCORE_LABELS.nasolabial} 지표 ${lines}`, 100 - lines);
  }
  if (survey?.concerns.includes("redness") || survey?.condition === "sensitive") {
    if (!needs.some((n) => n.id === "calm")) push("calm", "설문: 붉은기 · 예민함", 30);
  }
  if (survey?.skinType === "dry" || survey?.concerns.includes("texture")) push("hydration", "설문: 건성 · 피부결", 28);
  if (survey?.skinType === "oily" || survey?.concerns.includes("trouble")) push("oil", "설문: 지성 · 트러블", 26);
  if (survey?.outdoor === "heavy" || record?.sunExposure || (s && s.spot < 70)) push("uv", "야외활동 · 잡티 관리", 40);
  if (survey?.skinType === "dry" || survey?.condition === "sensitive") push("barrier", "설문: 건성 · 예민함", 24);
  if (!needs.length) push("hydration", "지표가 안정적이에요 — 기본 수분 유지", 20);

  return needs.sort((a, b) => b.weight - a.weight);
}

export interface ProductMatch {
  product: Product;
  score: number;
  /** Which needs this product serves (highest first). */
  needs: SkinNeed["id"][];
  /** Actives that made the match, for chips. */
  hits: ActiveKey[];
  /** Plain-language reason, one line. */
  reason: string;
  /** Soft cautions (fragrance/alcohol on sensitive skin, strong acids). */
  cautions: string[];
}

const CATEGORY_FOR_NEED: Record<SkinNeed["id"], ProductCategoryId[]> = {
  calm: ["toner", "serum", "moisturizer"],
  pigment: ["serum", "sunscreen"],
  lines: ["serum", "moisturizer"],
  hydration: ["toner", "serum", "moisturizer", "mask"],
  uv: ["sunscreen"],
  barrier: ["moisturizer"],
  oil: ["cleanser", "exfoliant", "toner"],
};

export interface MatchOptions {
  limit?: number;
  /** Restrict to one category (e.g. the Shop filter). */
  category?: ProductCategoryId;
  /** At most one product per category, for a "routine" style pick. */
  diversify?: boolean;
}

export function recommendProducts(
  survey: Survey | null,
  record: DayRecord | null,
  options: MatchOptions = {},
  pool: Product[] = PRODUCTS,
): ProductMatch[] {
  const needs = deriveNeeds(survey, record);
  const sensitive = survey?.condition === "sensitive" || survey?.concerns.includes("redness");
  const young = (survey?.age ?? 28) < 18;

  const scored: ProductMatch[] = [];
  for (const product of pool) {
    if (options.category && product.category !== options.category) continue;
    let score = 0;
    const hits = new Set<ActiveKey>();
    const served: SkinNeed["id"][] = [];
    for (const need of needs) {
      const categoryFit = CATEGORY_FOR_NEED[need.id].includes(product.category) ? 1 : 0.35;
      let needScore = 0;
      need.wants.forEach((active, i) => {
        if (product.actives.includes(active)) {
          needScore += (need.wants.length - i) / need.wants.length;
          hits.add(active);
        }
      });
      if (needScore > 0) {
        score += needScore * need.weight * categoryFit;
        served.push(need.id);
      }
    }
    if (product.spf && needs.some((n) => n.id === "uv")) score += 15;

    const cautions: string[] = [];
    if (sensitive && product.actives.includes("fragrance")) {
      score *= 0.7;
      cautions.push("향료 포함 — 예민한 날은 피해요");
    }
    if (sensitive && product.actives.includes("alcohol")) {
      score *= 0.85;
      cautions.push("알코올 포함");
    }
    if (young && product.actives.includes("retinol")) {
      score *= 0.4;
      cautions.push("레티놀 — 10대는 보호자와 상의");
    }
    if (product.actives.includes("aha") && product.actives.includes("salicylic") && sensitive) {
      score *= 0.8;
      cautions.push("각질 제거 성분 — 주 2회 이하");
    }
    if (product.kbeauty) score *= 1.08; // slight home-market preference

    if (score <= 0) continue;
    const topNeed = needs.find((n) => served.includes(n.id));
    const hitLabels = [...hits].filter((h) => h !== "oilFree").slice(0, 2).map((h) => ACTIVE_LABELS[h]);
    const reason = topNeed
      ? `${topNeed.reason} → ${hitLabels.join(" · ") || ACTIVE_LABELS[[...hits][0]]} 성분이 ${topNeed.label}에 맞아요`
      : "기본 루틴 유지에 무난해요";
    scored.push({ product, score: Math.round(score), needs: served, hits: [...hits], reason, cautions });
  }

  scored.sort((a, b) => b.score - a.score);

  if (options.diversify) {
    const seen = new Set<ProductCategoryId>();
    const out: ProductMatch[] = [];
    for (const m of scored) {
      if (seen.has(m.product.category)) continue;
      seen.add(m.product.category);
      out.push(m);
      if (out.length >= (options.limit ?? 4)) break;
    }
    return out;
  }
  return scored.slice(0, options.limit ?? 6);
}

/** Headline for the recommendation section, from the top need. */
export function focusHeadline(needs: SkinNeed[]): { title: string; caption: string } {
  const top = needs[0]?.id;
  switch (top) {
    case "calm":
      return { title: "Calm & Protect", caption: "트러블 지표가 낮은 날은 진정 성분부터 골라요." };
    case "pigment":
      return { title: "Even & Bright", caption: "잡티 지표엔 나이아신아마이드와 자외선 차단이 짝이에요." };
    case "lines":
      return { title: "Plump & Smooth", caption: "라인 지표엔 수분과 펩타이드를 먼저 봐요." };
    case "uv":
      return { title: "Shield First", caption: "야외활동이 많은 날은 자외선 차단이 우선이에요." };
    case "oil":
      return { title: "Clear & Balance", caption: "피지·모공엔 BHA와 오일프리 제형이 맞아요." };
    case "barrier":
      return { title: "Repair & Hold", caption: "장벽이 약한 날은 세라마이드로 덮어요." };
    default:
      return { title: "Keep & Hydrate", caption: "지표가 안정적이에요. 수분만 채우고 새 변수는 넣지 않아요." };
  }
}
