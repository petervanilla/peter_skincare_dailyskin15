/** The real wordmark file — /public/design/00_logo.png, 805×274px. */
const LOGO_SRC = "/design/00_logo.png";
const LOGO_ASPECT = 805 / 274;

function Leaf({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden>
      <path
        d="M4 20c0-8 6-14 16-16-2 10-8 16-16 16Z"
        fill="currentColor"
      />
      <path
        d="M4 20c4-4 8-7 13-9.5"
        stroke="var(--color-background, #f7f6f2)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Header-slot mark — the real wordmark, sized off its own aspect ratio.
 * `height` is the wordmark's cap height in px; 28 sits close to the headline
 * type it sits next to, clearly smaller than the 40px avatar beside it
 * rather than competing with it.
 *
 * Plain <img>, not next/image: with computed (non-literal) width/height,
 * next/image was rendering this element as a square — width both times,
 * ignoring the height prop — regardless of the CSS applied on top. A plain
 * img with explicit width/height attributes doesn't have that problem, and
 * this is a single small static asset with no need for the optimizer.
 */
export function LogoMark({ height = 28 }: { height?: number }) {
  const width = Math.round(height * LOGO_ASPECT);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={LOGO_SRC} alt="DailySkin" width={width} height={height} className="shrink-0" />
  );
}

/**
 * System fonts only — no script typeface ships in the app bundle — so this
 * asks the OS for whatever cursive/script face it has (Snell Roundhand on
 * macOS/iOS, Segoe Script on Windows) and falls back to generic `cursive`.
 * Close to the reference wordmark's flow, not a pixel match.
 */
const SCRIPT_FONT_STACK =
  '"Snell Roundhand", "Segoe Script", "Bradley Hand", "Apple Chancery", cursive';

/**
 * Rounded-square lockup — cream card, cursive wordmark, leaf accent, swash
 * underline — matching the composition of the user's reference logo image.
 * Used wherever that reference sits: the loading screen and the onboarding
 * hero's photo slot.
 */
export function LogoBadge({ size = 160, className = "" }: { size?: number; className?: string }) {
  const wordSize = size * 0.2;

  return (
    <div
      className={`flex items-center justify-center rounded-[26%] bg-brand-neutral ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="flex flex-col items-center" style={{ paddingInline: size * 0.08 }}>
        <div className="flex items-end gap-1">
          <span
            className="text-primary"
            style={{ fontFamily: SCRIPT_FONT_STACK, fontSize: wordSize, lineHeight: 1 }}
          >
            DailySkin
          </span>
          <Leaf
            className="mb-[0.15em] shrink-0 text-primary"
            style={{ width: wordSize * 0.4, height: wordSize * 0.4 }}
          />
        </div>
        <svg
          viewBox="0 0 140 16"
          aria-hidden
          className="mt-1 text-primary"
          style={{ width: wordSize * 3.4 }}
        >
          <path
            d="M4 8c30 9 60 9 88 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
