import StarRating from "./StarRating";

export default function HomeCard({ home, onImageClick }: any) {
  return (
    <article className="pp-card">
      <div className="pp-image-wrap" onClick={onImageClick}>
        <img
          src={home.homeImageUrl}
          alt={home.title}
          loading="lazy"
        />
      </div>

      <div className="pp-card-body">
        <a href={home.redfinUrl} target="_blank" rel="noreferrer">
          {home.title}
        </a>

        <div className="pp-stats">
          <div>
            <label>Price</label>
            <span>$ {(home.price / 1_000_000).toFixed(2)}M</span>
          </div>
          <div>
            <label>Monthly</label>
            <span>$ {home.monthlyIncomeMin?.toLocaleString()}</span>
          </div>
          <div>
            <label>Annual</label>
            <span>$ {(home.annualIncomeMin / 1000).toFixed(0)}k</span>
          </div>
        </div>

        <StarRating />
      </div>
    </article>
  );
}
