import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const studentMenuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/courses', label: 'Courses', icon: '📚' },
  { path: '/join-quiz', label: 'Join Quiz', icon: '🎯' },
  { path: '/competitive', label: 'Competitive Rounds', icon: '⚔️' },
  { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { path: '/reports', label: 'Quiz Reports', icon: '📈' },
  { path: '/doubts', label: 'Ask Doubts', icon: '❓' },
];

const teacherMenuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/announcements', label: 'Announcements', icon: '📢' },
  { path: '/courses', label: 'Courses', icon: '📚' },
  { path: '/assignments', label: 'Assignments', icon: '📝' },
  { path: '/quiz-manage', label: 'Quiz', icon: '🧩' },
  { path: '/competitive', label: 'Competitive Rounds', icon: '⚔️' },
  { path: '/performance', label: 'Performance Reports', icon: '📈' },
  { path: '/doubts', label: 'Doubts Pending', icon: '❓' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const menuItems = user?.role === 'teacher' ? teacherMenuItems : studentMenuItems;

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}></div>
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="logo-text">Quiz Pulse</h2>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {user && (
          <div className="sidebar-footer">
            <div className="user-info">
              <div className={`avatar ${user.role === 'teacher' ? 'avatar-teacher' : ''}`}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-details">
                <span className="user-name">{user.name || 'User'}</span>
                <span className="user-role">{user.role || 'Student'}</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
