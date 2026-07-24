import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import './AuthPage.css';

export default function AuthPage() {
  const { user, loading } = useAuth();
  const pageRef = useRef(null);

  // Cursor glow effect — update CSS custom properties on mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (pageRef.current) {
        pageRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
        pageRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Redirect to dashboard if already logged in
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Generate particle elements
  const particles = Array.from({ length: 8 }, (_, i) => (
    <div key={i} className="particle" />
  ));

  return (
    <div className="auth-page" ref={pageRef}>
      {/* Theme toggle top-right */}
      <div className="theme-toggle-corner">
        <ThemeToggle />
      </div>

      {/* Cursor glow overlay */}
      <div className="cursor-glow" />

      {/* Floating particles */}
      <div className="particles">{particles}</div>

      {/* Main content */}
      <div className="auth-container">
        <LeftPanel />
        <RightPanel />
      </div>
    </div>
  );
}
