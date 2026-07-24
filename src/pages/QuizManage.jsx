import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './QuizManage.css';

const QuizManage = () => {
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' | 'create' | 'host'
  const [rooms, setRooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // AI Generator State
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [dayCount, setDayCount] = useState(3);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Host Panel State
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [roomStatusData, setRoomStatusData] = useState(null);

  // Form State for creating a room
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      timeLimit: 30,
    },
  ]);

  const fetchRoomsAndCourses = async () => {
    try {
      setLoading(true);
      const [roomsData, coursesData] = await Promise.all([
        api.get('/quiz-rooms/teacher'),
        api.get('/courses'),
      ]);
      setRooms(roomsData.rooms || []);
      const fetchedCourses = coursesData.courses || [];
      setCourses(fetchedCourses);
      if (fetchedCourses.length > 0) {
        setSelectedCourseId(fetchedCourses[0]._id);
        // Pre-fill days based on sequence (Course 1 = 3 days, Course 2 = 8 days, Course 3 = 12 days...)
        const seq = fetchedCourses[0].sequence;
        setDayCount(seq === 1 ? 3 : seq === 2 ? 8 : 12);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch quiz data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomsAndCourses();
  }, []);

  // When selected course changes, auto-suggest day duration
  const handleCourseSelectionChange = (courseId) => {
    setSelectedCourseId(courseId);
    const selected = courses.find((c) => c._id === courseId);
    if (selected) {
      const seq = selected.sequence;
      setDayCount(seq === 1 ? 3 : seq === 2 ? 8 : 12);
    }
  };

  // Poll host room status when hosting
  useEffect(() => {
    if (activeTab !== 'host' || !selectedRoomId) return;

    const pollStatus = async () => {
      try {
        const data = await api.get(`/quiz-rooms/${selectedRoomId}/status`);
        setRoomStatusData(data);
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 1000); // 1-second poll for live timer
    return () => clearInterval(interval);
  }, [activeTab, selectedRoomId]);

  // AI Question Generator Handler
  const handleGenerateAIQuestions = async () => {
    setError('');
    setSuccess('');

    const selectedCourse = courses.find((c) => c._id === selectedCourseId);
    const courseTitle = selectedCourse ? selectedCourse.title : 'Course';
    const sequence = selectedCourse ? selectedCourse.sequence : 1;

    setAiGenerating(true);
    try {
      const data = await api.post('/quiz-rooms/generate-ai', {
        courseId: selectedCourseId,
        courseTitle,
        dayCount,
        sequence,
      });

      setTitle(data.title);
      setQuestions(data.questions);
      setSuccess(`✨ 10 AI Questions generated for "${courseTitle}" over ${dayCount} days! You can edit or customize any question below.`);
    } catch (err) {
      setError(err.message || 'Failed to generate AI questions');
    } finally {
      setAiGenerating(false);
    }
  };

  // Handle Form changes for creating quiz
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        timeLimit: 30,
      },
    ]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Please enter a quiz title.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        setError(`Question ${i + 1} text is empty.`);
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        setError(`All 4 options must be filled for Question ${i + 1}.`);
        return;
      }
    }

    try {
      const data = await api.post('/quiz-rooms', { title, questions });
      setSuccess(`Quiz Room Created! Room Code: ${data.room.roomCode}`);
      setTitle('');
      setQuestions([
        {
          questionText: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          timeLimit: 30,
        },
      ]);
      fetchRoomsAndCourses();
      setTimeout(() => {
        setActiveTab('rooms');
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create quiz room');
    }
  };

  const handleOpenHostPanel = (roomId) => {
    setSelectedRoomId(roomId);
    setActiveTab('host');
  };

  const handleLaunchQuestion = async (questionIndex) => {
    try {
      await api.post(`/quiz-rooms/${selectedRoomId}/launch-question`, { questionIndex });
    } catch (err) {
      alert(err.message || 'Failed to launch question');
    }
  };

  return (
    <div className="quiz-manage-container">
      {/* Top Header & Tabs */}
      <header className="qm-header">
        <div>
          <h1 className="qm-title">🧩 Live Quiz Rooms</h1>
          <p className="qm-subtitle">Create rooms with 30s timed questions & AI Course Question Generator</p>
        </div>

        <div className="qm-tab-group">
          <button
            className={`qm-tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            📋 My Quiz Rooms
          </button>
          <button
            className={`qm-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            ➕ Create New Room
          </button>
        </div>
      </header>

      {/* Alert Messages */}
      {error && <div className="qm-alert error">⚠️ {error}</div>}
      {success && <div className="qm-alert success">✓ {success}</div>}

      {/* TAB 1: LIST MY QUIZ ROOMS */}
      {activeTab === 'rooms' && (
        <div className="qm-section">
          {loading ? (
            <div className="qm-loading">Loading quiz rooms...</div>
          ) : rooms.length === 0 ? (
            <div className="qm-empty-card glass-card">
              <div className="qm-empty-icon">🎯</div>
              <h3>No Live Quiz Rooms Created Yet</h3>
              <p>Create a room or use AI to generate 10 course questions automatically!</p>
              <button className="qm-primary-btn" onClick={() => setActiveTab('create')}>
                ➕ Create Quiz Room
              </button>
            </div>
          ) : (
            <div className="qm-rooms-grid">
              {rooms.map((room) => (
                <div className="qm-room-card glass-card" key={room._id}>
                  <div className="qm-room-header">
                    <span className="qm-room-status-badge">{room.status.toUpperCase()}</span>
                    <div className="qm-code-box">
                      <span className="qm-code-label">ROOM CODE</span>
                      <span className="qm-code-value">{room.roomCode}</span>
                    </div>
                  </div>

                  <h3 className="qm-room-title">{room.title}</h3>
                  
                  <div className="qm-room-meta">
                    <span>❓ {room.questions.length} Questions (30s each)</span>
                    <span>👥 {room.participants?.length || 0} Students Joined</span>
                  </div>

                  <button className="qm-host-btn" onClick={() => handleOpenHostPanel(room._id)}>
                    🚀 Open Host Control Panel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE NEW QUIZ ROOM (with AI Generator) */}
      {activeTab === 'create' && (
        <div className="qm-section">
          {/* AI Generator Box */}
          <div className="qm-ai-box glass-card animate-fade-in-up">
            <div className="qm-ai-header">
              <div className="qm-ai-title">
                <span className="qm-ai-badge">🤖 AI QUIZ GENERATOR</span>
                <h2>Generate 10 Course Questions</h2>
              </div>
              <p className="qm-ai-desc">
                Select a course and schedule length (e.g. 3 days for Course 1, 8 days for Course 2, 12 days for Course 3). AI will generate 10 structured questions for your room!
              </p>
            </div>

            <div className="qm-ai-form">
              <div className="qm-form-group">
                <label>Select Course</label>
                {courses.length === 0 ? (
                  <select disabled className="qm-select">
                    <option>No courses available. Add courses first.</option>
                  </select>
                ) : (
                  <select
                    className="qm-select"
                    value={selectedCourseId}
                    onChange={(e) => handleCourseSelectionChange(e.target.value)}
                  >
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        Course #{c.sequence}: {c.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="qm-form-group">
                <label>Course Schedule Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={dayCount}
                  onChange={(e) => setDayCount(parseInt(e.target.value) || 3)}
                />
                <span className="qm-form-hint">Questions will be assigned across the {dayCount}-day schedule</span>
              </div>

              <button
                type="button"
                className="qm-ai-btn"
                onClick={handleGenerateAIQuestions}
                disabled={aiGenerating || courses.length === 0}
              >
                {aiGenerating ? '⚡ Generating 10 AI Questions...' : '✨ Generate 10 AI Questions'}
              </button>
            </div>
          </div>

          {/* Form */}
          <form className="qm-create-form glass-card" onSubmit={handleCreateRoom}>
            <h2 className="qm-section-title">Quiz Room Configuration</h2>

            <div className="qm-form-group">
              <label>Quiz Title</label>
              <input
                type="text"
                placeholder="e.g. Course #1: 3-Day Live Assessment"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="qm-questions-list">
              <div className="qm-ql-header">
                <h3 className="qm-sub-heading">Questions List ({questions.length} Questions, 30s Timed Each)</h3>
                <span className="qm-edit-note">✏️ You can edit, customize, or add more questions below before creating room</span>
              </div>

              {questions.map((q, qIndex) => (
                <div className="qm-question-box glass-card" key={qIndex}>
                  <div className="qm-qb-header">
                    <span className="qm-qb-num">Question #{qIndex + 1}</span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        className="qm-remove-q-btn"
                        onClick={() => handleRemoveQuestion(qIndex)}
                      >
                        🗑️ Remove
                      </button>
                    )}
                  </div>

                  <div className="qm-form-group">
                    <label>Question Text</label>
                    <input
                      type="text"
                      placeholder="e.g. What is the output of typeof NaN in JavaScript?"
                      value={q.questionText}
                      onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                    />
                  </div>

                  <div className="qm-options-grid">
                    {q.options.map((opt, optIndex) => (
                      <div className="qm-option-field" key={optIndex}>
                        <label>
                          Option {String.fromCharCode(65 + optIndex)}
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={q.correctOptionIndex === optIndex}
                            onChange={() => handleQuestionChange(qIndex, 'correctOptionIndex', optIndex)}
                          />
                          <span className="qm-radio-hint">(Correct Answer)</span>
                        </label>
                        <input
                          type="text"
                          placeholder={`Enter Option ${String.fromCharCode(65 + optIndex)}`}
                          value={opt}
                          onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="qm-form-actions">
              <button type="button" className="qm-secondary-btn" onClick={handleAddQuestion}>
                ➕ Add Another Question
              </button>
              <button type="submit" className="qm-primary-btn">
                🎉 Create Quiz Room & Generate Code
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: HOST CONTROL PANEL */}
      {activeTab === 'host' && roomStatusData && (
        <div className="qm-section animate-fade-in-up">
          <div className="qm-host-panel glass-card">
            {/* Top Host Bar */}
            <div className="qm-host-top">
              <div>
                <button className="qm-back-btn" onClick={() => setActiveTab('rooms')}>
                  ← Back to Rooms
                </button>
                <h2 className="qm-host-title">{roomStatusData.room.title}</h2>
              </div>
              <div className="qm-big-code-box">
                <span className="qm-code-label">STUDENT ROOM CODE</span>
                <span className="qm-big-code">{roomStatusData.room.roomCode}</span>
                <span className="qm-code-sub">Share this code with students to join!</span>
              </div>
            </div>

            {/* Room Info & Joined Students */}
            <div className="qm-host-stats-bar">
              <div className="qm-hs-item">
                <span className="qm-hs-label">Joined Students</span>
                <span className="qm-hs-val">👥 {roomStatusData.room.participantsCount}</span>
              </div>
              <div className="qm-hs-item">
                <span className="qm-hs-label">Total Questions</span>
                <span className="qm-hs-val">❓ {roomStatusData.room.totalQuestions}</span>
              </div>
              <div className="qm-hs-item">
                <span className="qm-hs-label">Current Status</span>
                <span className="qm-hs-val highlight">{roomStatusData.room.status.toUpperCase()}</span>
              </div>
            </div>

            {/* Active Question & Timer Control */}
            {roomStatusData.currentQuestion ? (
              <div className="qm-active-q-box glass-card">
                <div className="qm-aq-header">
                  <span className="qm-aq-badge">
                    Active Question #{roomStatusData.currentQuestion.index + 1} of {roomStatusData.room.totalQuestions}
                  </span>
                  <div className="qm-live-timer-badge">
                    ⏱️ Time Remaining: <strong className={roomStatusData.secondsRemaining <= 5 ? 'warn' : ''}>{roomStatusData.secondsRemaining}s</strong>
                  </div>
                </div>

                <h3 className="qm-aq-text">{roomStatusData.currentQuestion.questionText}</h3>

                {/* 30s Timer Bar */}
                <div className="qm-timer-bar-track">
                  <div
                    className={`qm-timer-bar-fill ${roomStatusData.secondsRemaining <= 5 ? 'warn' : ''}`}
                    style={{
                      width: `${(roomStatusData.secondsRemaining / 30) * 100}%`,
                    }}
                  />
                </div>

                {/* Options & Response Analytics */}
                <div className="qm-response-analytics">
                  <h4>Live Responses Breakdown:</h4>
                  <div className="qm-analytics-grid">
                    {roomStatusData.currentQuestion.options.map((optText, optIdx) => {
                      const count = roomStatusData.responseCounts[optIdx] || 0;
                      const isCorrect = optIdx === roomStatusData.currentQuestion.correctOptionIndex;
                      return (
                        <div
                          className={`qm-analytic-card ${isCorrect ? 'correct-card' : ''}`}
                          key={optIdx}
                        >
                          <div className="qm-ac-top">
                            <span className="qm-ac-opt">Option {String.fromCharCode(65 + optIdx)}</span>
                            {isCorrect && <span className="qm-correct-badge">✓ Correct</span>}
                          </div>
                          <p className="qm-ac-text">{optText}</p>
                          <span className="qm-ac-count">{count} Students Chose This</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="qm-waiting-host-card">
                <div className="qm-wh-icon">📢</div>
                <h3>No Question Live Right Now</h3>
                <p>Click a question below to broadcast it to all student screens with a 30-second timer!</p>
              </div>
            )}

            {/* Launch Questions Control List */}
            <div className="qm-launch-list">
              <h3>Broadcast Question Controls:</h3>
              <div className="qm-launch-grid">
                {Array.from({ length: roomStatusData.room.totalQuestions }).map((_, idx) => {
                  const isCurrent = roomStatusData.room.currentQuestionIndex === idx;
                  return (
                    <button
                      key={idx}
                      className={`qm-launch-btn ${isCurrent ? 'active' : ''}`}
                      onClick={() => handleLaunchQuestion(idx)}
                    >
                      {isCurrent ? '⚡ Re-broadcast Question #' + (idx + 1) : '🚀 Broadcast Question #' + (idx + 1) + ' (30s Timer)'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizManage;
