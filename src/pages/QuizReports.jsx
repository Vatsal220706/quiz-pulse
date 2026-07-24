import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './QuizReports.css';

const QuizReports = () => {
  const [summary, setSummary] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.get('/quiz-rooms/my-reports');
      setSummary(data.summary);
      const fetchedReports = data.reports || [];
      setReports(fetchedReports);
      if (fetchedReports.length > 0) {
        setSelectedQuizId(fetchedReports[0].quizId);
      }
    } catch (err) {
      setError(err.message || 'Failed to load quiz reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const activeReport = reports.find((r) => r.quizId === selectedQuizId);

  return (
    <div className="quiz-reports-container">
      {/* Header */}
      <header className="qr-header">
        <div>
          <h1 className="qr-title">📈 Quiz Reports & Diagnostic Analytics</h1>
          <p className="qr-subtitle">Question-by-question analysis, correct vs incorrect insights & topic mastery</p>
        </div>
        <button className="qr-refresh-btn" onClick={fetchReports} title="Refresh Analysis">
          🔄 Refresh Reports
        </button>
      </header>

      {error && <div className="qr-alert error">⚠️ {error}</div>}

      {loading ? (
        <div className="qr-loading">Analyzing quiz performance...</div>
      ) : reports.length === 0 ? (
        <div className="qr-empty-card glass-card">
          <div className="qr-empty-icon">📊</div>
          <h3>No Quiz Reports Available Yet</h3>
          <p>Join a live quiz room and submit answers to generate diagnostic reports and accuracy analytics!</p>
        </div>
      ) : (
        <>
          {/* SUMMARY STATS GRID */}
          <div className="qr-stats-grid animate-fade-in-up">
            <div className="qr-stat-card glass-card">
              <div className="qr-stat-icon accuracy-icon">🎯</div>
              <div className="qr-stat-body">
                <span className="qr-stat-label">Overall Accuracy</span>
                <span className="qr-stat-value accent-cyan">{summary?.overallAccuracy}%</span>
              </div>
            </div>

            <div className="qr-stat-card glass-card">
              <div className="qr-stat-icon total-icon">📝</div>
              <div className="qr-stat-body">
                <span className="qr-stat-label">Questions Attempted</span>
                <span className="qr-stat-value">{summary?.totalAttempted}</span>
              </div>
            </div>

            <div className="qr-stat-card glass-card">
              <div className="qr-stat-icon correct-icon">🟢</div>
              <div className="qr-stat-body">
                <span className="qr-stat-label">Correct Answers</span>
                <span className="qr-stat-value accent-green">{summary?.totalCorrect}</span>
              </div>
            </div>

            <div className="qr-stat-card glass-card">
              <div className="qr-stat-icon incorrect-icon">🔴</div>
              <div className="qr-stat-body">
                <span className="qr-stat-label">Incorrect Answers</span>
                <span className="qr-stat-value accent-red">{summary?.totalIncorrect}</span>
              </div>
            </div>
          </div>

          {/* QUIZ SELECTOR DROPDOWN */}
          <div className="qr-selector-card glass-card animate-fade-in-up">
            <div className="qr-selector-group">
              <label>Select Quiz Assessment Report:</label>
              <select
                className="qr-select"
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
              >
                {reports.map((r) => (
                  <option key={r.quizId} value={r.quizId}>
                    {r.title} (Code: {r.roomCode}) — Accuracy: {r.accuracy}%
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ACTIVE QUIZ DETAILED ANALYSIS */}
          {activeReport && (
            <div className="qr-analysis-section animate-fade-in-up">
              {/* Quiz Overview Banner */}
              <div className="qr-quiz-summary-card glass-card">
                <div className="qr-qs-header">
                  <div>
                    <span className="qr-code-tag">CODE: {activeReport.roomCode}</span>
                    <h2 className="qr-quiz-title">{activeReport.title}</h2>
                    <span className="qr-quiz-date">
                      📅 Date: {new Date(activeReport.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="qr-acc-badge-box">
                    <span className="qr-acc-num">{activeReport.accuracy}%</span>
                    <span className="qr-acc-label">QUIZ ACCURACY</span>
                  </div>
                </div>

                <div className="qr-qs-pills">
                  <span className="pill correct">🟢 Correct: {activeReport.correctCount}</span>
                  <span className="pill incorrect">🔴 Incorrect: {activeReport.incorrectCount}</span>
                  <span className="pill total">❓ Total Questions: {activeReport.totalQuestions}</span>
                </div>
              </div>

              {/* Question-by-Question Analysis */}
              <div className="qr-questions-analysis-list">
                <h3 className="qr-section-heading">Question-by-Question Analysis</h3>

                {activeReport.questionAnalysis.map((item, idx) => {
                  const isCorrect = item.status === 'correct';
                  const isIncorrect = item.status === 'incorrect';

                  return (
                    <div
                      key={idx}
                      className={`qr-question-card glass-card ${
                        isCorrect ? 'is-correct' : isIncorrect ? 'is-incorrect' : 'is-unanswered'
                      }`}
                    >
                      <div className="qr-qc-header">
                        <span className="qr-q-num">Question #{idx + 1}</span>

                        {isCorrect && (
                          <span className="qr-status-pill correct">🟢 CORRECT (+10 PTS)</span>
                        )}
                        {isIncorrect && (
                          <span className="qr-status-pill incorrect">🔴 INCORRECT</span>
                        )}
                        {!isCorrect && !isIncorrect && (
                          <span className="qr-status-pill unanswered">⚪ UNANSWERED / TIMED OUT</span>
                        )}
                      </div>

                      <h4 className="qr-qc-text">{item.questionText}</h4>

                      {/* Options Grid */}
                      <div className="qr-qc-options-grid">
                        {item.options.map((optText, optIdx) => {
                          const isUserSelection = item.selectedOption === optIdx;
                          const isCorrectOption = item.correctOptionIndex === optIdx;

                          let optionClass = '';
                          if (isCorrectOption) optionClass = 'correct-opt';
                          else if (isUserSelection && !isCorrect) optionClass = 'incorrect-opt';

                          return (
                            <div className={`qr-option-item ${optionClass}`} key={optIdx}>
                              <div className="qr-opt-header">
                                <span className="qr-opt-letter">Option {String.fromCharCode(65 + optIdx)}</span>
                                {isCorrectOption && <span className="qr-tag correct-tag">✓ Correct Answer</span>}
                                {isUserSelection && (
                                  <span className={`qr-tag ${isCorrect ? 'correct-tag' : 'user-tag'}`}>
                                    👉 Your Answer
                                  </span>
                                )}
                              </div>
                              <p className="qr-opt-content">{optText}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Diagnostic Insight Note */}
                      <div className={`qr-insight-box ${isCorrect ? 'success' : 'warn'}`}>
                        <span className="qr-insight-icon">{isCorrect ? '💡 Insight:' : '⚠️ Concept Note:'}</span>
                        <p className="qr-insight-text">
                          {isCorrect ? (
                            `Great job! You answered Option ${String.fromCharCode(65 + item.correctOptionIndex)} correctly.`
                          ) : isIncorrect ? (
                            `You selected Option ${String.fromCharCode(65 + item.selectedOption)}, but the correct answer is Option ${String.fromCharCode(65 + item.correctOptionIndex)} ("${item.options[item.correctOptionIndex]}"). Review this topic for better accuracy!`
                          ) : (
                            `You did not answer this question before the 30s timer expired. The correct answer was Option ${String.fromCharCode(65 + item.correctOptionIndex)}.`
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuizReports;
