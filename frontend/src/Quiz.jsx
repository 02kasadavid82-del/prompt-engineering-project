export default function Quiz({ dilemmas, currentIndex, total, onSelectOption }) {
  const dilemma = dilemmas[currentIndex];
  const progressPct = total ? Math.round(((currentIndex + 1) / total) * 100) : 0;

  if (!dilemma) {
    return (
      <section className="card cardEnter">
        <h2 className="titleSm">No dilemma loaded</h2>
        <p className="subtitle">Please go back and reload.</p>
      </section>
    );
  }

  return (
    <section className="quizShell cardEnter">
      <div className="quizHeader">
        <div className="quizProgress">
          <div className="progressHeader">
            <div className="progressText">
              Question <strong>{currentIndex + 1}</strong> / <strong>{total}</strong>
            </div>
            <div className="progressPct">{progressPct}%</div>
          </div>
          <div className="progressBar" aria-hidden="true">
            <div className="progressFill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <div className="quizCard">
        <div className="quizPrompt">Dilemma</div>
        <h2 className="scenario">{dilemma.scenario}</h2>

        <div className="options optionsGrid">
          {dilemma.options.map((opt) => (
            <button
              key={opt.text}
              className="optionTile"
              onClick={() => onSelectOption(dilemma, opt)}
              type="button"
            >
              <div className="optionTileInner">
                <div className="optionTitle">{opt.text}</div>
                <div className="optionMeta">Select</div>
              </div>
            </button>
          ))}
        </div>

        <p className="hint">Choose one option to continue. Your selection is recorded locally.</p>
      </div>
    </section>
  );
}

