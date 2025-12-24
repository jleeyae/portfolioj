import { StarRating } from "./StarRating";

interface HomeCardProps {
  id: string;
  rating: number;
  onRate: (v: number) => void;
}

export function HomeCard({ rating, onRate }: HomeCardProps) {
  return <StarRating value={rating} onChange={onRate} />;
}
