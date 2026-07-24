import React from 'react';
import './Pages.css';

const Announcements = () => {
  return (
    <div className="page-container">
      <div className="page-card">
        <div className="page-icon">📢</div>
        <h1 className="page-title">Announcements</h1>
        <p className="page-description">Create and manage announcements for your students</p>
        <div className="page-coming-soon">Coming Soon</div>
      </div>
    </div>
  );
};

export default Announcements;
