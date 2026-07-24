import React from 'react';
import './Pages.css';

const Courses = () => {
  return (
    <div className="page-container">
      <div className="placeholder-card">
        <span className="page-icon">📚</span>
        <h1 className="page-title">Courses</h1>
        <p className="page-description">Browse and enroll in courses</p>
        <div className="coming-soon-badge">Coming Soon</div>
      </div>
    </div>
  );
};
export default Courses;
