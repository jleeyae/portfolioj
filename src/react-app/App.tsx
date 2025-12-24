import { useEffect, useMemo, useState } from "react";
import "./App.css";
import HomeCard from "./components/HomeCard";
import Lightbox from "./components/Lightbox";

type Home = {
  id: string;
  region: string;
  title: string;
  price?: number;
  monthlyIncomeMin?: number;
  annualIncomeMin?: number;
  redfinUrl?: string;
  homeImageUrl?: string;
};

const LS_THEME = "pp.theme.v1";
const LS_COLLAPSE = "pp.collapse.v1";

export default function App() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    fetch("/homes.json").then(r => r.json()).then(setHomes);
  }, []);

  useEffect(() => {
    const t = localStorage.getItem(LS_THEME);
    if (t === "dark") {
      setDark(true);
      document.documentElement.dataset.theme = "dark";
    }
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem(LS_THEME, next ? "dark" : "light");
  }

  const grouped = useMemo(() => {
    const m = new Map<string, Home[]>();
    homes.forEach(h => {
      if (!m.has(h.region)) m.set(h.region, []);
      m.get(h.region)!.push(h);
    });
    return Array.from(m.entries());
  }, [homes]);

  function toggleRegion(region: string) {
    setCollapsed(p => ({ ...p, [region]: !p[region] }));
  }

  return (
    <div className="pp-page">
      <header className="pp-header">
        <h1>Property Atlas</h1>
        <p>A living map of places, prices, and possibilities</p>

        <div className="pp-actions">
          <button onClick={toggleTheme}>
            {dark ? "Light Mode" : "Dark Mode"}
          </button>
          <button onClick={() => setCollapsed({})}>Expand All</button>
          <button onClick={() => {
            const next: Record<string, boolean> = {};
            grouped.forEach(([r]) => (next[r] = true));
            setCollapsed(next);
          }}>Collapse All</button>
          <button onClick={() => window.print()}>Print PDF</button>
        </div>
      </header>

      <main>
        {grouped.map(([region, list]) => {
          const isClosed = collapsed[region];
          return (
            <section key={region} className="pp-region">
              <button
                className="pp-region-pill"
                onClick={() => toggleRegion(region)}
              >
                {region}
                <span className={`chevron ${isClosed ? "" : "open"}`} />
              </button>

              {!isClosed && (
                <>
                  <div className="pp-carousel">
                    {list.map(h => (
                      <HomeCard
                        key={h.id}
                        home={h}
                        onImageClick={() => setLightbox(h.homeImageUrl || null)}
                      />
                    ))}
                  </div>

                  <div className="pp-divider" />
                </>
              )}
            </section>
          );
        })}
      </main>

      {lightbox && (
        <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
