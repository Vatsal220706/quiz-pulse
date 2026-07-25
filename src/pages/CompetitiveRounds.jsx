import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CompetitiveRounds.css';

const CompetitiveRounds = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  // Teacher State
  const [activeTab, setActiveTab] = useState('rounds'); // 'rounds' | 'create' | 'host'
  const [rounds, setRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState(null);
  const [hostStatusData, setHostStatusData] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, timeLimit: 30 },
  ]);

  // AI Generator State
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [daySchedule, setDaySchedule] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);

  // Student State
  const [battleCodeInput, setBattleCodeInput] = useState('');
  const [joinedRound, setJoinedRound] = useState(null);
  const [studentStatusData, setStudentStatusData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  // Review State
  const [battleReview, setBattleReview] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch teacher rounds & uploaded courses
  const fetchTeacherData = async () => {
    if (!isTeacher) return;
    try {
      setLoading(true);
      const [roundsData, coursesData] = await Promise.all([
        api.get('/competitive/teacher'),
        api.get('/courses'),
      ]);
      setRounds(roundsData.rounds || []);
      const fetchedCourses = coursesData.courses || [];
      setCourses(fetchedCourses);
      if (fetchedCourses.length > 0) {
        setSelectedCourseId(fetchedCourses[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch competitive rounds data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, [isTeacher]);

  const handleGenerateAI = async () => {
    setError('');
    setSuccess('');
    try {
      setIsGenerating(true);
      const res = await api.post('/competitive/generate-ai', {
        courseId: selectedCourseId,
        dayCount: Number(daySchedule) || 3,
      });

      if (res.title) setTitle(res.title);
      if (res.questions && Array.isArray(res.questions)) {
        setQuestions(res.questions);
        setSuccess(`✨ Generated 10 AI Speed Questions from uploaded course!`);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate AI questions');
    } finally {
      setIsGenerating(false);
    }
  };

  // Host polling
  useEffect(() => {
    if (!isTeacher || activeTab !== 'host' || !selectedRoundId) return;

    const poll = async () => {
      try {
        const data = await api.get(`/competitive/${selectedRoundId}/status`);
        setHostStatusData(data);
      } catch (err) {
        console.error('Host poll error:', err);
      }
    };

    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, [isTeacher, activeTab, selectedRoundId]);

  // Student polling
  useEffect(() => {
    if (isTeacher || !joinedRound) return;

    const poll = async () => {
      try {
        const data = await api.get(`/competitive/${joinedRound._id}/status`);
        setStudentStatusData(data);
      } catch (err) {
        console.error('Student poll error:', err);
      }
    };

    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, [isTeacher, joinedRound]);

  // Reset student selection on new question
  useEffect(() => {
    if (studentStatusData?.currentQuestion) {
      if (studentStatusData.studentResponse) {
        setSelectedOption(studentStatusData.studentResponse.selectedOption);
      } else {
        setSelectedOption(null);
        setSubmitResult(null);
      }
    }
  }, [studentStatusData?.currentQuestion?.index]);

  // Teacher Handlers
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, timeLimit: 30 },
    ]);
  };

  const handleCreateRound = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Please enter a competitive round title.');
      return;
    }

    try {
      const data = await api.post('/competitive', { title, questions });
      setSuccess(`Competitive Battle Round Created! Code: ${data.round.roomCode}`);
      setTitle('');
      setQuestions([{ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, timeLimit: 30 }]);
      fetchTeacherRounds();
      setTimeout(() => {
        setActiveTab('rounds');
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create round');
    }
  };

  const handleLaunchQuestion = async (questionIndex) => {
    try {
      await api.post(`/competitive/${selectedRoundId}/launch-question`, { questionIndex });
    } catch (err) {
      alert(err.message || 'Failed to launch question');
    }
  };

  // Student Handlers
  const handleJoinBattle = async (e) => {
    e.preventDefault();
    setError('');

    if (!battleCodeInput.trim()) {
      setError('Please enter a battle code.');
      return;
    }

    try {
      const data = await api.post('/competitive/join', { roomCode: battleCodeInput });
      setJoinedRound(data.round);
    } catch (err) {
      setError(err.message || 'Failed to join battle');
    }
  };

  const handleLeaveOrComplete = async (overrideRoundId) => {
    const targetId = overrideRoundId || joinedRound?._id;
    if (!targetId) {
      setJoinedRound(null);
      return;
    }

    try {
      setLoading(true);
      const data = await api.get(`/competitive/${targetId}/review`);
      setBattleReview(data);
      setIsReviewing(true);
    } catch (err) {
      console.error('Failed to load review:', err);
    } finally {
      setLoading(false);
      setJoinedRound(null);
    }
  };

  const handleSubmitAnswer = async (optionIdx) => {
    if (!joinedRound || !studentStatusData?.currentQuestion) return;
    if (studentStatusData.secondsRemaining <= 0) return;

    setSelectedOption(optionIdx);
    try {
      const res = await api.post(`/competitive/${joinedRound._id}/submit-answer`, {
        selectedOption: optionIdx,
      });
      setSubmitResult(res);
    } catch (err) {
      alert(err.message || 'Failed to submit answer');
    }
  };

  return (
    <div className="competitive-container">
      {/* Top Header */}
      <header className="cr-header">
        <div>
          <h1 className="cr-title">⚔️ Competitive Battle Rounds</h1>
          <p className="cr-subtitle">
            {isTeacher
              ? 'Host real-time speed battles — 1st fastest correct student gets 100 FULL PTS, others get relative points!'
              : 'Speed Battle Arena — Answer correctly fastest to earn 100 FULL PTS!'}
          </p>
        </div>

        {isTeacher && (
          <div className="cr-tab-group">
            <button
              className={`cr-tab-btn ${activeTab === 'rounds' ? 'active' : ''}`}
              onClick={() => setActiveTab('rounds')}
            >
              ⚔️ My Battles
            </button>
            <button
              className={`cr-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              ➕ Create Battle
            </button>
          </div>
        )}
      </header>

      {error && <div className="cr-alert error">⚠️ {error}</div>}
      {success && <div className="cr-alert success">✓ {success}</div>}

      {/* TEACHER VIEW */}
      {isTeacher && (
        <>
          {activeTab === 'rounds' && (
            <div className="cr-section">
              {loading ? (
                <div className="cr-loading">Loading battle rounds...</div>
              ) : rounds.length === 0 ? (
                <div className="cr-empty-card glass-card">
                  <div className="cr-empty-icon">⚔️</div>
                  <h3>No Competitive Battle Rounds Created</h3>
                  <p>Create a round to host live speed battles with relative points for fastest responders!</p>
                  <button className="cr-primary-btn" onClick={() => setActiveTab('create')}>
                    ➕ Create Battle Round
                  </button>
                </div>
              ) : (
                <div className="cr-grid">
                  {rounds.map((r) => (
                    <div className="cr-card glass-card" key={r._id}>
                      <div className="cr-card-header">
                        <span className="cr-status-tag">{r.status.toUpperCase()}</span>
                        <div className="cr-code-box">
                          <span className="cr-code-label">BATTLE CODE</span>
                          <span className="cr-code-val">{r.roomCode}</span>
                        </div>
                      </div>

                      <h3 className="cr-card-title">{r.title}</h3>
                      <div className="cr-card-meta">
                        <span>❓ {r.questions.length} Speed Questions</span>
                        <span>👥 {r.participants?.length || 0} Battlers Joined</span>
                      </div>

                      <button
                        className="cr-host-btn"
                        onClick={() => {
                          setSelectedRoundId(r._id);
                          setActiveTab('host');
                        }}
                      >
                        🚀 Open Battle Host Panel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <form className="cr-create-form glass-card" onSubmit={handleCreateRound}>
              <h2>Create Competitive Speed Battle</h2>

              {/* AI QUESTION GENERATOR BOX */}
              <div className="cr-ai-generator-box glass-card">
                <div className="cr-ai-head">
                  <span className="cr-ai-badge">🤖 AI Speed Generator</span>
                  <h3>Generate Speed Battle Questions from Uploaded Course</h3>
                </div>

                {courses.length === 0 ? (
                  <p className="cr-ai-hint">⚠️ No uploaded courses found. Upload a course first in the Courses section to generate AI questions!</p>
                ) : (
                  <div className="cr-ai-controls">
                    <div className="cr-form-group flex-1">
                      <label>Select Uploaded Course:</label>
                      <select
                        className="cr-select"
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                      >
                        {courses.map((c) => (
                          <option key={c._id} value={c._id}>
                            Course #{c.sequence}: {c.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="cr-form-group width-140">
                      <label>Schedule (Days):</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={daySchedule}
                        onChange={(e) => setDaySchedule(e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      className="cr-ai-btn"
                      onClick={handleGenerateAI}
                      disabled={isGenerating}
                    >
                      {isGenerating ? '⏳ Generating AI Questions...' : '✨ Generate 10 AI Questions'}
                    </button>
                  </div>
                )}
              </div>

              <div className="cr-form-group">
                <label>Battle Title</label>
                <input
                  type="text"
                  placeholder="e.g. Ultimate Speed Challenge: React & JS"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="cr-questions-list">
                <h3>Questions (First-Responder Relative Points Enabled)</h3>
                {questions.map((q, qIdx) => (
                  <div className="cr-question-box glass-card" key={qIdx}>
                    <div className="cr-qb-head">
                      <span>Question #{qIdx + 1}</span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          className="cr-remove-btn"
                          onClick={() => setQuestions(questions.filter((_, i) => i !== qIdx))}
                        >
                          🗑️ Remove
                        </button>
                      )}
                    </div>

                    <div className="cr-form-group">
                      <label>Question Text</label>
                      <input
                        type="text"
                        placeholder="e.g. Which keyword declares a block-scoped constant?"
                        value={q.questionText}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIdx].questionText = e.target.value;
                          setQuestions(updated);
                        }}
                      />
                    </div>

                    <div className="cr-options-grid">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="cr-opt-field">
                          <label>
                            Option {String.fromCharCode(65 + optIdx)}
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={q.correctOptionIndex === optIdx}
                              onChange={() => {
                                const updated = [...questions];
                                updated[qIdx].correctOptionIndex = optIdx;
                                setQuestions(updated);
                              }}
                            />
                            <span>(Correct)</span>
                          </label>
                          <input
                            type="text"
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            value={opt}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[qIdx].options[optIdx] = e.target.value;
                              setQuestions(updated);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="cr-form-actions">
                <button type="button" className="cr-secondary-btn" onClick={handleAddQuestion}>
                  ➕ Add Question
                </button>
                <button type="submit" className="cr-primary-btn">
                  ⚡ Create Speed Battle Round
                </button>
              </div>
            </form>
          )}

          {activeTab === 'host' && hostStatusData && (
            <div className="cr-host-panel glass-card animate-fade-in-up">
              <div className="cr-host-top">
                <div>
                  <button className="cr-back-btn" onClick={() => setActiveTab('rounds')}>
                    ← Back
                  </button>
                  <h2>{hostStatusData.round.title}</h2>
                </div>
                <div className="cr-big-code">
                  <span>BATTLE CODE</span>
                  <strong>{hostStatusData.round.roomCode}</strong>
                </div>
              </div>

              {/* Active Question & Live Speed Leaderboard */}
              {hostStatusData.currentQuestion ? (
                <div className="cr-host-active-box glass-card">
                  <div className="cr-ha-head">
                    <span>
                      Active Question #{hostStatusData.currentQuestion.index + 1} of{' '}
                      {hostStatusData.round.totalQuestions}
                    </span>
                    <span>⏱️ Timer: {hostStatusData.secondsRemaining}s</span>
                  </div>

                  <h3>{hostStatusData.currentQuestion.questionText}</h3>

                  {/* LIVE SPEED STANDINGS TABLE */}
                  <div className="cr-speed-standings-box">
                    <h4>⚡ Live First-Responder Speed Standings (Relative Points):</h4>
                    {hostStatusData.speedStandings.length === 0 ? (
                      <p className="cr-no-standings">Waiting for correct responses...</p>
                    ) : (
                      <div className="cr-standings-table">
                        {hostStatusData.speedStandings.map((s) => (
                          <div
                            key={s.rank}
                            className={`cr-standing-row ${s.isFastest ? 'fastest-row' : ''}`}
                          >
                            <span className="cr-st-rank">
                              {s.isFastest ? '🥇 1st (FASTEST!)' : `#${s.rank}`}
                            </span>
                            <span className="cr-st-name">{s.studentName}</span>
                            <span className="cr-st-time">⏱️ {s.responseSeconds}s</span>
                            <span className="cr-st-pts">
                              {s.isFastest ? '🔥 +100 PTS (FULL)' : `+${s.pointsAwarded} PTS (Relative)`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="cr-empty-card">
                  <p>Click a question below to broadcast it to battlers in real time!</p>
                </div>
              )}

              {/* Question Launcher */}
              <div className="cr-launch-section">
                <h3>Broadcast Question Controls:</h3>
                <div className="cr-launch-grid">
                  {Array.from({ length: hostStatusData.round.totalQuestions }).map((_, idx) => (
                    <button
                      key={idx}
                      className="cr-launch-btn"
                      onClick={() => handleLaunchQuestion(idx)}
                    >
                      🚀 Broadcast Question #{idx + 1} (Speed Battle)
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* STUDENT VIEW */}
      {!isTeacher && (
        <div className="cr-student-section">
          {isReviewing && battleReview ? (
            /* POST-BATTLE DIAGNOSTIC REVIEW SCREEN */
            <div className="cr-review-container animate-fade-in-up">
              <div className="cr-review-summary-card glass-card">
                <div className="cr-rs-head">
                  <div>
                    <span className="cr-code-badge">BATTLE REVIEW</span>
                    <h2>{battleReview.roundSummary.title}</h2>
                    <p className="cr-rs-sub">Code: {battleReview.roundSummary.roomCode}</p>
                  </div>
                  <button
                    className="cr-primary-btn"
                    onClick={() => {
                      setIsReviewing(false);
                      setBattleReview(null);
                    }}
                  >
                    ⚔️ Return to Battle Arena
                  </button>
                </div>

                {/* Summary Badges */}
                <div className="cr-rs-badges">
                  <div className="rs-badge-box pts-box">
                    <span className="rs-val">{battleReview.roundSummary.totalPointsEarned} PTS</span>
                    <span className="rs-lbl">Total Battle Points</span>
                  </div>
                  <div className="rs-badge-box wins-box">
                    <span className="rs-val">👑 {battleReview.roundSummary.fastestWinsCount}</span>
                    <span className="rs-lbl">1st Speed Wins</span>
                  </div>
                  <div className="rs-badge-box correct-box">
                    <span className="rs-val">🟢 {battleReview.roundSummary.correctCount}</span>
                    <span className="rs-lbl">Correct Answers</span>
                  </div>
                  <div className="rs-badge-box incorrect-box">
                    <span className="rs-val">🔴 {battleReview.roundSummary.incorrectCount + battleReview.roundSummary.unansweredCount}</span>
                    <span className="rs-lbl">Incorrect / Missed</span>
                  </div>
                </div>
              </div>

              {/* Question-by-Question Breakdown */}
              <div className="cr-review-list">
                <h3>Question-by-Question Speed Review & Answer Key</h3>

                {battleReview.questionReviews.map((q, idx) => {
                  const isFastest = q.status === 'fastest';
                  const isCorrect = q.status === 'correct';
                  const isIncorrect = q.status === 'incorrect';

                  return (
                    <div
                      key={idx}
                      className={`cr-review-q-card glass-card ${
                        isFastest ? 'is-fastest' : isCorrect ? 'is-correct' : isIncorrect ? 'is-incorrect' : 'is-unanswered'
                      }`}
                    >
                      <div className="cr-rq-head">
                        <span className="cr-rq-num">Question #{idx + 1}</span>

                        {isFastest && (
                          <span className="cr-status-pill fastest">👑 1ST PLACE SPEED WINNER (+{q.pointsAwarded} PTS)</span>
                        )}
                        {isCorrect && (
                          <span className="cr-status-pill correct">🟢 CORRECT (+{q.pointsAwarded} PTS)</span>
                        )}
                        {isIncorrect && (
                          <span className="cr-status-pill incorrect">🔴 INCORRECT (0 PTS)</span>
                        )}
                        {!isFastest && !isCorrect && !isIncorrect && (
                          <span className="cr-status-pill unanswered">⚪ MISSED / TIMED OUT (0 PTS)</span>
                        )}
                      </div>

                      <h4 className="cr-rq-text">{q.questionText}</h4>

                      {/* Speed Time Badge if answered */}
                      {q.responseSeconds && (
                        <div className="cr-rq-speed-tag">
                          ⏱️ Answer Speed: <strong>{q.responseSeconds}s</strong> {q.speedRank > 0 ? `(Speed Rank #${q.speedRank})` : ''}
                        </div>
                      )}

                      {/* Options Grid */}
                      <div className="cr-rq-options-grid">
                        {q.options.map((optText, optIdx) => {
                          const isUserSelection = q.selectedOption === optIdx;
                          const isCorrectOption = q.correctOptionIndex === optIdx;

                          let optClass = '';
                          if (isCorrectOption) optClass = 'correct-opt';
                          else if (isUserSelection && !q.isCorrect) optClass = 'incorrect-opt';

                          return (
                            <div key={optIdx} className={`cr-rq-opt-item ${optClass}`}>
                              <div className="cr-rq-opt-head">
                                <span className="cr-rq-let">Option {String.fromCharCode(65 + optIdx)}</span>
                                {isCorrectOption && <span className="cr-tag correct-tag">✓ Correct Answer</span>}
                                {isUserSelection && (
                                  <span className={`cr-tag ${q.isCorrect ? 'correct-tag' : 'user-tag'}`}>
                                    👉 Your Answer
                                  </span>
                                )}
                              </div>
                              <p className="cr-rq-opt-txt">{optText}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Concept Note */}
                      <div className={`cr-rq-insight ${q.isCorrect ? 'success' : 'warn'}`}>
                        <span className="cr-rq-icon">{q.isCorrect ? '💡 Speed Insight:' : '⚠️ Concept Note:'}</span>
                        <p className="cr-rq-note">
                          {q.isCorrect ? (
                            isFastest ? (
                              `Blazing speed! You were the #1 fastest student to answer Option ${String.fromCharCode(65 + q.correctOptionIndex)} correctly, earning full 100 PTS!`
                            ) : (
                              `Great job! You answered Option ${String.fromCharCode(65 + q.correctOptionIndex)} correctly in ${q.responseSeconds}s, earning +${q.pointsAwarded} PTS.`
                            )
                          ) : q.selectedOption !== null ? (
                            `You selected Option ${String.fromCharCode(65 + q.selectedOption)}, but the correct answer is Option ${String.fromCharCode(65 + q.correctOptionIndex)} ("${q.correctOptionText}").`
                          ) : (
                            `You did not submit an answer before the 30s timer expired. The correct answer was Option ${String.fromCharCode(65 + q.correctOptionIndex)} ("${q.correctOptionText}").`
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : !joinedRound ? (
            /* JOIN BATTLE CARD */
            <div className="cr-join-card glass-card animate-fade-in-up">
              <div className="cr-icon">⚔️</div>
              <h2>Join Speed Battle Arena</h2>
              <p>Enter the Battle Code from your teacher. 1st fastest correct answer wins FULL 100 PTS!</p>

              <form onSubmit={handleJoinBattle} className="cr-join-form">
                <input
                  type="text"
                  placeholder="Enter Battle Code (e.g. CR-8492)"
                  value={battleCodeInput}
                  onChange={(e) => setBattleCodeInput(e.target.value.toUpperCase())}
                />
                <button type="submit" className="cr-join-btn">
                  🚀 Enter Battle Arena
                </button>
              </form>
            </div>
          ) : (
            /* LIVE BATTLE VIEW */
            <div className="cr-battle-view glass-card animate-fade-in-up">
              <div className="cr-bv-head">
                <div>
                  <span className="cr-code-badge">CODE: {joinedRound.roomCode}</span>
                  <h2>{joinedRound.title}</h2>
                </div>
                <button className="cr-leave-btn" onClick={() => handleLeaveOrComplete(joinedRound._id)}>
                  🚪 Leave Arena & Review Answers
                </button>
              </div>

              {studentStatusData?.currentQuestion ? (
                <div className="cr-active-q">
                  <div className="cr-aq-top">
                    <span>Question #{studentStatusData.currentQuestion.index + 1}</span>
                    <span className="cr-timer">⏱️ {studentStatusData.secondsRemaining}s</span>
                  </div>

                  <h3>{studentStatusData.currentQuestion.questionText}</h3>

                  {/* Submission Result Feedback */}
                  {submitResult && (
                    <div className={`cr-result-alert ${submitResult.isCorrect ? 'correct' : 'incorrect'}`}>
                      {submitResult.isCorrect ? (
                        submitResult.isFastest ? (
                          <span>👑 1ST PLACE SPEED WINNER! You earned FULL 100 POINTS! 🔥</span>
                        ) : (
                          <span>
                            🥈 Correct Answer! Earned +{submitResult.pointsAwarded} PTS (Relative to 1st Winner)
                          </span>
                        )
                      ) : (
                        <span>❌ Incorrect Answer! 0 Points. Better speed next time!</span>
                      )}
                    </div>
                  )}

                  {/* Options */}
                  <div className="cr-options-grid">
                    {studentStatusData.currentQuestion.options.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      const isTimeUp = studentStatusData.secondsRemaining === 0;

                      return (
                        <button
                          key={idx}
                          className={`cr-opt-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSubmitAnswer(idx)}
                          disabled={isTimeUp}
                        >
                          <span className="cr-opt-let">Option {String.fromCharCode(65 + idx)}</span>
                          <span className="cr-opt-txt">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Live Speed Standings Table for current question */}
                  {studentStatusData.speedStandings?.length > 0 && (
                    <div className="cr-speed-table-card">
                      <h4>⚡ Question Speed Leaderboard:</h4>
                      <div className="cr-st-list">
                        {studentStatusData.speedStandings.map((s) => (
                          <div key={s.rank} className={`cr-st-item ${s.isFastest ? 'gold' : ''}`}>
                            <span>{s.isFastest ? '🥇 1st (FASTEST)' : `#${s.rank}`}</span>
                            <span>{s.studentName}</span>
                            <span>{s.responseSeconds}s</span>
                            <strong>+{s.pointsAwarded} PTS</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="cr-waiting-box">
                  <div className="cr-pulse">📡 BATTLE ACTIVE</div>
                  <h3>Waiting for Teacher...</h3>
                  <p>Get ready! The fastest correct answer gets FULL 100 POINTS!</p>
                  <button
                    className="cr-secondary-btn"
                    style={{ marginTop: '1rem' }}
                    onClick={() => handleLeaveOrComplete(joinedRound._id)}
                  >
                    📊 View Battle Review & Answer Key
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompetitiveRounds;
