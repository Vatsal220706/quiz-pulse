import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  
  const currentOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date().toLocaleDateString(undefined, currentOptions);
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today';

  return (
    <div className="dashboard-container">
      <header className="dashboard-header animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div>
          <h1 className="welcome-text">Welcome back, {user?.name || 'Student'}! 👋</h1>
          <p className="welcome-subtext">Here's your learning pulse for today</p>
        </div>
        <div className="date-badge">{today}</div>
      </header>

      <div className="stats-grid animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper courses-icon">📚</div>
          <div className="stat-content">
            <span className="stat-label">Courses Enrolled</span>
            <span className="stat-value">0</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper lessons-icon">✅</div>
          <div className="stat-content">
            <span className="stat-label">Lessons Completed</span>
            <span className="stat-value">0</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper streak-icon">🔥</div>
          <div className="stat-content">
            <span className="stat-label">Learning Streak</span>
            <span className="stat-value">0 <span className="stat-unit">days</span></span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper quiz-icon">📝</div>
          <div className="stat-content">
            <span className="stat-label">Quizzes Attended</span>
            <span className="stat-value">{user?.quizzesAttended || 0}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-two-col animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="recent-quizzes-card glass-card">
          <h2 className="card-title">Recent Quizzes</h2>
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <p>No quizzes taken yet. Join a quiz to get started!</p>
          </div>
        </div>

        <div className="quick-stats-card glass-card">
          <h2 className="card-title">Quick Stats</h2>
          <div className="quick-stats-list">
            <div className="quick-stat-item">
              <span className="qs-label">Overall Accuracy</span>
              <span className="qs-value">
                {user?.totalAnswers > 0
                  ? `${Math.round((user.correctAnswers / user.totalAnswers) * 100)}%`
                  : '--%'}
              </span>
            </div>
            <div className="quick-stat-item">
              <span className="qs-label">Correct Answers</span>
              <span className="qs-value">{user?.correctAnswers || 0} / {user?.totalAnswers || 0}</span>
            </div>
            <div className="quick-stat-item">
              <span className="qs-label">Total Points</span>
              <span className="qs-value accent">{user?.points || 0} PTS</span>
            </div>
            <div className="quick-stat-item">
              <span className="qs-label">Quizzes Attended</span>
              <span className="qs-value">{user?.quizzesAttended || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-details-card glass-card animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <h2 className="card-title">Profile Details</h2>
        <div className="profile-grid">
          <div className="profile-item">
            <span className="pi-label">Name</span>
            <span className="pi-value">{user?.name || 'Not provided'}</span>
          </div>
          <div className="profile-item">
            <span className="pi-label">Email</span>
            <span className="pi-value">{user?.email || 'Not provided'}</span>
          </div>
          <div className="profile-item">
            <span className="pi-label">Role</span>
            <span className="pi-value"><span className="role-badge">{user?.role || 'Student'}</span></span>
          </div>
          <div className="profile-item">
            <span className="pi-label">Member Since</span>
            <span className="pi-value">{memberSince}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
