import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function AuthForm({ role, mode, onSignUpSuccess }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    teacherCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isSignUp = mode === 'signup';
  const isTeacher = role === 'teacher';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!formData.password) {
      setError('Please enter your password.');
      return;
    }

    if (isSignUp) {
      if (!formData.name.trim()) {
        setError('Please enter your full name.');
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role,
        };

        if (isTeacher) {
          payload.teacherCode = formData.teacherCode;
        }

        await api.post('/auth/register', payload);

        setSuccess('Account created successfully! Please sign in with your credentials.');
        setFormData((prev) => ({ ...prev, password: '', confirmPassword: '', teacherCode: '' }));

        if (onSignUpSuccess) {
          setTimeout(() => {
            onSignUpSuccess();
          }, 1500);
        }
      } else {
        await login({
          email: formData.email.trim(),
          password: formData.password,
        });

        setSuccess('Signed in successfully!');

        // Navigate to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 300);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {/* Name — Sign Up only */}
      {isSignUp && (
        <div className="form-group">
          <label className="form-label" htmlFor="auth-name">Full Name</label>
          <div className="form-input-wrapper">
            <span className="input-icon">👤</span>
            <input
              id="auth-name"
              className="form-input"
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              disabled={isLoading}
            />
          </div>
        </div>
      )}

      {/* Email */}
      <div className="form-group">
        <label className="form-label" htmlFor="auth-email">Email Address</label>
        <div className="form-input-wrapper">
          <span className="input-icon">✉️</span>
          <input
            id="auth-email"
            className="form-input"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Password */}
      <div className="form-group">
        <label className="form-label" htmlFor="auth-password">Password</label>
        <div className="form-input-wrapper">
          <span className="input-icon">🔒</span>
          <input
            id="auth-password"
            className="form-input"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder={isSignUp ? 'Min. 6 characters' : 'Enter your password'}
            value={formData.password}
            onChange={handleChange}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            disabled={isLoading}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      {/* Confirm Password — Sign Up only */}
      {isSignUp && (
        <div className="form-group">
          <label className="form-label" htmlFor="auth-confirm-password">Confirm Password</label>
          <div className="form-input-wrapper">
            <span className="input-icon">🔒</span>
            <input
              id="auth-confirm-password"
              className="form-input"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
      )}

      {/* Teacher Access Code — Teacher Sign Up only */}
      {isSignUp && isTeacher && (
        <div className="form-group">
          <label className="form-label" htmlFor="auth-teacher-code">Teacher Access Code</label>
          <div className="form-input-wrapper">
            <span className="input-icon">🔑</span>
            <input
              id="auth-teacher-code"
              className="form-input"
              type="text"
              name="teacherCode"
              placeholder="Enter your access code"
              value={formData.teacherCode}
              onChange={handleChange}
              autoComplete="off"
              disabled={isLoading}
            />
          </div>
          <span className="teacher-code-hint">
            🛈 Contact your institution admin for the access code
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="form-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="form-success">
          <span>✓</span> {success}
        </div>
      )}

      {/* Submit */}
      <button type="submit" className="submit-btn" disabled={isLoading}>
        {isLoading
          ? 'Please wait...'
          : isSignUp
            ? `Create ${isTeacher ? 'Teacher' : 'Student'} Account`
            : `Sign In as ${isTeacher ? 'Teacher' : 'Student'}`}
      </button>
    </form>
  );
}
