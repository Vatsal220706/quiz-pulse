import React from 'react';
import './Pages.css';

const Leaderboard = () => {
  return (
    <div className="page-container">
      <div className="placeholder-card">
        <span className="page-icon">🏆</span>
        <h1 className="page-title">Leaderboard</h1>
        <p className="page-description">See top performers across all quizzes</p>
        <div className="coming-soon-badge">Coming Soon</div>
      </div>
    </div>
  );
};
export default Leaderboard;
