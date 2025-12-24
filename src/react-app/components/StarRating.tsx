import { useState } from "react";

type Props = {
  value: number;
  onChange: (v: number) => void;
};

export function StarRating({ value, onChange }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="star-row">
      {[1,2,3,4,5].map(n => {
        const filled = hover != null ? n <= hover : n <= value;
        return (
          <span
            key={n}
            className={`star ${filled ? "filled" : ""}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onChange(n)}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}
