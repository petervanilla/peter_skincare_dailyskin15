"use client";

import { haptic } from "@/lib/haptics";

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}

/** iOS-style toggle with a stretching thumb while pressed (see `.switch`). */
export function Switch({ checked, onChange, label, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      data-on={checked}
      onClick={() => {
        haptic("select");
        onChange(!checked);
      }}
      className="switch disabled:opacity-50"
    />
  );
}
