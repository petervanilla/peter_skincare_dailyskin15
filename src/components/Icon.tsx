interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
  /** Material Symbols weight axis (100–700). Lower = thinner strokes. */
  weight?: number;
}

/** Material Symbols Outlined, the icon set the Stitch designs reference. */
export function Icon({ name, className = "", filled = false, size, weight }: IconProps) {
  const style: React.CSSProperties = {};
  if (size) style.fontSize = `${size}px`;
  if (weight) style.fontVariationSettings = `"FILL" ${filled ? 1 : 0}, "wght" ${weight}`;

  return (
    <span
      className={`material-symbols-outlined ${filled ? "filled" : ""} ${className}`}
      style={size || weight ? style : undefined}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
