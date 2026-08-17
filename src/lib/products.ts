import { IMG } from "./assets";

/**
 * Shop's browsable catalog. Same category ids `recommendProductCategories`
 * (recommendations.ts) already scores against, so the personalized section
 * and the full catalog stay in sync — categories only, no brand names, per
 * spec §12.
 */
export type ProductCategoryId =
  | "mild-cleanser"
  | "soothing-moisturizer"
  | "sunscreen"
  | "hydrating-serum"
  | "barrier-cream"
  | "light-gel";

export const CATEGORY_LABELS: Record<ProductCategoryId, string> = {
  "mild-cleanser": "저자극 클렌저",
  "soothing-moisturizer": "진정 보습제",
  sunscreen: "자외선 차단제",
  "hydrating-serum": "수분 세럼",
  "barrier-cream": "장벽 강화 크림",
  "light-gel": "가벼운 젤 보습제",
};

/**
 * Product shots from the Stitch comp, keyed by category. Loosely typed
 * (string keys) so it can also be indexed by the rule engine's
 * `ProductCategory.id`, which includes the "keep-current" fallback.
 */
export const CATEGORY_IMAGE: Record<string, string> = {
  "mild-cleanser": IMG.productCleanser,
  "soothing-moisturizer": IMG.productCream,
  sunscreen: IMG.productSunscreen,
  "hydrating-serum": IMG.productCleanser,
  "barrier-cream": IMG.productCream,
  "light-gel": IMG.productLayers,
  "keep-current": IMG.heroDashboardAlt,
};

/** A small glyph per category — cosmetic only, no data behind it. */
export const CATEGORY_ICON: Record<string, string> = {
  "mild-cleanser": "water_drop",
  "soothing-moisturizer": "spa",
  sunscreen: "light_mode",
  "hydrating-serum": "opacity",
  "barrier-cream": "shield",
  "light-gel": "air",
  "keep-current": "check_circle",
};

export interface Product {
  id: string;
  name: string;
  categoryId: ProductCategoryId;
  /** Own photo, not derived from CATEGORY_IMAGE — guarantees no two catalog
      cards ever share a picture. */
  image: string;
  /** KRW, mock pricing — no real transaction happens anywhere in the app. */
  price: number;
  tags: string[];
}

/**
 * Generic, un-branded product mockups — same "categories, not brand-name
 * prescriptions" rule the recommendation engine follows. Every entry has its
 * own photo — no two ever share one.
 */
export const PRODUCTS: Product[] = [
  {
    id: "cleanser-foam",
    name: "저자극 약산성 클렌징 폼 150ml",
    categoryId: "mild-cleanser",
    image: IMG.productCleanser,
    price: 18000,
    tags: ["약산성", "무향"],
  },
  {
    id: "cleanser-gel",
    name: "약산성 클렌징 젤 200ml",
    categoryId: "mild-cleanser",
    image: IMG.shopProduct3,
    price: 19000,
    tags: ["약산성", "저자극"],
  },
  {
    id: "soothe-cream",
    name: "센텔라 진정 크림 50ml",
    categoryId: "soothing-moisturizer",
    image: IMG.productCream,
    price: 26000,
    tags: ["센텔라", "판테놀"],
  },
  {
    id: "sunscreen-mineral",
    name: "무기자차 선크림 SPF50+ PA++++ 50ml",
    categoryId: "sunscreen",
    image: IMG.productSunscreen,
    price: 24000,
    tags: ["무기자차", "SPF50+"],
  },
  {
    id: "sunscreen-tone-up",
    name: "톤업 선에센스 PA++++ 40ml",
    categoryId: "sunscreen",
    image: IMG.shopProduct4,
    price: 19000,
    tags: ["톤업", "논코메도제닉"],
  },
  {
    id: "serum-hyaluronic",
    name: "히알루론산 수분 세럼 30ml",
    categoryId: "hydrating-serum",
    image: IMG.productSkinTexture,
    price: 28000,
    tags: ["히알루론산", "고보습"],
  },
  {
    id: "barrier-cream",
    name: "세라마이드 장벽 크림 60ml",
    categoryId: "barrier-cream",
    image: IMG.shopProduct2,
    price: 29000,
    tags: ["세라마이드", "장벽 강화"],
  },
  {
    id: "gel-moisturizer",
    name: "오일프리 젤 모이스처라이저 70ml",
    categoryId: "light-gel",
    image: IMG.shopProduct1,
    price: 20000,
    tags: ["오일프리", "산뜻함"],
  },
];
