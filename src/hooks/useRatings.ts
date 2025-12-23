import { useEffect, useMemo, useState } from "react";

type RatingsMap = Record<string, number>;

const STORAGE_KEY = "propertyPortfolio_ratings_v1";

function safeParse(json: string | null): RatingsMap {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as RatingsMap;
  } catch {
    return {};
  }
}

export function useRatings() {
  const [ratings, setRatings] = useState<RatingsMap>(() =>
    safeParse(localStorage.getItem(STORAGE_KEY))
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
  }, [ratings]);

  const api = useMemo(() => {
    return {
      get(homeId: string) {
        return ratings[homeId] ?? 0;
      },
      set(homeId: string, value: number) {
        const v = Math.max(0, Math.min(5, Math.round(value)));
        setRatings((prev) => ({ ...prev, [homeId]: v }));
      },
      clear(homeId: string) {
        setRatings((prev) => {
          const next = { ...prev };
          delete next[homeId];
          return next;
        });
      },
    };
  }, [ratings]);

  return api;
}
