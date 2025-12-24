import { useEffect, useMemo, useState } from "react";
import "./App.css";
import "./print.css";
import HomeCard from "./components/HomeCard";

type Home = {
  id: string;
  region: string;
  title: string;
  price?: number;
  monthlyIncomeMin?: number;
  monthlyIncomeMax?: number;
  annualIncomeMin?: number;
  annualIncomeMax?: number;
  redfinUrl?: string;
  homeImageUrl?: string;
};

const LS_THEME = "pp.theme.v1";
const LS_COLLAPSE = "pp.regions.collapsed.v1";

export default function App() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/homes.json")
      .then(r => r.json())
      .then(setHomes);

    const t = localStorage.getItem(LS_THEME);
    if (t === "dark") {
      setIsDark(true);
      document.documentElement.dataset.theme = "dark";
    }

    const c = localStorage.getItem(LS_COLLAPSE);
    if (c) setCollapsed(JSON.parse(c));
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_COLLAPSE, JSON.stringify(collapsed));
  }, [collapsed]);

  const grouped = useMemo(() => {
    const map = new Map<string, Home[]>();
    homes.forEach(h => {
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

  function setAll(expand: boolean) {
    const next: Record<string, boolean> = {};
    grouped.forEach(([r]) => (next[r] = !expand));
    setCollapsed(next);
  }

  return (
    <div className="pp-page">
      <header className="pp-atlas-header">
        <div className="pp-header-inner">
          <h1>Property Atlas</h1>
          <p>A living map of places, prices, and possibilities</p>

          <div className="pp-actions">
            <button onClick={toggleTheme}>
              {isDark ? "Light Mode" : "Dark Mode"}
            </button>
            <button onClick={() => setAll(true)}>Expand All</button>
            <button onClick={() => setAll(false)}>Collapse All</button>
            <button className="primary" onClick={() => window.print()}>
              Print PDF
            </button>
          </div>
        </div>
      </header>

      {grouped.map(([region, list]) => {
        const isClosed = collapsed[region];
        return (
          <section key={region} className="pp-region">
            <div className="pp-region-pill-wrap">
              <button
                className="pp-region-pill"
                onClick={() =>
                  setCollapsed(p => ({ ...p, [region]: !p[region] }))
                }
              >
                {region}
                <span className={`chevron ${isClosed ? "" : "open"}`} />
              </button>
            </div>

            <div className={`pp-region-body ${isClosed ? "collapsed" : ""}`}>
              <div className="pp-carousel">
                {list.map(h => (
                  <HomeCard key={h.id} home={h} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
