import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { HomeCard, Home } from "./components/HomeCard";
import { useRatings } from "../hooks/useRatings";

export default function App() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const { ratings, setRating } = useRatings();

  useEffect(() => {
    fetch("/homes.json")
      .then(r => r.json())
      .then(setHomes)
      .catch(console.error);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Home[]>();
    homes.forEach(h => {
      if (!map.has(h.region)) map.set(h.region, []);
      map.get(h.region)!.push(h);
    });
    return Array.from(map.entries());
  }, [homes]);

  function toggleAll(expand: boolean) {
    const next: Record<string, boolean> = {};
    grouped.forEach(([region]) => (next[region] = !expand));
    setCollapsed(next);
  }

  return (
    <div className="pp-page">
      <header className="pp-atlas-header">
        <h1>Property Atlas</h1>
        <p>A living map of places, prices, and possibilities</p>

        <div className="pp-atlas-actions">
          <button onClick={() => toggleAll(true)}>Expand All</button>
          <button onClick={() => toggleAll(false)}>Collapse All</button>
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
                onClick={() =>
                  setCollapsed(p => ({ ...p, [region]: !p[region] }))
                }
              >
                {region}
              </button>

              {!isClosed && (
                <div className="pp-carousel">
                  {list.map(home => (
                    <HomeCard
                      key={home.id}
                      home={home}
                      rating={ratings[home.id] ?? 0}
                      onRate={v => setRating(home.id, v)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
