import React from "react";

type Props = {
  value: number; // 0..5
  onChange: (next: number) => void;
  size?: number;
  disabled?: boolean;
};

export function StarRating({ value, onChange, size = 18, disabled = false }: Props) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="pp-stars" role="radiogroup" aria-label="Family rating">
      {stars.map((s) => {
        const filled = s <= value;
        return (
          <button
            key={s}
            type="button"
            className={`pp-star ${filled ? "is-on" : ""}`}
            disabled={disabled}
            onClick={() => onChange(s)}
            aria-label={`Rate ${s} star${s === 1 ? "" : "s"}`}
            aria-checked={s === value}
            role="radio"
          >
            ★
          </button>
        );
      })}

      {value > 0 && (
        <button
          type="button"
          className="pp-star-clear"
          disabled={disabled}
          onClick={() => onChange(0)}
          aria-label="Clear rating"
          title="Clear rating"
        >
          Clear
        </button>
      )}
    </div>
  );
}
