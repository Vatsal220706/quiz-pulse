import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './JoinQuiz.css';

const JoinQuiz = () => {
  const [inputCode, setInputCode] = useState('');
  const [joinedRoom, setJoinedRoom] = useState(null); // Room data after joining
  const [statusData, setStatusData] = useState(null); // Polled live status
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Handle joining room
  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setError('');

    if (!inputCode.trim()) {
      setError('Please enter a room code.');
      return;
    }

    try {
      const data = await api.post('/quiz-rooms/join', { roomCode: inputCode });
      setJoinedRoom(data.room);
    } catch (err) {
      setError(err.message || 'Failed to join quiz room');
    }
  };

  // Poll room status when in room
  useEffect(() => {
    if (!joinedRoom) return;

    const pollStatus = async () => {
      try {
        const data = await api.get(`/quiz-rooms/${joinedRoom._id}/status`);
        setStatusData(data);

        // Sync student's selected option if already submitted
        if (data.studentResponse) {
          setSelectedOption(data.studentResponse.selectedOption);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 1000); // 1s poll for live 30s timer
    return () => clearInterval(interval);
  }, [joinedRoom]);

  // Reset selected option when active question changes
  useEffect(() => {
    if (statusData?.currentQuestion) {
      if (statusData.studentResponse) {
        setSelectedOption(statusData.studentResponse.selectedOption);
      } else {
        setSelectedOption(null);
      }
    }
  }, [statusData?.currentQuestion?.index]);

  const handleSelectOption = async (optionIdx) => {
    if (!joinedRoom || !statusData?.currentQuestion) return;
    if (statusData.secondsRemaining <= 0) return; // Time's up

    setSelectedOption(optionIdx);
    setSubmitting(true);
    setInfoMsg('');

    try {
      await api.post(`/quiz-rooms/${joinedRoom._id}/submit-answer`, {
        selectedOption: optionIdx,
      });
      setInfoMsg('✓ Answer Recorded!');
    } catch (err) {
      setError(err.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveRoom = () => {
    setJoinedRoom(null);
    setStatusData(null);
    setSelectedOption(null);
    setInputCode('');
  };

  return (
    <div className="join-quiz-container">
      {!joinedRoom ? (
        /* SCREEN 1: ENTER ROOM CODE FORM */
        <div className="jq-join-card glass-card animate-fade-in-up">
          <div className="jq-icon">🎯</div>
          <h1 className="jq-title">Join Live Quiz Room</h1>
          <p className="jq-subtitle">Enter the 6-character room code provided by your teacher</p>

          {error && <div className="jq-alert error">⚠️ {error}</div>}

          <form onSubmit={handleJoinRoom} className="jq-form">
            <div className="jq-input-group">
              <span className="jq-input-icon">🔑</span>
              <input
                type="text"
                placeholder="Enter Room Code (e.g. QP-8492)"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                maxLength={8}
              />
            </div>

            <button type="submit" className="jq-join-btn">
              🚀 Join Quiz Room
            </button>
          </form>
        </div>
      ) : (
        /* SCREEN 2: LIVE QUIZ ROOM VIEW */
        <div className="jq-room-view glass-card animate-fade-in-up">
          {/* Room Header */}
          <div className="jq-room-header">
            <div>
              <span className="jq-code-badge">ROOM CODE: {joinedRoom.roomCode}</span>
              <h2 className="jq-room-title">{joinedRoom.title}</h2>
            </div>
            <button className="jq-leave-btn" onClick={handleLeaveRoom}>
              🚪 Leave Room
            </button>
          </div>

          {/* Active Question OR Waiting Lobby */}
          {statusData?.currentQuestion ? (
            <div className="jq-active-question-card">
              {/* Question Header & Live 30s Timer */}
              <div className="jq-q-header">
                <span className="jq-q-num">
                  Question #{statusData.currentQuestion.index + 1} of {statusData.room.totalQuestions}
                </span>

                <div className={`jq-timer-box ${statusData.secondsRemaining <= 5 ? 'warn' : ''}`}>
                  ⏱️ {statusData.secondsRemaining > 0 ? `${statusData.secondsRemaining}s` : "TIME'S UP!"}
                </div>
              </div>

              {/* 30-Second Countdown Timer Bar */}
              <div className="jq-timer-bar-track">
                <div
                  className={`jq-timer-bar-fill ${statusData.secondsRemaining <= 5 ? 'warn' : ''}`}
                  style={{
                    width: `${(statusData.secondsRemaining / 30) * 100}%`,
                  }}
                />
              </div>

              <h3 className="jq-question-text">{statusData.currentQuestion.questionText}</h3>

              {/* Info Message */}
              {infoMsg && <div className="jq-info-toast">{infoMsg}</div>}

              {/* Option Cards (A, B, C, D) */}
              <div className="jq-options-grid">
                {statusData.currentQuestion.options.map((optionText, idx) => {
                  const isSelected = selectedOption === idx;
                  const isTimeUp = statusData.secondsRemaining === 0;
                  const isCorrect = isTimeUp && statusData.currentQuestion.correctOptionIndex === idx;

                  return (
                    <button
                      key={idx}
                      className={`jq-option-card ${isSelected ? 'selected' : ''} ${
                        isTimeUp && isCorrect ? 'correct' : ''
                      }`}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isTimeUp || submitting}
                    >
                      <div className="jq-opt-badge">Option {String.fromCharCode(65 + idx)}</div>
                      <span className="jq-opt-text">{optionText}</span>
                      {isSelected && !isTimeUp && <span className="jq-selected-icon">✓ Selected</span>}
                      {isTimeUp && isCorrect && <span className="jq-correct-icon">✓ Correct Answer</span>}
                    </button>
                  );
                })}
              </div>

              {/* Result Summary when Time Expired */}
              {statusData.secondsRemaining === 0 && (
                <div className="jq-result-banner animate-fade-in-up">
                  {selectedOption === statusData.currentQuestion.correctOptionIndex ? (
                    <div className="jq-result success">🎉 Correct Answer! Great Job!</div>
                  ) : (
                    <div className="jq-result fail">
                      ❌ {selectedOption === null ? "Time Expired! You didn't submit an answer." : "Incorrect Answer. Better luck on the next question!"}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* WAITING LOBBY */
            <div className="jq-waiting-card">
              <div className="jq-pulsing-badge">📡 LIVE ROOM ACTIVE</div>
              <div className="jq-waiting-icon">⏳</div>
              <h3>Waiting for Teacher...</h3>
              <p>Your teacher will broadcast the 30-second question shortly. Keep this screen open!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JoinQuiz;
