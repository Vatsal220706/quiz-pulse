import { useState } from 'react';
import AuthForm from './AuthForm';

export default function RightPanel() {
  const [role, setRole] = useState('student');   // 'student' | 'teacher'
  const [mode, setMode] = useState('signin');    // 'signin' | 'signup'

  return (
    <div className="right-panel">
      <div className="auth-card">
        {/* Role Toggle */}
        <div className="role-toggle">
          <button
            type="button"
            className={`role-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
          >
            🎓 Student
          </button>
          <button
            type="button"
            className={`role-btn ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => setRole('teacher')}
          >
            📚 Teacher
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            type="button"
            className={`mode-btn ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => setMode('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        {/* Auth Form */}
        <AuthForm role={role} mode={mode} />
      </div>
    </div>
  );
}
