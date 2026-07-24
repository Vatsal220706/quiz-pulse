import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Leaderboard.css';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await api.get('/quiz-rooms/leaderboard');
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const topThree = leaderboard.slice(0, 3);
  const secondPlace = topThree[1]; // Rank 2
  const firstPlace = topThree[0];  // Rank 1
  const thirdPlace = topThree[2];  // Rank 3

  return (
    <div className="leaderboard-container">
      {/* Header */}
      <header className="lb-header">
        <div>
          <h1 className="lb-title">🏆 Quiz Pulse Leaderboard</h1>
          <p className="lb-subtitle">Top performing students ranked by total points, accuracy & quiz participation</p>
        </div>
        <button className="lb-refresh-btn" onClick={fetchLeaderboard} title="Refresh Live Ranks">
          🔄 Refresh Ranks
        </button>
      </header>

      {error && <div className="lb-alert error">⚠️ {error}</div>}

      {loading ? (
        <div className="lb-loading">Loading live leaderboard ranks...</div>
      ) : leaderboard.length === 0 ? (
        <div className="lb-empty-card glass-card">
          <div className="lb-empty-icon">🏆</div>
          <h3>No Student Rankings Yet</h3>
          <p>Join a live quiz room and answer questions correctly to earn points and climb the leaderboard!</p>
        </div>
      ) : (
        <>
          {/* TOP 3 PODIUM */}
          <div className="lb-podium-section animate-fade-in-up">
            {/* 2nd Place */}
            {secondPlace ? (
              <div className="lb-podium-card rank-2 glass-card">
                <div className="lb-podium-crown">🥈</div>
                <div className="lb-podium-avatar">
                  {secondPlace.name ? secondPlace.name.charAt(0).toUpperCase() : '2'}
                </div>
                <span className="lb-podium-name">{secondPlace.name}</span>
                <span className="lb-podium-pts">{secondPlace.points} PTS</span>
                <span className="lb-podium-acc">Accuracy: {secondPlace.accuracy}%</span>
                <div className="lb-podium-base base-2">#2</div>
              </div>
            ) : <div className="lb-podium-spacer" />}

            {/* 1st Place */}
            {firstPlace && (
              <div className="lb-podium-card rank-1 glass-card">
                <div className="lb-podium-crown">👑 🥇</div>
                <div className="lb-podium-avatar gold">
                  {firstPlace.name ? firstPlace.name.charAt(0).toUpperCase() : '1'}
                </div>
                <span className="lb-podium-name gold-text">{firstPlace.name}</span>
                <span className="lb-podium-pts gold-pts">{firstPlace.points} PTS</span>
                <span className="lb-podium-acc">Accuracy: {firstPlace.accuracy}%</span>
                <div className="lb-podium-base base-1">#1 CHAMPION</div>
              </div>
            )}

            {/* 3rd Place */}
            {thirdPlace ? (
              <div className="lb-podium-card rank-3 glass-card">
                <div className="lb-podium-crown">🥉</div>
                <div className="lb-podium-avatar">
                  {thirdPlace.name ? thirdPlace.name.charAt(0).toUpperCase() : '3'}
                </div>
                <span className="lb-podium-name">{thirdPlace.name}</span>
                <span className="lb-podium-pts">{thirdPlace.points} PTS</span>
                <span className="lb-podium-acc">Accuracy: {thirdPlace.accuracy}%</span>
                <div className="lb-podium-base base-3">#3</div>
              </div>
            ) : <div className="lb-podium-spacer" />}
          </div>

          {/* LEADERBOARD TABLE */}
          <div className="lb-table-card glass-card animate-fade-in-up">
            <h2 className="lb-table-title">Full Rankings</h2>
            <div className="lb-table-wrapper">
              <table className="lb-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student Name</th>
                    <th>Quizzes Attended</th>
                    <th>Correct Answers</th>
                    <th>Accuracy</th>
                    <th>Total Points</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((student) => {
                    const isCurrentUser = user && user._id === student._id;

                    return (
                      <tr
                        key={student._id}
                        className={`${isCurrentUser ? 'current-user-row' : ''}`}
                      >
                        <td className="rank-cell">
                          {student.rank === 1 ? (
                            <span className="rank-badge gold">🥇 1</span>
                          ) : student.rank === 2 ? (
                            <span className="rank-badge silver">🥈 2</span>
                          ) : student.rank === 3 ? (
                            <span className="rank-badge bronze">🥉 3</span>
                          ) : (
                            <span className="rank-num">#{student.rank}</span>
                          )}
                        </td>
                        <td className="name-cell">
                          <div className="student-name-group">
                            <span className="table-avatar">
                              {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                            </span>
                            <span className="student-name">
                              {student.name} {isCurrentUser && <span className="you-tag">(You)</span>}
                            </span>
                          </div>
                        </td>
                        <td>{student.quizzesAttended}</td>
                        <td>{student.correctAnswers} / {student.totalAnswers}</td>
                        <td>
                          <div className="acc-bar-wrapper">
                            <span>{student.accuracy}%</span>
                            <div className="acc-bar-track">
                              <div
                                className="acc-bar-fill"
                                style={{ width: `${student.accuracy}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="points-cell">
                          <span className="pts-highlight">{student.points} PTS</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
