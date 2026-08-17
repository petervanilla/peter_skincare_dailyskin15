/**
 * Every image below was exported from the finalized Stitch project
 * ("DailySkin 15 AI Diary") and downloaded into public/design.
 * Source-of-truth mapping lives in public/design/MANIFEST.txt.
 *
 * Screens use these directly so the app matches the approved comps rather
 * than re-inventing the art direction.
 */
export const IMG = {
  /** 로딩 화면 — 15 / day / 당신의 피부변화 */
  splash: "/design/ref-loading-screen-concept.png",
  /** Soft Lab lifestyle interior, used behind onboarding. */
  lifestyle: "/design/ref-lifestyle-background.png",

  /**
   * The account holder. One face is reused for the avatar, the dashboard
   * placeholder and the challenge row so the demo user reads as one person.
   */
  avatar: "/design/10-progress-day7-1.jpg",
  /** Full-bleed front-facing portrait for the dashboard card (no vignette). */
  heroPortrait: "/design/01_main_woman.png",
  /** Alternate dashboard portrait — used for the "keep current routine" pick. */
  heroDashboardAlt: "/design/05-hero-dashboard-2.jpg",

  /** Scan + analysis */
  scanFace: "/design/02-ai-face-scan-1.jpg",
  analysisFace: "/design/03-ai-skin-analysis-result-2.jpg",
  visionMesh: "/design/ref-face-scan-3d-v2.png",
  visionMeshAlt: "/design/ref-face-scan-3d-v1.png",

  /** Routine */
  routineAvatar: "/design/06-todays-skincare-routine-1.jpg",
  faceYogaHero: "/design/06-todays-skincare-routine-2.jpg",
  faceYogaLesson: "/design/07-face-yoga-routine-1.jpg",

  /** Products — TODAY'S PICKS */
  productSkinTexture: "/design/08-product-discovery-1.jpg",
  productLayers: "/design/08-product-discovery-2.jpg",
  productCleanser: "/design/08-product-discovery-3.jpg",
  productCream: "/design/08-product-discovery-4.jpg",
  productSunscreen: "/design/08-product-discovery-5.jpg",

  /** Shop catalog — additional product shots, one photo per product. */
  shopProduct1: "/design/13-shop-1.jpg",
  shopProduct2: "/design/13-shop-2.jpg",
  shopProduct3: "/design/13-shop-3.jpg",
  shopProduct4: "/design/13-shop-4.jpg",

  /**
   * Before / After demo pair, used only until the user has their own captures.
   * Both are portrait crops of the same subject so the split lines up; the
   * "after" is the same shot the dashboard uses, so the demo user stays one
   * person across the app.
   */
  beforeDemo: "/design/11-7day-glow-challenge-1.jpg",
  afterDemo: "/design/11-7day-glow-challenge-3.jpg",

  /** Progress gallery */
  progressAvatar: "/design/10-progress-day7-1.jpg",
  progressGallery: [
    "/design/10-progress-day7-2.jpg",
    "/design/10-progress-day7-3.jpg",
    "/design/10-progress-day7-4.jpg",
    "/design/10-progress-day7-5.jpg",
  ],

  /** Challenge + leaderboard avatars (the user's own row uses `avatar`) */
  challengeRivals: [
    "/design/11-7day-glow-challenge-2.jpg",
    "/design/11-7day-glow-challenge-3.jpg",
    "/design/11-7day-glow-challenge-4.jpg",
  ],
  boardAvatars: [
    "/design/12-leaderboard-ranking-1.jpg",
    "/design/12-leaderboard-ranking-2.jpg",
    "/design/12-leaderboard-ranking-3.jpg",
    "/design/12-leaderboard-ranking-4.jpg",
    "/design/12-leaderboard-ranking-5.jpg",
    "/design/12-leaderboard-ranking-6.jpg",
    "/design/12-leaderboard-ranking-7.jpg",
  ],
} as const;
