type Props = {
  value: number;
  onChange: (v: number) => void;
};

export function StarRating({ value, onChange }: Props) {
  return (
    <div className="pp-stars">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          className={`pp-star ${value >= n ? "on" : ""}`}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <button className="pp-clear" onClick={() => onChange(0)}>
          Clear
        </button>
      )}
    </div>
  );
}
