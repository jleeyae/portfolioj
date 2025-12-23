import { useRatings } from "../../hooks/useRatings";
import { StarRating } from "./StarRating";

interface Home {
  id: string;
  title: string;
}

interface HomeCardProps {
  home: Home;
}

export function HomeCard({ home }: HomeCardProps) {
  const ratings = useRatings();
  const rating = ratings.get(home.id);

  return (
    <StarRating
      value={rating}
      onChange={(next) => ratings.set(home.id, next)}
    />
  );
}
