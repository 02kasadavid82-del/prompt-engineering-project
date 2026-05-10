import { useEffect, useMemo, useState } from "react";
import Quiz from "./Quiz.jsx";
import Result from "./Result.jsx";

const QUIZ_LENGTH = 10;

export default function App() {
  const [screen, setScreen] = useState("start"); // start | quiz | result
  const [allDilemmas, setAllDilemmas] = useState([]);
  const [quizDilemmas, setQuizDilemmas] = useState([]);
  const [loadingDilemmas, setLoadingDilemmas] = useState(false);
  const [dilemmasError, setDilemmasError] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);

  const total = quizDilemmas.length || QUIZ_LENGTH;

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

    return [...shuffled(unseen), ...shuffled(alreadySeen)].slice(0, count);
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
      setAllDilemmas(Array.isArray(data) ? data : []);
    } catch {
      setDilemmasError("Could not load dilemmas. Is the backend running?");
    } finally {
      setLoadingDilemmas(false);
    }
  }

  useEffect(() => {
    fetchDilemmas();
  }, []);

  function startQuiz() {
    if (!allDilemmas.length) return;
    setQuizDilemmas(pickQuizDilemmas(allDilemmas, QUIZ_LENGTH));
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
        <div className="topbarInner">
          <div className="brand">
            <span className="brandMark">Ethical Decision Simulator</span>
            <span className="brandSub">An Inquiry</span>
          </div>
        </div>
      </header>

      <main className="container">
        {screen === "start" && (
          <StartScreen
            loading={loadingDilemmas}
            error={dilemmasError}
            ready={allDilemmas.length > 0}
            onStart={startQuiz}
          />
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
        <div className="footerInner">
          <span className="brandMark">Ethical Decision Simulator</span>
          <span>Local dilemmas · AI analysis</span>
        </div>
      </footer>
    </div>
  );
}

function StartScreen({ loading, error, ready, onStart }) {
  return (
    <section className="landing cardEnter">
      <Hero loading={loading} error={error} ready={ready} onStart={onStart} />

      <SpecsStrip />

      <Method />

      <p className="landingFootnote">
        {ready
          ? "Each new run prioritises dilemmas you have not yet seen."
          : "Start the backend to load dilemmas."}
      </p>
    </section>
  );
}

function Hero({ loading, error, ready, onStart }) {
  return (
    <div className="landingHero">
      <div className="landingCopy">
        <span className="kicker">An Ethical Inquiry</span>

        <div className="landingTitleBlock">
          <h1 className="display">A Quiet Room for Difficult Choices.</h1>
          <p className="lead">
            Step away from the noise of certainty. Answer ten curated dilemmas and
            receive a structured reading of how you tend to weigh fairness, risk,
            rules, and outcomes.
          </p>
        </div>

        <div className="editorialAccent">
          <p className="heroQuote">
            "The unexamined life is not worth living. But the examined life is
            rarely comfortable."
          </p>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <div className="actions">
          <button
            className="btn primary"
            onClick={onStart}
            disabled={loading || !ready}
            type="button"
          >
            <span>{loading ? "Loading" : "Begin Reflection"}</span>
            <span className="arrow" aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>

      <aside className="landingArt">
        <img
          className="landingArtImg"
          src="/hero-image.jpg"
          alt="A small cairn of smooth river stones and a single plumeria blossom, set in raked circular patterns of pale sand."
          loading="eager"
          decoding="async"
        />
      </aside>
    </div>
  );
}

const SPECS = [
  { label: "Length", value: "10 dilemmas" },
  { label: "Time", value: "~2 minutes" },
  { label: "Outcome", value: "A reading" }
];

function SpecsStrip() {
  return (
    <dl className="landingSpecs" aria-label="What to expect">
      {SPECS.map(({ label, value }) => (
        <div className="specsItem" key={label}>
          <dt className="specsLabel">{label}</dt>
          <dd className="specsValue">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const METHOD_STEPS = [
  {
    num: "I",
    title: "Read the dilemma",
    text: "One question at a time. No backtracking. The friction is the point."
  },
  {
    num: "II",
    title: "Choose what you would do",
    text: "Each option corresponds to a different ethical lens. You are not graded."
  },
  {
    num: "III",
    title: "Receive your reading",
    text: "A headline, a written summary, and three to four themes ranked by emphasis."
  }
];

function Method() {
  return (
    <section className="method" aria-labelledby="method-heading">
      <header className="methodHeader">
        <span className="kicker">The Method</span>
        <h2 id="method-heading" className="methodHeadline">
          Three quiet steps,<br />
          a single clear reading.
        </h2>
      </header>

      <ol className="methodSteps">
        {METHOD_STEPS.map(({ num, title, text }) => (
          <li className="methodStep" key={num}>
            <span className="methodNum" aria-hidden="true">{num}</span>
            <div className="methodBody">
              <h3 className="methodTitle">{title}</h3>
              <p className="methodText">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
