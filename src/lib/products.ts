import catalog from "../data/products.json" with { type: "json" };
import kbeauty from "../data/kbeauty.json" with { type: "json" };

/**
 * Product catalog.
 *
 * Two sources, one shape:
 *  - Open Beauty Facts snapshot (src/data/products.json, ODbL; images CC BY-SA)
 *    fetched by scripts/fetch-products.mjs — real products with a photo and a
 *    full INCI list.
 *  - Hand-curated K-beauty staples (src/data/kbeauty.json) — real product
 *    names and headline actives, rendered as monogram tiles (no photo).
 *
 * Nothing here is a purchase: the app links out to a search, never to a cart.
 */

export type ProductCategoryId =
  | "cleanser"
  | "toner"
  | "serum"
  | "moisturizer"
  | "sunscreen"
  | "exfoliant"
  | "mask";

export const CATEGORY_LABELS: Record<ProductCategoryId, string> = {
  cleanser: "클렌저",
  toner: "토너 · 패드",
  serum: "세럼 · 에센스",
  moisturizer: "크림 · 로션",
  sunscreen: "자외선 차단제",
  exfoliant: "각질 · 피지",
  mask: "마스크 · 팩",
};

export const CATEGORY_ICON: Record<ProductCategoryId, string> = {
  cleanser: "water_drop",
  toner: "opacity",
  serum: "science",
  moisturizer: "spa",
  sunscreen: "light_mode",
  exfoliant: "grain",
  mask: "masks",
};

/** Ingredient/active keys detected by the fetcher or set on curated items. */
export type ActiveKey =
  | "centella" | "madecassoside" | "panthenol" | "niacinamide" | "hyaluronic" | "ceramide"
  | "salicylic" | "aha" | "retinol" | "vitaminC" | "peptide" | "zinc" | "greenTea" | "aloe"
  | "squalane" | "thermalWater" | "fragrance" | "alcohol" | "mineralUv" | "chemicalUv"
  | "oilFree" | "snail" | "heartleaf" | "rice" | "fermented" | "tranexamic" | "propolis"
  | "birch" | "citrus" | "shea";

export const ACTIVE_LABELS: Record<ActiveKey, string> = {
  centella: "센텔라",
  madecassoside: "마데카소사이드",
  panthenol: "판테놀",
  niacinamide: "나이아신아마이드",
  hyaluronic: "히알루론산",
  ceramide: "세라마이드",
  salicylic: "BHA",
  aha: "AHA",
  retinol: "레티놀",
  vitaminC: "비타민C",
  peptide: "펩타이드",
  zinc: "아연",
  greenTea: "녹차",
  aloe: "알로에",
  squalane: "스쿠알란",
  thermalWater: "온천수",
  fragrance: "향료",
  alcohol: "알코올",
  mineralUv: "무기자차",
  chemicalUv: "유기자차",
  oilFree: "오일프리",
  snail: "달팽이 점액",
  heartleaf: "어성초",
  rice: "쌀 추출물",
  fermented: "발효",
  tranexamic: "트라넥사민산",
  propolis: "프로폴리스",
  birch: "자작나무 수액",
  citrus: "시트러스",
  shea: "시어버터",
};

export interface Product {
  id: string;
  brand: string;
  name: string;
  category: ProductCategoryId;
  quantity: string | null;
  spf: number | null;
  actives: ActiveKey[];
  /** Full INCI text when known (OBF items); null for curated K-beauty. */
  ingredients: string | null;
  /** Local path under /public, or null → render a monogram tile. */
  image: string | null;
  /** One-line Korean hook for curated items. */
  highlight: string | null;
  /** Attribution link (Open Beauty Facts product page) when applicable. */
  source: string | null;
  kbeauty: boolean;
}

interface ObfRow {
  id: string;
  code: string;
  brand: string;
  name: string;
  category: string;
  quantity: string | null;
  spf: number | null;
  actives: string[];
  ingredients: string;
  image: string;
  source: string;
}

interface CuratedRow {
  id: string;
  brand: string;
  name: string;
  category: string;
  quantity?: string;
  spf?: number;
  actives: string[];
  highlight: string;
  kbeauty: boolean;
}

const CATEGORY_IDS = new Set<string>(Object.keys(CATEGORY_LABELS));

function isCategory(value: string): value is ProductCategoryId {
  return CATEGORY_IDS.has(value);
}

function fromObf(row: ObfRow): Product | null {
  if (!isCategory(row.category)) return null;
  return {
    id: row.id,
    brand: row.brand,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    spf: row.spf,
    actives: row.actives as ActiveKey[],
    ingredients: row.ingredients,
    image: row.image,
    highlight: null,
    source: row.source,
    kbeauty: /cosrx|laneige|sulwhasoo|klairs|benton|missha|innisfree/i.test(row.brand),
  };
}

function fromCurated(row: CuratedRow): Product | null {
  if (!isCategory(row.category)) return null;
  return {
    id: row.id,
    brand: row.brand,
    name: row.name,
    category: row.category,
    quantity: row.quantity ?? null,
    spf: row.spf ?? null,
    actives: row.actives as ActiveKey[],
    ingredients: null,
    image: null,
    highlight: row.highlight,
    source: null,
    kbeauty: true,
  };
}

/** Curated K-beauty first (they have Korean hooks), then the photographed OBF items. */
export const PRODUCTS: Product[] = [
  ...(kbeauty.products as CuratedRow[]).map(fromCurated),
  ...(catalog.products as ObfRow[]).map(fromObf),
].filter((p): p is Product => p !== null);

export const CATALOG_ATTRIBUTION = {
  source: catalog.source as string,
  license: catalog.license as string,
  url: catalog.attribution as string,
  fetchedAt: catalog.fetchedAt as string,
};

export function findProduct(id: string): Product | null {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

/** Search URL for a product — a neutral query, not an affiliate link. */
export function productSearchUrl(p: Product) {
  return `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(`${p.brand} ${p.name}`)}`;
}

/** Two-letter monogram for photo-less tiles. */
export function monogram(brand: string) {
  const letters = brand.replace(/[^A-Za-z0-9가-힣]/g, "");
  return letters.slice(0, 2).toUpperCase();
}
