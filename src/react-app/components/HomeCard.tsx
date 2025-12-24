import { useState } from "react";
import { StarRating } from "./StarRating";

interface Home {
  id: string;
  title: string;
  price?: number;
  monthlyIncomeMin?: number;
  monthlyIncomeMax?: number;
  annualIncomeMin?: number;
  annualIncomeMax?: number;
  redfinUrl?: string;
  homeImageUrl?: string;
}

interface HomeCardProps {
  home: Home;
  rating: number;
  onRate: (v: number) => void;
}

export function HomeCard({ home, rating, onRate }: HomeCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <article
      className="pp-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* IMAGE PARALLAX WRAPPER */}
      <div className="pp-image-frame">
        {home.homeImageUrl ? (
          <img
            src={home.homeImageUrl}
            alt={home.title}
            loading="lazy"
            className={`pp-card-image ${hovered ? "is-hovered" : ""}`}
          />
        ) : (
          <div className="pp-image-skeleton" />
        )}
      </div>

      <div className="pp-card-body">
        <a
          href={home.redfinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pp-card-title"
        >
          {home.title}
        </a>

        <div className="pp-stats">
          <div>
            <label>Price</label>
            <div>${home.price?.toLocaleString()}</div>
          </div>
          <div>
            <label>Monthly</label>
            <div>
              ${home.monthlyIncomeMin?.toLocaleString()}–
              {home.monthlyIncomeMax?.toLocaleString()}
            </div>
          </div>
          <div>
            <label>Annual</label>
            <div>
              ${home.annualIncomeMin?.toLocaleString()}–
              {home.annualIncomeMax?.toLocaleString()}
            </div>
          </div>
        </div>

        <StarRating value={rating} onChange={onRate} />
      </div>
    </article>
  );
}
