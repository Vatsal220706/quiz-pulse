import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';
import './Navbar.css';

const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button 
          className="menu-btn" 
          onClick={onToggleSidebar}
          aria-label="Toggle Menu"
        >
          {isSidebarOpen ? '✕' : '☰'}
        </button>
        <span className="navbar-brand">Quiz Pulse</span>
      </div>
      
      <div className="navbar-right">
        <ThemeToggle />
        {user && (
          <div className="user-controls">
            <span className="navbar-username">{user.name}</span>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              🚪
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
