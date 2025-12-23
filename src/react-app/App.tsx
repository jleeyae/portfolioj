import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { StarRating } from "./components/StarRating";

/* ================================
   TYPES
================================ */

type Home = {
  id: string;
  region: string;
  title: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  price?: number;
  monthlyIncomeMin?: number;
  monthlyIncomeMax?: number;
  annualIncomeMin?: number;
  annualIncomeMax?: number;
  roiNotes?: string;
  vibeTitle?: string;
  vibeBlurb?: string;
  mapUrl?: string;
  redfinUrl?: string;
  homeImageUrl?: string;
};

/* ================================
   STORAGE KEYS
================================ */

const LS_HOMES = "pp.homes.v1";
const LS_REGION = "pp.region.v1";
const LS_HERO_OVERRIDES = "pp.heroOverrides.v1";
const LS_THEME = "pp.theme.v1";
const LS_RATINGS = "pp.ratings.v1";
const LS_FAVORITES = "pp.favorites.v1";

/* ================================
   RATINGS
================================ */

function loadRatings(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_RATINGS);
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object") return parsed;
  } catch {}
  return {};
}

function saveRatings(ratings: Record<string, number>) {
  localStorage.setItem(LS_RATINGS, JSON.stringify(ratings));
}

/* ================================
   DEFAULT DATA
================================ */

const DEFAULT_HOMES: Home[] = [
  {
    id: "lakehurst-loop",
    region: "Hill Country",
    title: "19813 & 19817 Lakehurst Loop, Spicewood, TX 78669",
    beds: 4,
    baths: 4,
    sqft: 4000,
    price: 6550000,
    monthlyIncomeMin: 12000,
    monthlyIncomeMax: 16000,
    annualIncomeMin: 144000,
    annualIncomeMax: 192000,
    roiNotes:
      "Lakefront Hill Country luxury with limited comparable inventory. Pricing power driven by water access + gated feel.",
    vibeTitle: "Lake & Wine Night",
    vibeBlurb: "Dock-to-dinner energy.",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=19813%20Lakehurst%20Loop%20Spicewood%20TX",
    redfinUrl: "https://www.redfin.com/",
    homeImageUrl:
      "https://photos.zillowstatic.com/fp/20f5b7b63b700d484db70e0c98234a5c-p_f.jpg",
  },
  {
    id: "bee-creek-3507",
    region: "Hill Country",
    title: "3507 Bee Creek Rd, Spicewood, TX 78669",
    beds: 3,
    baths: 3,
    sqft: 3777,
    price: 1299000,
    monthlyIncomeMin: 4500,
    monthlyIncomeMax: 6500,
    annualIncomeMin: 54000,
    annualIncomeMax: 78000,
    roiNotes:
      "Hill Country charm at a more accessible price point. Great for wine country weekends.",
    vibeTitle: "Wine Country Escape",
    vibeBlurb: "Relaxed hill country vibes.",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=3507%20Bee%20Creek%20Rd%20Spicewood%20TX",
    redfinUrl: "https://www.redfin.com/",
  },
];

/* ================================
   HELPERS
================================ */

