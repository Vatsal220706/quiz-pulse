import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Doubts.css';

const Doubts = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [doubts, setDoubts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'resolved'

  // Modal State for Student Ask Doubt
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    question: '',
    courseId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Reply State for individual doubts: { [doubtId]: messageText }
  const [replyText, setReplyText] = useState({});
  const [sendingReply, setSendingReply] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [doubtsRes, coursesRes] = await Promise.all([
        api.get('/doubts'),
        api.get('/courses'),
      ]);
      setDoubts(doubtsRes.doubts || []);
      setCourses(coursesRes.courses || []);
    } catch (err) {
      setError(err.message || 'Failed to load doubts data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Ask Doubt Submit (Student)
  const handleAskSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.question.trim()) {
      alert('Please provide both a title and a detailed question.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/doubts', formData);
      setFormData({ title: '', question: '', courseId: '' });
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to send doubt');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Reply Submit (Teacher or Student)
  const handleSendReply = async (doubtId) => {
    const text = replyText[doubtId];
    if (!text || !text.trim()) return;

    try {
      setSendingReply((prev) => ({ ...prev, [doubtId]: true }));
      const res = await api.post(`/doubts/${doubtId}/reply`, { message: text });
      
      // Update local state
      setDoubts((prev) =>
        prev.map((d) => (d._id === doubtId ? res.doubt : d))
      );
      setReplyText((prev) => ({ ...prev, [doubtId]: '' }));
    } catch (err) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setSendingReply((prev) => ({ ...prev, [doubtId]: false }));
    }
  };

  // Toggle status between pending & resolved
  const handleToggleStatus = async (doubtId, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'resolved' : 'pending';
    try {
      const res = await api.patch(`/doubts/${doubtId}/status`, { status: newStatus });
      setDoubts((prev) =>
        prev.map((d) => (d._id === doubtId ? res.doubt : d))
      );
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Delete Doubt
  const handleDeleteDoubt = async (doubtId) => {
    if (!window.confirm('Are you sure you want to delete this doubt?')) return;
    try {
      await api.delete(`/doubts/${doubtId}`);
      setDoubts((prev) => prev.filter((d) => d._id !== doubtId));
    } catch (err) {
      alert(err.message || 'Failed to delete doubt');
    }
  };

  // Filtered Doubts List
  const filteredDoubts = doubts.filter((d) => {
    if (filter === 'pending') return d.status === 'pending';
    if (filter === 'resolved') return d.status === 'resolved';
    return true;
  });

  const pendingCount = doubts.filter((d) => d.status === 'pending').length;
  const resolvedCount = doubts.filter((d) => d.status === 'resolved').length;

  return (
    <div className="doubts-container">
      {/* Header */}
      <header className="doubts-header animate-fade-in-up">
        <div>
          <h1 className="doubts-title">
            ❓ {isTeacher ? 'Student Doubts & Q&A Management' : 'Ask Doubts & Q&A Workspace'}
          </h1>
          <p className="doubts-subtitle">
            {isTeacher
              ? 'Review student questions, provide expert clarifications, and mark resolved'
              : 'Post your learning doubts directly to your teachers and track replies'}
          </p>
        </div>

        {!isTeacher && (
          <button className="ask-doubt-btn" onClick={() => setShowModal(true)}>
            ✍️ Ask New Doubt
          </button>
        )}
      </header>

      {/* Filter Tabs & Counter Bar */}
      <div className="doubts-filter-bar animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="filter-tabs">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Doubts ({doubts.length})
          </button>
          <button
            className={`filter-btn pending ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            🟡 Pending ({pendingCount})
          </button>
          <button
            className={`filter-btn resolved ${filter === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilter('resolved')}
          >
            🟢 Resolved ({resolvedCount})
          </button>
        </div>
      </div>

      {/* Loading & Empty State */}
      {loading ? (
        <div className="doubts-loading">
          <div className="spinner"></div>
          <p>Loading doubts workspace...</p>
        </div>
      ) : filteredDoubts.length === 0 ? (
        <div className="doubts-empty-state glass-card">
          <div className="empty-icon">💬</div>
          <h3>No doubts found</h3>
          <p>
            {isTeacher
              ? 'No student doubts match the selected filter.'
              : 'You haven’t submitted any doubts yet. Click "Ask New Doubt" to get help from your teacher!'}
          </p>
        </div>
      ) : (
        <div className="doubts-list animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {filteredDoubts.map((doubt) => (
            <div key={doubt._id} className={`doubt-card glass-card ${doubt.status}`}>
              {/* Card Top Row */}
              <div className="dc-header">
                <div className="dc-meta">
                  <div className="dc-avatar">
                    {doubt.student?.name ? doubt.student.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <h4 className="dc-student-name">
                      {doubt.student?.name || 'Student'}
                      {isTeacher && <span className="dc-email"> ({doubt.student?.email})</span>}
                    </h4>
                    <span className="dc-time">
                      {new Date(doubt.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="dc-actions">
                  {doubt.course?.title && (
                    <span className="dc-course-badge">📚 {doubt.course.title}</span>
                  )}
                  <span className={`dc-status-badge ${doubt.status}`}>
                    {doubt.status === 'pending' ? '🟡 Pending' : '🟢 Resolved'}
                  </span>

                  {isTeacher && (
                    <button
                      className="dc-toggle-btn"
                      onClick={() => handleToggleStatus(doubt._id, doubt.status)}
                      title="Toggle status"
                    >
                      {doubt.status === 'pending' ? 'Mark Resolved' : 'Reopen'}
                    </button>
                  )}

                  {(isTeacher || doubt.student?._id === user?.id) && (
                    <button
                      className="dc-delete-btn"
                      onClick={() => handleDeleteDoubt(doubt._id)}
                      title="Delete Doubt"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              {/* Question Details */}
              <div className="dc-body">
                <h3 className="dc-title">{doubt.title}</h3>
                <p className="dc-question">{doubt.question}</p>
              </div>

              {/* Replies Thread */}
              {doubt.replies && doubt.replies.length > 0 && (
                <div className="dc-replies">
                  <h4 className="dc-replies-heading">💬 Discussion Thread ({doubt.replies.length})</h4>
                  {doubt.replies.map((reply, idx) => (
                    <div
                      key={idx}
                      className={`reply-bubble ${
                        reply.senderRole === 'teacher' ? 'teacher-reply' : 'student-reply'
                      }`}
                    >
                      <div className="reply-header">
                        <span className="reply-author">
                          {reply.senderRole === 'teacher' ? '🎓 ' : '👤 '}
                          {reply.senderName}
                          {reply.senderRole === 'teacher' && <span className="teacher-badge">Teacher</span>}
                        </span>
                        <span className="reply-time">
                          {new Date(reply.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="reply-message">{reply.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Reply Input Box */}
              <div className="dc-reply-box">
                <input
                  type="text"
                  className="reply-input"
                  placeholder={
                    isTeacher
                      ? 'Type answer to clarify this student doubt...'
                      : 'Type follow-up response...'
                  }
                  value={replyText[doubt._id] || ''}
                  onChange={(e) =>
                    setReplyText((prev) => ({ ...prev, [doubt._id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply(doubt._id);
                    }
                  }}
                />
                <button
                  className="send-reply-btn"
                  onClick={() => handleSendReply(doubt._id)}
                  disabled={sendingReply[doubt._id] || !replyText[doubt._id]?.trim()}
                >
                  {sendingReply[doubt._id] ? 'Sending...' : 'Reply 🚀'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ask Doubt Modal (Student) */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✍️ Ask a New Doubt</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ✖
              </button>
            </div>

            <form onSubmit={handleAskSubmit} className="ask-doubt-form">
              <div className="form-group">
                <label>Related Course (Optional)</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                >
                  <option value="">General Question (No specific course)</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Topic / Question Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Clarification on Time Complexity of QuickSort"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Detailed Question *</label>
                <textarea
                  rows="5"
                  placeholder="Describe your doubt in detail so your teacher can give a clear answer..."
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Submit Doubt 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doubts;
