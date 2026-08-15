import { CHALLENGE_LENGTH } from "@/lib/types";

/** Daily Skin Score trend, plotted across the fixed 15-day programme scale. */
export function ScoreChart({ points }: { points: Array<{ day: number; score: number }> }) {
  const width = 320;
  const height = 140;
  const pad = 16;

  if (points.length < 2) {
    return (
      <p className="py-8 text-center font-label-sm text-label-sm text-on-surface-variant">
        이틀 이상 기록하면 추이 그래프가 그려져요.
      </p>
    );
  }

  const xs = (day: number) => pad + ((day - 1) / (CHALLENGE_LENGTH - 1)) * (width - pad * 2);
  const ys = (score: number) => height - pad - (score / 100) * (height - pad * 2);

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xs(p.day)} ${ys(p.score)}`).join(" ");
  const area = `${path} L ${xs(points[points.length - 1].day)} ${height - pad} L ${xs(points[0].day)} ${height - pad} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="일별 점수 추이">
      {[0, 50, 100].map((v) => (
        <line key={v} x1={pad} x2={width - pad} y1={ys(v)} y2={ys(v)} stroke="#e3e2df" strokeWidth="1" />
      ))}
      <path d={area} fill="#cfe8dc" opacity="0.5" />
      <path d={path} fill="none" stroke="#004339" strokeWidth="2.5" strokeLinecap="round" />
      {points.map((p) => (
        <circle key={p.day} cx={xs(p.day)} cy={ys(p.score)} r="4" fill="#004339" />
      ))}
    </svg>
  );
}
