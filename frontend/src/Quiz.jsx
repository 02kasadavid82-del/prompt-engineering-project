export default function Quiz({ dilemmas, currentIndex, total, onSelectOption }) {
  const dilemma = dilemmas[currentIndex];
  const progressPct = total ? Math.round(((currentIndex + 1) / total) * 100) : 0;

  if (!dilemma) {
    return (
      <section className="quizShell cardEnter">
        <div className="quizCard">
          <span className="quizPrompt">No dilemma loaded</span>
          <p className="body muted">Please go back and reload the inquiry.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="quizShell cardEnter" aria-live="polite">
      <div className="progressBlock">
        <div className="progressHeader">
          <span className="progressText">The Dilemma · Series I</span>
          <span className="progressPct">
            {String(currentIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
        <div className="progressBar" aria-hidden="true">
          <div className="progressFill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <article className="quizCard">
        <span className="quizPrompt">Question {currentIndex + 1}</span>
        <h2 className="scenario">{dilemma.scenario}</h2>

        <p className="scenarioPull">
          What would you actually do — not what you would defend in argument?
        </p>

        <div className="options optionsGrid" role="radiogroup" aria-label="Choose a response">
          {dilemma.options.map((opt, i) => (
            <button
              key={opt.text}
              className="optionTile"
              onClick={() => onSelectOption(dilemma, opt)}
              type="button"
              role="radio"
              aria-checked="false"
            >
              <div className="optionTileInner">
                <span className="optionMeta">Choice {String.fromCharCode(65 + i)}</span>
                <span className="optionTitle">{opt.text}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="quizFooter">
          <span className="progressText">Selecting will advance.</span>
          <span className="progressText">Local & private</span>
        </div>
      </article>
    </section>
  );
}
