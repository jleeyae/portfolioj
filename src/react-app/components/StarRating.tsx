import { useEffect, useState } from "react";

const LS_RATINGS = "pp.ratings.v1";

export default function StarRating({ homeId }: { homeId: string }) {
  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(LS_RATINGS);
    if (saved) {
      const data = JSON.parse(saved);
      setValue(data[homeId] ?? 0);
    }
  }, [homeId]);

  function update(v: number) {
    const saved = JSON.parse(localStorage.getItem(LS_RATINGS) || "{}");
    if (v === 0) delete saved[homeId];
    else saved[homeId] = v;
    localStorage.setItem(LS_RATINGS, JSON.stringify(saved));
    setValue(v);
  }

  return (
    <div className="pp-stars">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`star ${(hover || value) >= i ? "filled" : ""}`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => update(i === value ? 0 : i)}
        >
          ★
        </span>
      ))}
    </div>
  );
}
