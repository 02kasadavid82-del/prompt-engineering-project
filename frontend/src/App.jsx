import { useEffect, useMemo, useState } from "react";
import Quiz from "./Quiz.jsx";
import Result from "./Result.jsx";

export default function App() {
  const [screen, setScreen] = useState("start"); // start | quiz | result
  const [allDilemmas, setAllDilemmas] = useState([]);
  const [quizDilemmas, setQuizDilemmas] = useState([]);
  const [loadingDilemmas, setLoadingDilemmas] = useState(false);
  const [dilemmasError, setDilemmasError] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // { dilemmaId, optionText, tags }

  const total = quizDilemmas.length || 10;

  function getSeenIds() {
    try {
      const raw = localStorage.getItem("seenDilemmaIds");
      const arr = JSON.parse(raw || "[]");
      return Array.isArray(arr) ? arr.filter((n) => Number.isInteger(n)) : [];
    } catch {
      return [];
    }
  }

  function saveSeenIds(ids) {
    try {
      localStorage.setItem("seenDilemmaIds", JSON.stringify(ids));
    } catch {
      // ignore
    }
  }

  function pickQuizDilemmas(all, count) {
    const seen = new Set(getSeenIds());

    const unseen = all.filter((d) => !seen.has(d.id));
    const alreadySeen = all.filter((d) => seen.has(d.id));

    function shuffled(arr) {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    const picked = [...shuffled(unseen), ...shuffled(alreadySeen)].slice(0, count);
    return picked;
  }

  const tagCounts = useMemo(() => {
    const counts = {};
    for (const a of answers) {
      for (const t of a.tags || []) counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }, [answers]);

  async function fetchDilemmas() {
    setLoadingDilemmas(true);
    setDilemmasError("");
    try {
      const res = await fetch("/api/dilemmas");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setAllDilemmas(arr);
    } catch (e) {
      setDilemmasError("Could not load dilemmas. Is the backend running?");
    } finally {
      setLoadingDilemmas(false);
    }
  }

  useEffect(() => {
    // Preload once so "Start" feels instant if backend is up.
    fetchDilemmas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seenCount = useMemo(() => getSeenIds().length, [screen]);
  const unseenCount = Math.max(0, allDilemmas.length - seenCount);

  function startQuiz() {
    if (!allDilemmas.length) return;
    const picked = pickQuizDilemmas(allDilemmas, 10);
    setQuizDilemmas(picked);
    setAnswers([]);
    setCurrentIndex(0);
    setScreen("quiz");
  }

  function restart() {
    setAnswers([]);
    setCurrentIndex(0);
    setQuizDilemmas([]);
    setScreen("start");
  }

  function onAnswerSelected(dilemma, option) {
    const next = [
      ...answers,
      { dilemmaId: dilemma.id, optionText: option.text, tags: option.tags || [] }
    ];
    setAnswers(next);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= quizDilemmas.length) {
      const seen = new Set(getSeenIds());
      for (const d of quizDilemmas) seen.add(d.id);
      saveSeenIds(Array.from(seen));
      setScreen("result");
    } else {
      setCurrentIndex(nextIndex);
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="brandTitle">Ethical Decision Simulator</div>
          <div className="brandSub">Dilemma-based reflection • 10 questions per run</div>
        </div>
      </header>

      <main className="container">
        {screen === "start" && (
          <section className="landing cardEnter">
            <div className="landingHero">
              <div className="landingKicker">A 2‑minute decision-style snapshot</div>
              <h1 className="landingTitle">Ethical Decision Simulator</h1>
              <p className="landingLead">
                Answer <strong>10 curated dilemmas</strong> in a clean, fast flow. Then get a structured
                profile that explains how you tend to weigh <strong>fairness</strong>,{" "}
                <strong>risk</strong>, <strong>rules</strong>, and <strong>outcomes</strong>.
              </p>

              {dilemmasError ? <p className="error">{dilemmasError}</p> : null}

              <div className="valueRow" aria-label="Highlights">
                <div className="valuePill">
                  <div className="valueTop">10</div>
                  <div className="valueBot">questions</div>
                </div>
                <div className="valuePill">
                  <div className="valueTop">~2 min</div>
                  <div className="valueBot">to finish</div>
                </div>
                <div className="valuePill">
                  <div className="valueTop">Instant</div>
                  <div className="valueBot">profile</div>
                </div>
              </div>

              <div className="actions landingActions">
                <button
                  className="btn primary btnLg"
                  onClick={startQuiz}
                  disabled={loadingDilemmas || allDilemmas.length === 0}
                >
                  {loadingDilemmas ? "Loading…" : "Start a 10‑question run"}
                </button>
              </div>
            </div>

            <div className="landingPanel">
              <div className="panelTitle">How it works</div>
              <ol className="steps">
                <li>
                  <div className="stepTitle">Answer 10 dilemmas</div>
                  <div className="stepText">Pick what you’d do. Move forward. No backtracking needed.</div>
                </li>
                <li>
                  <div className="stepTitle">Get your profile</div>
                  <div className="stepText">A headline + summary, then 3–4 scored themes with plain-language explanations.</div>
                </li>
                <li>
                  <div className="stepTitle">Come back later</div>
                  <div className="stepText">New runs prioritize dilemmas you haven’t seen yet.</div>
                </li>
              </ol>

              <div className="panelDivider" aria-hidden="true" />

              <div className="panelTitleSm">What you get</div>
              <div className="panelGrid">
                <div className="panelCard">
                  <div className="panelLabel">Clarity</div>
                  <div className="panelText">See which trade-offs you default to when choices get messy.</div>
                </div>
                <div className="panelCard">
                  <div className="panelLabel">Perspective</div>
                  <div className="panelText">Understand the patterns behind your “why”, not just your answers.</div>
                </div>
              </div>

              <p className="hint">
                {allDilemmas.length
                  ? "Tip: each new run prioritizes dilemmas you haven’t seen."
                  : "Start the backend to load dilemmas."}
              </p>
            </div>
          </section>
        )}

        {screen === "quiz" && (
          <Quiz
            dilemmas={quizDilemmas}
            currentIndex={currentIndex}
            total={total}
            onSelectOption={onAnswerSelected}
          />
        )}

        {screen === "result" && (
          <Result answers={answers} tagCounts={tagCounts} onRestart={restart} />
        )}
      </main>

      <footer className="footer">
        <span>Local dilemmas • AI analysis</span>
      </footer>
    </div>
  );
}

