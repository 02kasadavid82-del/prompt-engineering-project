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

function titleCase(s) {
  return String(s)
    .split(" ")
    .filter(Boolean)
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Result({ answers, tagCounts, onRestart }) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  const formatTagLabel = (tag) => titleCase(String(tag).replace(/_/g, " "));

  const dominantTags = useMemo(() => {
    const entries = Object.entries(tagCounts || {}).sort((a, b) => b[1] - a[1]);
    return entries.slice(0, 6).map(([t]) => t);
  }, [tagCounts]);

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
      } catch {
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
    <section className="cardEnter">
      <header className="resultHeader">
        <span className="kicker">Moral Reading · v1</span>
        <h1 className="display">Your Moral Compass</h1>
        <p className="lead muted">
          A distillation of your ten responses - the lenses you reached for, and the
          ones you set aside.
        </p>
      </header>

      {loading ? (
        <div className="card">
          <div className="loading">
            <span className="spinner" aria-label="Loading" />
            <span>Reading your responses…</span>
          </div>
        </div>
      ) : error ? (
        <div className="card">
          <p className="error">{error}</p>
          <div className="actions">
            <button className="btn ghost" onClick={onRestart} type="button">
              <span>Restart</span>
            </button>
          </div>
        </div>
      ) : analysis ? (
        <ResultBody
          analysis={analysis}
          answers={answers}
          dominantTags={dominantTags}
          formatTagLabel={formatTagLabel}
          onRestart={onRestart}
        />
      ) : (
        <p className="error">No analysis returned.</p>
      )}
    </section>
  );
}

function ResultBody({
  analysis,
  answers,
  dominantTags,
  formatTagLabel,
  onRestart
}) {
  const categories = Array.isArray(analysis.categories) ? analysis.categories : [];
  const watchOuts = Array.isArray(analysis.watchOutFor) ? analysis.watchOutFor : [];

  const topTheme = useMemo(() => {
    if (!categories.length) return null;
    return [...categories].sort(
      (a, b) => (Number(b.score) || 0) - (Number(a.score) || 0)
    )[0];
  }, [categories]);

  const topThemeScore = topTheme && Number.isFinite(Number(topTheme.score))
    ? `${Math.max(0, Math.min(100, Number(topTheme.score)))}`
    : "—";

  return (
    <div className="resultGrid">
      <div className="bento">
        <article className="summaryCard bentoMain">
          <span className="summaryTitle">Philosophical Alignment</span>
          {analysis.headline ? <h2 className="headline">{analysis.headline}</h2> : null}
          {analysis.summary ? (
            <p className="summaryQuote">{firstSentence(analysis.summary)}</p>
          ) : null}
          {analysis.summary ? (
            <p className="summaryText">{remainingSentences(analysis.summary)}</p>
          ) : null}
          {dominantTags.length ? (
            <div className="dominantTags">
              {dominantTags.map((t) => (
                <span className="chip" key={t}>{formatTagLabel(t)}</span>
              ))}
            </div>
          ) : null}
        </article>

        <aside className="metricsCard bentoSide">
          <span className="metricsTitle">At a glance</span>
          <div className="metricRow">
            <span className="metricLabel">Questions answered</span>
            <span className="metricValue">{answers.length}</span>
          </div>
          <div className="metricRow">
            <span className="metricLabel">Top theme</span>
            <span className="metricValue metricValueSm">
              {topTheme ? topTheme.name : "—"}
            </span>
          </div>
          <div className="metricRow">
            <span className="metricLabel">Strongest score</span>
            <span className="metricValue">{topThemeScore}</span>
          </div>
        </aside>
      </div>

      {categories.length ? (
        <div className="tiles">
          {categories.map((cat, idx) => {
            const score = Math.max(0, Math.min(100, Number(cat.score) || 0));
            return (
              <article className="tile" key={`${cat.name}-${idx}`}>
                <span className="tileIcon" aria-hidden="true">
                  {iconForCategoryName(cat.name)}
                </span>
                <div className="tileBody">
                  <div className="tileTop">
                    <h3 className="tileLabel">{cat.name}</h3>
                    <span className="tileScore" aria-label={`Score ${score} of 100`}>
                      {Number.isFinite(cat.score) ? `${score}` : ""}
                    </span>
                  </div>
                  <div className="meter" aria-hidden="true">
                    <div className="meterFill" style={{ width: `${score}%` }} />
                  </div>
                  <p className="tileText">{cat.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {watchOuts.length ? (
        <div className="watchCard">
          <span className="watchTitle">
            <span className="watchIcon" aria-hidden="true">
              <FaExclamationTriangle />
            </span>
            Watch-outs
          </span>
          <ul className="watchList">
            {watchOuts.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="reflectionCard">
        <p className="reflectionQuote">
          “The unexamined life is not worth living — but the examined life is rarely
          comfortable.”
        </p>
        <span className="reflectionCite">— A Reflection</span>
      </div>

      <div className="actions">
        <button className="btn primary" onClick={onRestart} type="button">
          <span>Begin Again</span>
          <span className="arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

function firstSentence(text) {
  const m = String(text).match(/^[^.!?]+[.!?]/);
  return m ? m[0].trim() : String(text);
}

function remainingSentences(text) {
  const first = firstSentence(text);
  const rest = String(text).slice(first.length).trim();
  return rest || "";
}
