import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { StarRating } from "./components/StarRating";

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

const LS_HOMES = "pp.homes.v1";
const LS_REGION = "pp.region.v1";
const LS_HERO_OVERRIDES = "pp.heroOverrides.v1";
const LS_THEME = "pp.theme.v1";
const LS_RATINGS = "pp.ratings.v1";

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
    homeImageUrl: "https://photos.zillowstatic.com/fp/20f5b7b63b700d484db70e0c98234a5c-p_f.jpg",
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

function formatMoney(n?: number) {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
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

function slug(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function looksLikeImageUrl(url: string) {
  return /^https?:\/\/.+/i.test(url) && /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(url.trim());
}

function parseCSVorTSV(text: string): Array<Record<string, string>> {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes("\t") ? "\t" : ",";

  const splitLine = (line: string) => {
    if (delimiter === "\t") return line.split("\t").map((x) => x.trim());
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === delimiter && !inQuotes) {
        out.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  const headers = splitLine(lines[0]).map((h) => h.trim());
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

export default function App() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [regionFilter, setRegionFilter] = useState<string>("All regions");
  const [isDark, setIsDark] = useState<boolean>(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const [isManageOpen, setIsManageOpen] = useState(false);
  const [manageTab, setManageTab] = useState<"json" | "csv" | "heroes" | "export">("json");
  const [jsonText, setJsonText] = useState("");
  const [csvText, setCsvText] = useState("");
  const [heroesText, setHeroesText] = useState("");
  const [report, setReport] = useState<string>("");

  const heroOverridesRef = useRef<Record<string, string>>({});

  function setRating(id: string, value: number) {
    const v = Math.max(0, Math.min(5, Math.round(value)));
    setRatings((prev) => {
      const next = { ...prev, [id]: v };
      saveRatings(next);
      return next;
    });
  }

  // Load persisted state on boot
  useEffect(() => {
    const savedTheme = localStorage.getItem(LS_THEME);
    const nextDark = savedTheme === "dark";
    setIsDark(nextDark);
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";

const loaded = loadRatings();
for (const k of Object.keys(loaded)) {
  loaded[k] = Math.max(0, Math.min(5, Math.round(Number(loaded[k]) || 0)));
}
setRatings(loaded);

    const savedRegion = localStorage.getItem(LS_REGION);
    if (savedRegion) setRegionFilter(savedRegion);

    const savedHomes = localStorage.getItem(LS_HOMES);
    let initialHomes: Home[] = DEFAULT_HOMES;
    if (savedHomes) {
      try {
        const parsed = JSON.parse(savedHomes);
        if (Array.isArray(parsed)) initialHomes = parsed;
      } catch {}
    }
    setHomes(initialHomes);

    const savedHeroes = localStorage.getItem(LS_HERO_OVERRIDES);
    if (savedHeroes) {
      try {
        const parsed = JSON.parse(savedHeroes);
        if (parsed && typeof parsed === "object") heroOverridesRef.current = parsed;
      } catch {}
    }
  }, []);

  // Persist region
  useEffect(() => {
    localStorage.setItem(LS_REGION, regionFilter);
  }, [regionFilter]);

  const regions = useMemo(() => {
    const s = new Set<string>();
    homes.forEach((h) => s.add(h.region || "Uncategorized"));
    return ["All regions", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [homes]);

  const filteredHomes = useMemo(() => {
    if (regionFilter === "All regions") return homes;
    return homes.filter((h) => (h.region || "Uncategorized") === regionFilter);
  }, [homes, regionFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Home[]>();
    filteredHomes.forEach((h) => {
      const r = h.region || "Uncategorized";
      if (!map.has(r)) map.set(r, []);
      map.get(r)!.push(h);
    });
    const out = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    out.forEach(([, list]) => list.sort((x, y) => x.title.localeCompare(y.title)));
    return out;
  }, [filteredHomes]);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem(LS_THEME, next ? "dark" : "light");
  }

  function heroFor(h: Home) {
    const overrides = heroOverridesRef.current || {};
    const override = overrides[h.id];
    if (override) return override;
    if (h.homeImageUrl) return h.homeImageUrl;

    const seed = encodeURIComponent(h.id || h.title || "home");
    return `https://picsum.photos/seed/${seed}/1200/700`;
  }

  function openManage(tab?: typeof manageTab) {
    setReport("");
    if (tab) setManageTab(tab);

    setJsonText(JSON.stringify(homes, null, 2));
    setCsvText(
      "id,region,title,beds,baths,sqft,price,monthlyIncomeMin,monthlyIncomeMax,annualIncomeMin,annualIncomeMax,homeImageUrl,mapUrl,redfinUrl,roiNotes,vibeTitle,vibeBlurb\n"
    );
    setHeroesText("");
    setIsManageOpen(true);
  }

  function applyHomes(nextHomes: Home[], note: string) {
    setHomes(nextHomes);
    localStorage.setItem(LS_HOMES, JSON.stringify(nextHomes));
    setReport(note);
  }

  function applyJSONReplace() {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        setReport("JSON must be an array of homes.");
        return;
      }
    const price = x.price != null ? Number(x.price) : undefined;

    const carry = price != null && Number.isFinite(price)
      ? estimatePaymentRange(price)
      : {};
      return {
        id: String(x.id ?? slug(String(x.title ?? ""))),
        region: String(x.region ?? "Uncategorized"),
        title: String(x.title ?? ""),
        beds: x.beds != null ? Number(x.beds) : undefined,
        baths: x.baths != null ? Number(x.baths) : undefined,
        sqft: x.sqft != null ? Number(x.sqft) : undefined,
        price,
        // If user already provided monthly/annual, keep theirs. Otherwise fill.
        monthlyIncomeMin: x.monthlyIncomeMin != null ? Number(x.monthlyIncomeMin) : (carry as any).monthlyIncomeMin,
        monthlyIncomeMax: x.monthlyIncomeMax != null ? Number(x.monthlyIncomeMax) : (carry as any).monthlyIncomeMax,
        annualIncomeMin: x.annualIncomeMin != null ? Number(x.annualIncomeMin) : (carry as any).annualIncomeMin,
        annualIncomeMax: x.annualIncomeMax != null ? Number(x.annualIncomeMax) : (carry as any).annualIncomeMax,
        roiNotes: x.roiNotes ? String(x.roiNotes) : undefined,
        vibeTitle: x.vibeTitle ? String(x.vibeTitle) : undefined,
        vibeBlurb: x.vibeBlurb ? String(x.vibeBlurb) : undefined,
        mapUrl: x.mapUrl ? String(x.mapUrl) : undefined,
        redfinUrl: x.redfinUrl ? String(x.redfinUrl) : undefined,
        homeImageUrl: x.homeImageUrl ? String(x.homeImageUrl) : undefined,
      };


      const cleaned: Home[] = parsed
        .filter((x) => x && typeof x === "object")
      .map((x: any) => {
  const price =
    x.price != null && Number.isFinite(Number(x.price))
      ? Number(x.price)
      : undefined;

  const carry =
    price != null
      ? estimatePaymentRange(price)
      : {};

  return {
    id: String(x.id ?? slug(String(x.title ?? ""))),
    region: String(x.region ?? "Uncategorized"),
    title: String(x.title ?? ""),

    beds: x.beds != null ? Number(x.beds) : undefined,
    baths: x.baths != null ? Number(x.baths) : undefined,
    sqft: x.sqft != null ? Number(x.sqft) : undefined,
    price,

    // Preserve user-entered values if present; otherwise auto-calc
    monthlyIncomeMin:
      x.monthlyIncomeMin != null
        ? Number(x.monthlyIncomeMin)
        : (carry as any).monthlyIncomeMin,

    monthlyIncomeMax:
      x.monthlyIncomeMax != null
        ? Number(x.monthlyIncomeMax)
        : (carry as any).monthlyIncomeMax,

    annualIncomeMin:
      x.annualIncomeMin != null
        ? Number(x.annualIncomeMin)
        : (carry as any).annualIncomeMin,

    annualIncomeMax:
      x.annualIncomeMax != null
        ? Number(x.annualIncomeMax)
        : (carry as any).annualIncomeMax,

    roiNotes: x.roiNotes ? String(x.roiNotes) : undefined,
    vibeTitle: x.vibeTitle ? String(x.vibeTitle) : undefined,
    vibeBlurb: x.vibeBlurb ? String(x.vibeBlurb) : undefined,
    mapUrl: x.mapUrl ? String(x.mapUrl) : undefined,
    redfinUrl: x.redfinUrl ? String(x.redfinUrl) : undefined,
    homeImageUrl: x.homeImageUrl ? String(x.homeImageUrl) : undefined,
  };
})

        .filter((h) => h.id && h.region && h.title);

      if (cleaned.length === 0) {
        setReport("No valid homes found. Each home needs at least: id + title.");
        return;
      }

      applyHomes(cleaned, `Replaced homes with JSON: ${cleaned.length} homes saved.`);
    } catch (e: any) {
      setReport(`JSON parse error: ${e?.message ?? String(e)}`);
    }
  }

  function applyCSVImport() {
    const rows = parseCSVorTSV(csvText);
    if (rows.length === 0) {
      setReport("No rows found. Make sure there is a header row + at least one data row.");
      return;
    }
function estimatePaymentRange(price: number) {
  // Estimated MONTHLY principal+interest on a 30yr fixed
  // Assumptions: 25% down (75% loan), 6.5%–7.5% rate range
  const loan = price * 0.75;
  const n = 360;

  const payment = (rate: number) => {
    const r = rate / 12;
    return (loan * r) / (1 - Math.pow(1 + r, -n));
  };

  const min = payment(0.065);
  const max = payment(0.075);

  const round100 = (x: number) => Math.round(x / 100) * 100;
  const monthlyMin = round100(min);
  const monthlyMax = round100(max);

  return {
    monthlyIncomeMin: monthlyMin,
    monthlyIncomeMax: monthlyMax,
    annualIncomeMin: monthlyMin * 12,
    annualIncomeMax: monthlyMax * 12,
  };
}
    const byId = new Map<string, Home>(homes.map((h) => [h.id, h]));
    let updated = 0;
    let added = 0;
    let skipped = 0;

    const num = (v: string) => {
      const t = (v ?? "").trim();
      if (!t) return undefined;
      const n = Number(t.replace(/[$,]/g, ""));
      return Number.isFinite(n) ? n : undefined;
    };

    for (const r of rows) {
      const id = (r.id || r.ID || r.Id || "").trim();
      const title = (r.title || r.Title || "").trim();
      const region = (r.region || r.Region || "Uncategorized").trim();

      if (!id || !title) {
        skipped++;
        continue;
      }

      const patch: Home = {
        id,
        title,
        region,
        beds: num(r.beds ?? r.Beds ?? "") as any,
        baths: num(r.baths ?? r.Baths ?? "") as any,
        sqft: num(r.sqft ?? r.Sqft ?? r.SQFT ?? "") as any,
        price: num(r.price ?? r.Price ?? "") as any,
        monthlyIncomeMin: num(r.monthlyIncomeMin ?? "") as any,
        monthlyIncomeMax: num(r.monthlyIncomeMax ?? "") as any,
        annualIncomeMin: num(r.annualIncomeMin ?? "") as any,
        annualIncomeMax: num(r.annualIncomeMax ?? "") as any,
        roiNotes: (r.roiNotes ?? r.ROINotes ?? r.roi_notes ?? "").trim() || undefined,
        vibeTitle: (r.vibeTitle ?? r.vibe_title ?? "").trim() || undefined,
        vibeBlurb: (r.vibeBlurb ?? r.vibe_blurb ?? "").trim() || undefined,
        mapUrl: (r.mapUrl ?? r.map_url ?? "").trim() || undefined,
        redfinUrl: (r.redfinUrl ?? r.redfin_url ?? "").trim() || undefined,
        homeImageUrl: (r.homeImageUrl ?? r.imageUrl ?? r.heroImageUrl ?? "").trim() || undefined,
      };

      const existing = byId.get(id);
      if (existing) {
        byId.set(id, { ...existing, ...patch });
        updated++;
      } else {
        byId.set(id, patch);
        added++;
      }
    }

    const next = Array.from(byId.values());
    applyHomes(
      next,
      `CSV import done. Updated: ${updated}, Added: ${added}, Skipped: ${skipped}. Total: ${next.length}.`
    );
  }

  function applyHeroImport() {
    const lines = heroesText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setReport("No lines found. Paste: id | https://...jpg");
      return;
    }

    const overrides = { ...(heroOverridesRef.current || {}) };
    let saved = 0;
    let bad = 0;

    for (const line of lines) {
      const parts = line.split(/\s*(\||,|:|\t)\s*/);
      const id = (parts[0] ?? "").trim();
      const url = (parts[2] ?? parts[1] ?? "").trim();
      if (!id || !url || !looksLikeImageUrl(url)) {
        bad++;
        continue;
      }
      overrides[id] = url;
      saved++;
    }

    heroOverridesRef.current = overrides;
    localStorage.setItem(LS_HERO_OVERRIDES, JSON.stringify(overrides));
    setReport(`Hero import done. Saved: ${saved}, Skipped: ${bad}.`);
  }

  function clearLocalEdits() {
    localStorage.removeItem(LS_HOMES);
    localStorage.removeItem(LS_HERO_OVERRIDES);
    heroOverridesRef.current = {};
    setRatings({});
    setHomes(DEFAULT_HOMES);
    setReport("Cleared local edits. Back to DEFAULT_HOMES.");
  }

  return (
    <div className="pp-page">
      <header className="pp-top">
        <div className="pp-top-left">
          <h1 className="pp-title">Property Portfolio</h1>
          <p className="pp-subtitle">A family space for vibes, math, and decisions.</p>
        </div>

        <div className="pp-top-right">
          <div className="pp-control">
            <label className="pp-label" htmlFor="region">
              Region
            </label>
            <select
              id="region"
              className="pp-select"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <button className="pp-btn" onClick={toggleTheme}>
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>

          <button className="pp-btn pp-btn-primary" onClick={() => window.print()}>
            Print Storybook PDF
          </button>

          <button className="pp-btn" onClick={() => openManage("json")}>
            Manage homes
          </button>
        </div>
      </header>

      <main className="pp-main">
        {homes.length === 0 ? (
          <div className="pp-empty">
            <h2>No homes yet</h2>
            <p>Click “Manage homes” to paste JSON or import CSV.</p>
            <button className="pp-btn pp-btn-primary" onClick={() => openManage("json")}>
              Add homes
            </button>
          </div>
        ) : (
          grouped.map(([region, list]) => (
            <section key={region} className="pp-region" id={`region-${slug(region)}`}>
              <div className="pp-region-head">
                <h2 className="pp-region-title">{region}</h2>
                <div className="pp-region-count">{list.length} homes</div>
              </div>

              <div className="pp-grid">
                {list.map((h) => (
                  <article key={h.id} className="pp-card">
                    <div className="pp-hero">
                      <img src={heroFor(h)} alt={h.title} loading="lazy" />
                      <div className="pp-hero-actions">
                        <button
                          className="pp-like"
                          title="Favorite (placeholder)"
                          onClick={() => alert("Favorites can be added next 🙂")}
                        >
                          ♡
                        </button>
                      </div>
                    </div>

                    <div className="pp-card-body">
                      <div className="pp-card-title">{h.title}</div>

                      <div className="pp-meta">
                        <span>{h.beds != null ? `${h.beds} bd` : "— bd"}</span>
                        <span>•</span>
                        <span>{h.baths != null ? `${h.baths} ba` : "— ba"}</span>
                        <span>•</span>
                        <span>{h.sqft != null ? `${h.sqft.toLocaleString()} sqft` : "— sqft"}</span>
                      </div>

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

                      {h.roiNotes ? (
                        <div className="pp-roi">
                          <strong>ROI Notes:</strong> {h.roiNotes}
                        </div>
                      ) : null}

                      {(h.vibeTitle || h.vibeBlurb) && (
                        <div className="pp-vibe">
                          <div className="pp-vibe-title">{h.vibeTitle ?? "Vibe"}</div>
                          <div className="pp-vibe-blurb">{h.vibeBlurb ?? ""}</div>

						<StarRating value={ratings[h.id] ?? 0} onChange={(v) => setRating(h.id, v)} />
                        </div>
                      )}

                      <div className="pp-actions">
                        <a className="pp-linkbtn" href={h.mapUrl || "#"} target="_blank" rel="noreferrer">
                          Open in Maps
                        </a>
                        <a
                          className="pp-linkbtn pp-linkbtn-primary"
                          href={h.redfinUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open in Redfin
                        </a>
                      </div>

                      {/* ID removed from visible UI */}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {isManageOpen && (
        <div className="pp-modal-backdrop" onMouseDown={() => setIsManageOpen(false)}>
          <div className="pp-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="pp-modal-head">
              <div>
                <div className="pp-modal-title">Manage homes</div>
                <div className="pp-modal-sub">
                  Updates save to your browser (localStorage). Use Export to commit into your repo later.
                </div>
              </div>
              <button className="pp-btn" onClick={() => setIsManageOpen(false)}>
                Close
              </button>
            </div>

            <div className="pp-tabs">
              <button
                className={`pp-tab ${manageTab === "json" ? "active" : ""}`}
                onClick={() => setManageTab("json")}
              >
                Paste JSON (replace)
              </button>
              <button
                className={`pp-tab ${manageTab === "csv" ? "active" : ""}`}
                onClick={() => setManageTab("csv")}
              >
                CSV/TSV (add or update)
              </button>
              <button
                className={`pp-tab ${manageTab === "heroes" ? "active" : ""}`}
                onClick={() => setManageTab("heroes")}
              >
                Hero images
              </button>
              <button
                className={`pp-tab ${manageTab === "export" ? "active" : ""}`}
                onClick={() => setManageTab("export")}
              >
                Export
              </button>
            </div>

            <div className="pp-modal-body">
              {manageTab === "json" && (
                <>
                  <p className="pp-help">
                    Paste an array of homes. Must include at least <code>id</code> + <code>title</code>.
                  </p>
                  <textarea
                    className="pp-textarea"
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    spellCheck={false}
                  />
                  <div className="pp-row">
                    <button className="pp-btn pp-btn-primary" onClick={applyJSONReplace}>
                      Replace homes
                    </button>
                    <button className="pp-btn" onClick={clearLocalEdits}>
                      Reset to defaults
                    </button>
                  </div>
                </>
              )}

              {manageTab === "csv" && (
                <>
                  <p className="pp-help">
                    Paste CSV or TSV with headers. Required: <code>id</code>, <code>title</code>.
                  </p>
                  <textarea
                    className="pp-textarea"
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    spellCheck={false}
                  />
                  <div className="pp-row">
                    <button className="pp-btn pp-btn-primary" onClick={applyCSVImport}>
                      Import CSV/TSV
                    </button>
                    <button
                      className="pp-btn"
                      onClick={() => {
                        const sample = homes
                          .slice(0, 12)
                          .map((h) => `${h.id}\t${h.region}\t${h.title}`)
                          .join("\n");
                        navigator.clipboard.writeText(sample);
                        setReport("Copied sample ids/regions/titles to clipboard.");
                      }}
                    >
                      Copy ID cheat-sheet
                    </button>
                  </div>
                </>
              )}

              {manageTab === "heroes" && (
                <>
                  <p className="pp-help">
                    Paste lines like: <code>lakehurst-loop | https://...jpg</code> (direct image URLs).
                  </p>
                  <textarea
                    className="pp-textarea"
                    value={heroesText}
                    onChange={(e) => setHeroesText(e.target.value)}
                    spellCheck={false}
                  />
                  <div className="pp-row">
                    <button className="pp-btn pp-btn-primary" onClick={applyHeroImport}>
                      Apply hero images
                    </button>
                    <button
                      className="pp-btn"
                      onClick={() => {
                        localStorage.removeItem(LS_HERO_OVERRIDES);
                        heroOverridesRef.current = {};
                        setReport("Cleared hero overrides.");
                      }}
                    >
                      Clear hero overrides
                    </button>
                  </div>
                </>
              )}

              {manageTab === "export" && (
                <>
                  <p className="pp-help">Copy your current homes JSON.</p>
                  <textarea
                    className="pp-textarea"
                    value={JSON.stringify(homes, null, 2)}
                    readOnly
                    spellCheck={false}
                  />
                  <div className="pp-row">
                    <button
                      className="pp-btn pp-btn-primary"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(homes, null, 2));
                        setReport("Copied homes JSON to clipboard.");
                      }}
                    >
                      Copy to clipboard
                    </button>
                    <button className="pp-btn" onClick={clearLocalEdits}>
                      Reset to defaults
                    </button>
                  </div>
                </>
              )}

              {report && <div className="pp-report">{report}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
