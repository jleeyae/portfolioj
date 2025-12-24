import { useState } from "react";

export default function StarRating() {
  const [hover, setHover] = useState(0);
  const [value, setValue] = useState(0);

  return (
    <div className="pp-stars">
      {[1,2,3,4,5].map(n => (
        <span
          key={n}
          className={n <= (hover || value) ? "on" : ""}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => setValue(n)}
        >
          ★
        </span>
      ))}
    </div>
  );
}