function formatMoney(n?: number) {
  if (n == null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${Math.round(n).toLocaleString()}`;
  return `$${n}`;
}

function formatRange(min?: number, max?: number) {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `${formatMoney(min)}–${formatMoney(max)}`;
  return formatMoney(min ?? max);
}

/* ================================
   APP
================================ */

export default function App() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [regionFilter, setRegionFilter] = useState("All regions");
  const [isDark, setIsDark] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const heroOverridesRef = useRef<Record<string, string>>({});

  /* ================================
     BOOTSTRAP
  ================================ */

  useEffect(() => {
    const dark = localStorage.getItem(LS_THEME) === "dark";
    setIsDark(dark);
    document.documentElement.dataset.theme = dark ? "dark" : "light";

    setRatings(loadRatings());

    const fav = localStorage.getItem(LS_FAVORITES);
    if (fav) setFavorites(JSON.parse(fav));

    const savedHomes = localStorage.getItem(LS_HOMES);
    setHomes(savedHomes ? JSON.parse(savedHomes) : DEFAULT_HOMES);

    const savedHeroes = localStorage.getItem(LS_HERO_OVERRIDES);
    if (savedHeroes) heroOverridesRef.current = JSON.parse(savedHeroes);
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  /* ================================
     DERIVED
  ================================ */

  const regions = useMemo(() => {
    const s = new Set<string>();
    homes.forEach((h) => s.add(h.region || "Uncategorized"));
    return ["All regions", ...Array.from(s).sort()];
  }, [homes]);

  const grouped = useMemo(() => {
    const map = new Map<string, Home[]>();
    homes
      .filter((h) =>
        regionFilter === "All regions" ? true : h.region === regionFilter
      )
      .forEach((h) => {
        const r = h.region || "Uncategorized";
        if (!map.has(r)) map.set(r, []);
        map.get(r)!.push(h);
      });
    return Array.from(map.entries());
  }, [homes, regionFilter]);

  /* ================================
     ACTIONS
  ================================ */

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem(LS_THEME, next ? "dark" : "light");
  }

  function setRating(id: string, value: number) {
    const v = Math.max(0, Math.min(5, Math.round(value)));
    setRatings((prev) => {
      const next = { ...prev, [id]: v };
      saveRatings(next);
      return next;
    });
  }

  function toggleFavorite(id: string) {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function heroFor(h: Home) {
    return (
      heroOverridesRef.current[h.id] ||
      h.homeImageUrl ||
      `https://picsum.photos/seed/${encodeURIComponent(h.id)}/1200/700`
    );
  }

  /* ================================
     RENDER
  ================================ */

  return (
    <div className="pp-page">
      <header className="pp-top">
        <div>
          <h1 className="pp-title">Property Portfolio</h1>
          <p className="pp-subtitle">A family space for vibes, math, and decisions.</p>
        </div>

        <div className="pp-top-right">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            {regions.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>

          <button className="pp-btn" onClick={toggleTheme}>
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>

          <button className="pp-btn pp-btn-primary" onClick={() => window.print()}>
            Print Storybook PDF
          </button>
        </div>
      </header>

      <main>
        {grouped.map(([region, list]) => (
          <section key={region} className="pp-region">
            <h2>{region}</h2>

            <div className="pp-grid">
              {list.map((h) => (
                <article key={h.id} className="pp-card">
                  <div className="pp-hero">
                    <img src={heroFor(h)} alt={h.title} />
                    <div className="pp-hero-actions">
                      <button
                        className={`pp-like ${
                          favorites.includes(h.id) ? "is-on" : ""
                        }`}
                        onClick={() => toggleFavorite(h.id)}
                      >
                        {favorites.includes(h.id) ? "♥" : "♡"}
                      </button>
                    </div>
                  </div>

                  <div className="pp-card-body">
                    <div className="pp-card-title">{h.title}</div>

                    <div className="pp-stats">
                      <div className="pp-stat">
                        <div className="pp-stat-label">PRICE</div>
                        <div className="pp-stat-value">{formatMoney(h.price)}</div>
                      </div>
                      <div className="pp-stat">
                        <div className="pp-stat-label">MONTHLY</div>
                        <div className="pp-stat-value">
                          {formatRange(h.monthlyIncomeMin, h.monthlyIncomeMax)}
                        </div>
                      </div>
                      <div className="pp-stat">
                        <div className="pp-stat-label">ANNUAL</div>
                        <div className="pp-stat-value">
                          {formatRange(h.annualIncomeMin, h.annualIncomeMax)}
                        </div>
                      </div>
                    </div>

                    {h.roiNotes && (
                      <div className="pp-roi">
                        <strong>ROI Notes:</strong> {h.roiNotes}
                      </div>
                    )}

                    {(h.vibeTitle || h.vibeBlurb) && (
                      <div className="pp-vibe">
                        <div className="pp-vibe-title">{h.vibeTitle}</div>
                        <div className="pp-vibe-blurb">{h.vibeBlurb}</div>
                        <StarRating
                          value={ratings[h.id] ?? 0}
                          onChange={(v) => setRating(h.id, v)}
                        />
                      </div>
                    )}

                    <div className="pp-actions">
                      <a href={h.mapUrl} target="_blank" rel="noreferrer">
                        Open in Maps
                      </a>
                      <a href={h.redfinUrl} target="_blank" rel="noreferrer">
                        Open in Redfin
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
