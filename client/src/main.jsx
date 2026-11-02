import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadQuestions() {
    setLoading(true);
    setError("");
    setResult(null);
    setAnswers({});
    try {
      const response = await fetch("/api/questions");
      if (!response.ok) throw new Error("Could not load questions");
      setQuestions(await response.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  async function submitExam() {
    if (Object.keys(answers).length !== questions.length) {
      setError("Please answer every question before submitting.");
      return;
    }
    setError("");
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    if (!response.ok) throw new Error("Could not submit the examination");
    setResult(await response.json());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <main className="app-shell">
      <header>
        <div className="brand"><span className="brand-mark">E</span> Examora</div>
        <div className="session">Live examination</div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">GENERAL KNOWLEDGE</p>
          <h1>{result ? "Examination results" : "MCQ Examination"}</h1>
        </div>
        {!result && !loading && (
          <div className="progress-wrap">
            <span>{answeredCount}/{questions.length} answered</span>
            <div className="progress"><div style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }} /></div>
          </div>
        )}
      </section>

      {error && <div className="alert">{error}</div>}
      {loading && <div className="loading">Loading examination...</div>}

      {!loading && result && (
        <section className="result-card">
          <div className={`score-ring ${result.percentage >= 60 ? "pass" : "retry"}`}>
            <strong>{result.percentage}%</strong>
            <span>{result.score}/{result.total}</span>
          </div>
          <div>
            <p className="eyebrow">FINAL SCORE</p>
            <h2>{result.percentage >= 60 ? "Great work!" : "Keep practicing!"}</h2>
            <p>You answered {result.score} out of {result.total} questions correctly.</p>
            <button className="primary" onClick={loadQuestions}>Try again</button>
          </div>
        </section>
      )}

      {!loading && result && (
        <div className="question-list">
          {result.results.map((item, index) => (
            <article className="question-card" key={item.questionId}>
              <div className="question-heading">
                <span className="number">Q{index + 1}</span>
                <span className={`status ${item.isCorrect ? "correct" : "wrong"}`}>{item.isCorrect ? "Correct" : "Incorrect"}</span>
              </div>
              <h3>{item.question}</h3>
              <div className="options review">
                {item.options.map((option, optionIndex) => (
                  <div key={option} className={`option ${optionIndex === item.correctAnswer ? "right-answer" : ""} ${optionIndex === item.selectedAnswer && !item.isCorrect ? "wrong-answer" : ""}`}>
                    <span>{String.fromCharCode(65 + optionIndex)}</span>{option}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !result && (
        <>
          <div className="question-list">
            {questions.map((question, index) => (
              <article className="question-card" key={question._id}>
                <div className="question-heading">
                  <span className="number">Q{index + 1}</span>
                  <span>Choose one answer</span>
                </div>
                <h3>{question.question}</h3>
                <div className="options">
                  {question.options.map((option, optionIndex) => (
                    <label className={answers[question._id] === optionIndex ? "selected" : ""} key={option}>
                      <input
                        type="radio"
                        name={question._id}
                        checked={answers[question._id] === optionIndex}
                        onChange={() => setAnswers((current) => ({ ...current, [question._id]: optionIndex }))}
                      />
                      <span className="letter">{String.fromCharCode(65 + optionIndex)}</span>
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <button className="primary submit" onClick={submitExam} disabled={!questions.length}>
            Submit examination <span>→</span>
          </button>
        </>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
