import StarRating from "./StarRating";

type Home = {
  id: string;
  title: string;
  price?: number;
  monthlyIncomeMin?: number;
  monthlyIncomeMax?: number;
  annualIncomeMin?: number;
  annualIncomeMax?: number;
  redfinUrl?: string;
  homeImageUrl?: string;
};

function formatMoney(n?: number) {
  if (n == null) return "—";

  if (n >= 1_000_000) {
    return `$${(n / 1_000_000)
      .toFixed(3)
      .replace(/\.?0+$/, "")}m`;
  }

  if (n >= 1_000) {
    return `$${Math.round(n / 1_000)}k`;
  }

  return `$${n.toLocaleString()}`;
}

export default function HomeCard({ home }: { home: Home }) {
  return (
    <article className="pp-card">
      <div className="pp-image-wrap">
        <img
          src={home.homeImageUrl}
          alt={home.title}
          loading="lazy"
        />
      </div>

      <div className="pp-card-body">
        <a
          href={home.redfinUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {home.title}
        </a>

        <div className="pp-stats">
          <div>
            <label>Price</label>
            <span>{formatMoney(home.price)}</span>
          </div>

          <div>
            <label>Monthly</label>
            <span>{formatMoney(home.monthlyIncomeMin)}</span>
          </div>

          <div>
            <label>Annual</label>
            <span>{formatMoney(home.annualIncomeMin)}</span>
          </div>
        </div>

        <StarRating />
      </div>
    </article>
  );
}
