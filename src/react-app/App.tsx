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
const LS_THEME = "pp.theme.v1";
const LS_RATINGS = "pp.ratings.v1";
const LS_FAVORITES = "pp.favorites.v1";
const LS_COLLAPSE = "pp.regions.collapsed.v1";

/* ================================
   HELPERS
================================ */

function formatMoney(n?: number) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${Math.round(n).toLocaleString()}`;
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
  const [isDark, setIsDark] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [shortlistOnly, setShortlistOnly] = useState(false);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [manageOpen, setManageOpen] = useState(false);
  const [manageJSON, setManageJSON] = useState("");

  const previousJSONRef = useRef("");

  /* ================================
     BOOT
  ================================ */

  useEffect(() => {
    const savedHomes = localStorage.getItem(LS_HOMES);
    if (savedHomes) {
      setHomes(JSON.parse(savedHomes));
      previousJSONRef.current = savedHomes;
      setManageJSON(savedHomes);
    }

    const theme = localStorage.getItem(LS_THEME);
    if (theme === "dark") {
      setIsDark(true);
      document.documentElement.dataset.theme = "dark";
    }

    const r = localStorage.getItem(LS_RATINGS);
    if (r) setRatings(JSON.parse(r));

    const f = localStorage.getItem(LS_FAVORITES);
    if (f) setFavorites(JSON.parse(f));

    const c = localStorage.getItem(LS_COLLAPSE);
    if (c) setCollapsed(JSON.parse(c));
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_HOMES, JSON.stringify(homes));
  }, [homes]);

  useEffect(() => {
    localStorage.setItem(LS_FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(LS_COLLAPSE, JSON.stringify(collapsed));
  }, [collapsed]);

  /* ================================
     DERIVED
  ================================ */

  const grouped = useMemo(() => {
    const map = new Map<string, Home[]>();
    homes.forEach((h) => {
      if (shortlistOnly && !favorites.includes(h.id)) return;
      const r = h.region || "Uncategorized";
      if (!map.has(r)) map.set(r, []);
      map.get(r)!.push(h);
    });
    return Array.from(map.entries());
  }, [homes, favorites, shortlistOnly]);

  /* ================================
     ACTIONS
  ================================ */

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem(LS_THEME, next ? "dark" : "light");
  }

  function toggleFavorite(id: string) {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function setRating(id: string, value: number) {
    const v = Math.max(0, Math.min(5, Math.round(value)));
    setRatings((prev) => {
      const next = { ...prev, [id]: v };
      localStorage.setItem(LS_RATINGS, JSON.stringify(next));
      return next;
    });
  }

  function toggleRegion(region: string) {
    setCollapsed((prev) => ({ ...prev, [region]: !prev[region] }));
  }

  function applyManageJSON() {
    try {
      const parsed = JSON.parse(manageJSON);
      if (!Array.isArray(parsed)) return;
      setHomes(parsed);
      previousJSONRef.current = manageJSON;
      setManageOpen(false);
    } catch {
      alert("Invalid JSON");
    }
  }

  /* ================================
     RENDER
  ================================ */

  return (
    <div className="pp-page">
      {/* ===== HEADER ===== */}
      <header className="pp-atlas-header">
        <h1 className="pp-atlas-title">Property Atlas</h1>
        <p className="pp-atlas-sub">
          A living map of places, prices, and possibilities
        </p>

        <div className="pp-atlas-actions">
          <button className="pp-btn" onClick={toggleTheme}>
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>

          <button
            className={`pp-btn ${shortlistOnly ? "pp-btn-primary" : ""}`}
            onClick={() => setShortlistOnly((v) => !v)}
          >
            {shortlistOnly ? "Viewing Shortlist" : "Shortlist Only"}
          </button>

          <button className="pp-btn" onClick={() => setManageOpen(true)}>
            Manage Homes
          </button>

          <button className="pp-btn pp-btn-primary" onClick={() => window.print()}>
            Print PDF
          </button>
        </div>
      </header>

      {/* ===== REGIONS ===== */}
      <main>
        {grouped.map(([region, list]) => {
          const isClosed = collapsed[region];
          return (
            <section key={region} className="pp-region">
              <button
                className="pp-region-header"
                onClick={() => toggleRegion(region)}
              >
                <span>{region}</span>
                <span className="pp-region-meta">
                  {list.length} homes {isClosed ? "▸" : "▾"}
                </span>
              </button>

              <div
                className={`pp-region-body ${isClosed ? "collapsed" : ""}`}
              >
                <div className="pp-grid">
                  {list.map((h) => (
                    <article key={h.id} className="pp-card">
                      <div className="pp-hero">
                        {h.homeImageUrl && (
                          <img src={h.homeImageUrl} alt={h.title} />
                        )}
                        <button
                          className={`pp-like ${
                            favorites.includes(h.id) ? "is-on" : ""
                          }`}
                          onClick={() => toggleFavorite(h.id)}
                        >
                          ♥
                        </button>
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
                            <div className="pp-stat-label">PRICE</div>
                            <div>{formatMoney(h.price)}</div>
                          </div>
                          <div>
                            <div className="pp-stat-label">MONTHLY</div>
                            <div>
                              {formatRange(
                                h.monthlyIncomeMin,
                                h.monthlyIncomeMax
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="pp-stat-label">ANNUAL</div>
                            <div>
                              {formatRange(
                                h.annualIncomeMin,
                                h.annualIncomeMax
                              )}
                            </div>
                          </div>
                        </div>

                        <StarRating
                          value={ratings[h.id] ?? 0}
                          onChange={(v) => setRating(h.id, v)}
                        />

                        <div className="pp-actions">
                          {h.mapUrl && (
                            <a href={h.mapUrl} target="_blank" rel="noreferrer">
                              Maps
                            </a>
                          )}
                          {h.redfinUrl && (
                            <a href={h.redfinUrl} target="_blank" rel="noreferrer">
                              Redfin
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </main>

      {/* ===== MANAGE MODAL ===== */}
      {manageOpen && (
        <div className="pp-modal-backdrop" onClick={() => setManageOpen(false)}>
          <div
            className="pp-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Manage Homes</h2>
            <p>Paste, edit, and replace your homes JSON</p>

            <textarea
              className="pp-textarea"
              value={manageJSON}
              onChange={(e) => setManageJSON(e.target.value)}
            />

            <div className="pp-modal-actions">
              <button className="pp-btn" onClick={() => setManageOpen(false)}>
                Cancel
              </button>
              <button className="pp-btn pp-btn-primary" onClick={applyManageJSON}>
                Apply JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
