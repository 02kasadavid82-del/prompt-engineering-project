import { useEffect, useMemo, useState } from "react";
import {
  FaBalanceScale,
  FaHeart,
  FaGavel,
  FaRegLightbulb,
  FaShieldAlt,
  FaHandsHelping,
  FaLeaf,
  FaFlag,
  FaBullseye,
  FaExclamationTriangle
} from "react-icons/fa";

export default function Result({ answers, tagCounts, onRestart }) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  const formatTagLabel = useMemo(() => {
    const titleCase = (s) =>
      String(s)
        .split(" ")
        .filter(Boolean)
        .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
        .join(" ");

    return (tag) => titleCase(String(tag).replace(/_/g, " "));
  }, []);

  const dominantTags = useMemo(() => {
    const entries = Object.entries(tagCounts || {}).sort((a, b) => b[1] - a[1]);
    return entries.slice(0, 8).map(([t]) => t);
  }, [tagCounts]);

  function iconForCategoryName(name) {
    const s = String(name || "").toLowerCase();
    if (s.includes("risk")) return <FaRegLightbulb />;
    if (s.includes("fair") || s.includes("justice")) return <FaBalanceScale />;
    if (s.includes("rule") || s.includes("duty")) return <FaGavel />;
    if (s.includes("empath") || s.includes("care") || s.includes("compassion")) return <FaHeart />;
    if (s.includes("integrity") || s.includes("honest")) return <FaShieldAlt />;
    if (s.includes("loyal")) return <FaFlag />;
    if (s.includes("respons")) return <FaHandsHelping />;
    if (s.includes("environment") || s.includes("sustain")) return <FaLeaf />;
    if (s.includes("pragmat") || s.includes("ideal")) return <FaBullseye />;
    return <FaRegLightbulb />;
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");
      setAnalysis(null);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, tagCounts })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
        if (!cancelled) setAnalysis(data.analysis || null);
      } catch (e) {
        if (!cancelled) {
          setError("Could not fetch analysis. Check backend logs and OPENAI_API_KEY.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [answers, tagCounts]);

  return (
    <section className="card">
      <h2 className="titleSm">Your analysis</h2>

      {loading ? (
        <div className="loading">
          <div className="spinner" aria-label="Loading" />
          <div>Analyzing your answers…</div>
        </div>
      ) : error ? (
        <p className="error">{error}</p>
      ) : analysis ? (
        <div className="resultGrid">
          <div className="summaryCard">
            {analysis.headline ? <div className="headline">{analysis.headline}</div> : null}
            <div className="summaryTitle">Summary</div>
            <div className="summaryText">{analysis.summary}</div>
            {dominantTags.length ? (
              <div className="dominantTags">
                {dominantTags.map((t) => (
                  <span className="chip" key={t}>
                    {formatTagLabel(t)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {Array.isArray(analysis.categories) && analysis.categories.length ? (
            <div className="tiles">
              {analysis.categories.map((cat, idx) => (
                <div className="tile" key={`${cat.name}-${idx}`}>
                  <div className="tileIcon">{iconForCategoryName(cat.name)}</div>
                  <div className="tileBody">
                    <div className="tileTop">
                      <div className="tileLabel">{cat.name}</div>
                      <div className="tileScore" aria-label={`Score ${cat.score} out of 100`}>
                        {Number.isFinite(cat.score) ? `${cat.score}%` : ""}
                      </div>
                    </div>
                    <div className="meter" aria-hidden="true">
                      <div
                        className="meterFill"
                        style={{
                          width: `${Math.max(0, Math.min(100, Number(cat.score) || 0))}%`
                        }}
                      />
                    </div>
                    <div className="tileText">{cat.description}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {Array.isArray(analysis.watchOutFor) && analysis.watchOutFor.length ? (
            <div className="watchCard">
              <div className="watchTitle">
                <span className="watchIcon">
                  <FaExclamationTriangle />
                </span>
                Watch-outs
              </div>
              <ul className="watchList">
                {analysis.watchOutFor.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="error">No analysis returned.</p>
      )}

      <div className="actions">
        <button className="btn primary" onClick={onRestart} type="button">
          Restart
        </button>
      </div>
    </section>
  );
}

