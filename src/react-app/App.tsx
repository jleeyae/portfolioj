import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { StarRating } from "./components/StarRating";

type Home = {
  id: string;
  region: string;
  title: string;
  price?: number;
  monthlyIncomeMin?: number;
  monthlyIncomeMax?: number;
  annualIncomeMin?: number;
  annualIncomeMax?: number;
  mapUrl?: string;
  redfinUrl?: string;
  homeImageUrl?: string;
};

const LS_THEME = "pp.theme.v1";
const LS_RATINGS = "pp.ratings.v1";
const LS_COLLAPSE = "pp.regions.collapsed.v1";

function formatMoney(n?: number) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${Math.round(n).toLocaleString()}`;
}

function formatRange(min?: number, max?: number) {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `${formatMoney(min)}–${formatMoney(max)}`;
  return formatMoney(min ?? max);
}

export default function App() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/homes.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Home[]) => {
        setHomes(data);
      })
      .catch((err) => {
        console.error("Failed to load homes.json", err);
        alert("Failed to load homes.json. Check JSON validity.");
      });
  }, []);

  useEffect(() => {
    const t = localStorage.getItem(LS_THEME);
    if (t === "dark") {
      setIsDark(true);
      document.documentElement.dataset.theme = "dark";
    }

    const r = localStorage.getItem(LS_RATINGS);
    if (r) setRatings(JSON.parse(r));

    const c = localStorage.getItem(LS_COLLAPSE);
    if (c) setCollapsed(JSON.parse(c));
  }, []);

  useEffect(() => {
    if (!homes.length) return;
    setCollapsed((prev) => {
      if (Object.keys(prev).length) return prev;
      const init: Record<string, boolean> = {};
      homes.forEach((h) => (init[h.region] = true));
      return init;
    });
  }, [homes]);

  useEffect(() => {
    localStorage.setItem(LS_COLLAPSE, JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem(LS_RATINGS, JSON.stringify(ratings));
  }, [ratings]);

  const grouped = useMemo(() => {
    const map = new Map<string, Home[]>();
    homes.forEach((h) => {
      if (!map.has(h.region)) map.set(h.region, []);
      map.get(h.region)!.push(h);
    });
    return Array.from(map.entries());
  }, [homes]);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem(LS_THEME, next ? "dark" : "light");
  }

  function setRating(id: string, value: number) {
    const v = Math.max(0, Math.min(5, value));
    setRatings((p) => {
      const next = { ...p };
      if (v === 0) delete next[id];
      else next[id] = v;
      return next;
    });
  }

  function setAll(expand: boolean) {
  setCollapsed(() => {
    const next: Record<string, boolean> = {};
    grouped.forEach(([region]) => {
      next[region] = !expand;
    });
    return next;
  });
}

  return (
    <div className="pp-page">
      <header className="pp-atlas-header">
        <div className="pp-atlas-title-wrap">
          <h1 className="pp-atlas-title">Property Atlas</h1>
          <p className="pp-atlas-sub">
            A living map of places, prices, and possibilities
          </p>
        </div>

        <div className="pp-atlas-actions">
          <button className="pp-btn" onClick={toggleTheme}>
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>
          <button className="pp-btn" onClick={() => setAll(true)}>
            Expand All
          </button>
          <button className="pp-btn" onClick={() => setAll(false)}>
            Collapse All
          </button>
          <button
            className="pp-btn pp-btn-primary"
            onClick={() => window.print()}
          >
            Print PDF
          </button>
        </div>
      </header>

      <main>
        {grouped.map(([region, list]) => {
          const isClosed = collapsed[region];
          return (
            <section key={region} className="pp-region">
              <button
                className="pp-region-header"
                onClick={() =>
                  setCollapsed((p) => ({ ...p, [region]: !p[region] }))
                }
              >
                <span>{region}</span>
                <span className={`pp-chevron ${isClosed ? "" : "open"}`} />
              </button>

              <div className={`pp-region-body ${isClosed ? "collapsed" : ""}`}>
                <div className="pp-grid">
                  {list.map((h) => (
                    <article key={h.id} className="pp-card">
                      <div className="pp-map-preview">
                        {h.homeImageUrl ? (
                          <img
                            src={h.homeImageUrl}
                            alt={h.title}
                            loading="lazy"
                          />
                        ) : (
                          <span>Map Preview</span>
                        )}
                      </div>

                      <div className="pp-card-body">
                        <a
                          className="pp-card-title"
                          href={h.redfinUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {h.title}
                        </a>

                        <div className="pp-stats">
                          <div>
                            <div className="pp-stat-label">Price</div>
                            {formatMoney(h.price)}
                          </div>
                          <div>
                            <div className="pp-stat-label">Monthly</div>
                            {formatRange(
                              h.monthlyIncomeMin,
                              h.monthlyIncomeMax
                            )}
                          </div>
                          <div>
                            <div className="pp-stat-label">Annual</div>
                            {formatRange(
                              h.annualIncomeMin,
                              h.annualIncomeMax
                            )}
                          </div>
                        </div>

                        <StarRating
                          value={ratings[h.id] ?? 0}
                          onChange={(v) => setRating(h.id, v)}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
