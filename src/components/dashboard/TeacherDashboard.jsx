import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    quizzesCreated: 0,
    studentsEnrolled: 0,
    coursesOffered: 0,
    assignmentsGiven: 0,
    doubtsPending: 0,
    avgQuizScore: 0,
    highestScore: '--%',
    lowestScore: '--%',
    completionRate: '--%',
    activeStudents: 0,
    quizPerformance: [],
  });
  const [loading, setLoading] = useState(true);

  const currentOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date().toLocaleDateString(undefined, currentOptions);
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today';

  const [barsAnimated, setBarsAnimated] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.get('/quiz-rooms/teacher-dashboard-stats');
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to load teacher stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const timer = setTimeout(() => setBarsAnimated(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const quizPerformance = stats.quizPerformance && stats.quizPerformance.length > 0
    ? stats.quizPerformance
    : [
        { label: 'Quiz 1', correct: 85, total: 100, pct: 85 },
        { label: 'Quiz 2', correct: 72, total: 100, pct: 72 },
      ];

  return (
    <div className="teacher-dashboard">
      {/* Welcome Header */}
      <header className="td-header animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div>
          <h1 className="td-welcome">Welcome back, {user?.name || 'Teacher'}! 🎓</h1>
          <p className="td-subtitle">Here's your live classroom overview</p>
        </div>
        <div className="td-date-badge">{today}</div>
      </header>

      {/* Stats Cards */}
      <div className="td-stats-grid animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="td-stat-card">
          <div className="td-stat-icon quiz-created-icon">🧩</div>
          <div className="td-stat-body">
            <span className="td-stat-label">Quizzes Created</span>
            <span className="td-stat-value">{stats.quizzesCreated}</span>
          </div>
        </div>
        <div className="td-stat-card">
          <div className="td-stat-icon students-icon">👥</div>
          <div className="td-stat-body">
            <span className="td-stat-label">Students Enrolled</span>
            <span className="td-stat-value">{stats.studentsEnrolled}</span>
          </div>
        </div>
        <div className="td-stat-card">
          <div className="td-stat-icon courses-icon">📚</div>
          <div className="td-stat-body">
            <span className="td-stat-label">Courses Offered</span>
            <span className="td-stat-value">{stats.coursesOffered}</span>
          </div>
        </div>
        <div className="td-stat-card">
          <div className="td-stat-icon assignments-icon">📝</div>
          <div className="td-stat-body">
            <span className="td-stat-label">Assignments Given</span>
            <span className="td-stat-value">{stats.assignmentsGiven}</span>
          </div>
        </div>
        <div className="td-stat-card td-stat-card-accent">
          <div className="td-stat-icon doubts-icon">❓</div>
          <div className="td-stat-body">
            <span className="td-stat-label">Doubts Pending</span>
            <span className="td-stat-value accent-warn">{stats.doubtsPending}</span>
          </div>
        </div>
      </div>

      {/* Two Column: Performance Chart + Class Overview */}
      <div className="td-two-col animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        {/* Quiz Performance Visual */}
        <div className="td-glass-card td-chart-card">
          <h2 className="td-card-title">Quiz Performance Overview</h2>
          <p className="td-card-desc">Percentage of students answering correctly per quiz</p>
          <div className="td-chart">
            {quizPerformance.map((q, i) => {
              const pct = q.pct !== undefined ? q.pct : Math.round((q.correct / q.total) * 100);
              const barColor = pct >= 80
                ? 'linear-gradient(90deg, var(--accent-cyan), #4dd0e1)'
                : pct >= 60
                  ? 'linear-gradient(90deg, var(--accent-purple), #9575cd)'
                  : 'linear-gradient(90deg, #ff6b6b, #ef5350)';
              return (
                <div className="td-bar-group" key={i}>
                  <div className="td-bar-label">{q.label}</div>
                  <div className="td-bar-track">
                    <div
                      className="td-bar-fill"
                      style={{
                        width: barsAnimated ? `${pct}%` : '0%',
                        background: barColor,
                        transitionDelay: `${i * 0.12}s`,
                      }}
                    >
                      {barsAnimated && <span className="td-bar-pct">{pct}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="td-chart-legend">
            <span className="td-legend-item"><span className="td-legend-dot high"></span> Above 80%</span>
            <span className="td-legend-item"><span className="td-legend-dot mid"></span> 60–80%</span>
            <span className="td-legend-item"><span className="td-legend-dot low"></span> Below 60%</span>
          </div>
        </div>

        {/* Class Overview */}
        <div className="td-glass-card td-overview-card">
          <h2 className="td-card-title">Class Overview</h2>
          <div className="td-overview-list">
            <div className="td-overview-item">
              <span className="td-ov-label">Avg. Quiz Score</span>
              <span className="td-ov-value">{stats.avgQuizScore}%</span>
            </div>
            <div className="td-overview-item">
              <span className="td-ov-label">Highest Score</span>
              <span className="td-ov-value">{stats.highestScore}</span>
            </div>
            <div className="td-overview-item">
              <span className="td-ov-label">Lowest Score</span>
              <span className="td-ov-value">{stats.lowestScore}</span>
            </div>
            <div className="td-overview-item">
              <span className="td-ov-label">Completion Rate</span>
              <span className="td-ov-value">{stats.completionRate}</span>
            </div>
            <div className="td-overview-item">
              <span className="td-ov-label">Active Students</span>
              <span className="td-ov-value accent">{stats.activeStudents}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity + Profile */}
      <div className="td-two-col animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        {/* Recent Activity */}
        <div className="td-glass-card">
          <h2 className="td-card-title">Recent Activity</h2>
          <div className="td-empty-state">
            <div className="td-empty-icon">📋</div>
            <p>No recent activity yet. Create a quiz or assignment to get started!</p>
          </div>
        </div>

        {/* Profile Details */}
        <div className="td-glass-card">
          <h2 className="td-card-title">Profile Details</h2>
          <div className="td-profile-grid">
            <div className="td-profile-item">
              <span className="td-pi-label">Name</span>
              <span className="td-pi-value">{user?.name || 'Not provided'}</span>
            </div>
            <div className="td-profile-item">
              <span className="td-pi-label">Email</span>
              <span className="td-pi-value">{user?.email || 'Not provided'}</span>
            </div>
            <div className="td-profile-item">
              <span className="td-pi-label">Role</span>
              <span className="td-pi-value">
                <span className="td-role-badge teacher">Teacher</span>
              </span>
            </div>
            <div className="td-profile-item">
              <span className="td-pi-label">Member Since</span>
              <span className="td-pi-value">{memberSince}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
