import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './TeacherCourses.css';

const TeacherCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    link: '',
    sequence: 1,
  });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await api.get('/courses');
      setCourses(data.courses || []);
    } catch (err) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCourse(null);
    setFormData({
      title: '',
      link: '',
      sequence: courses.length + 1,
    });
    setShowModal(true);
    setError('');
  };

  const handleOpenEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      link: course.link,
      sequence: course.sequence,
    });
    setShowModal(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.link.trim()) {
      setError('Course title and link are required.');
      return;
    }

    try {
      if (editingCourse) {
        await api.put(`/courses/${editingCourse._id}`, formData);
      } else {
        await api.post('/courses', formData);
      }
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      setError(err.message || 'Failed to save course');
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.delete(`/courses/${courseId}`);
      fetchCourses();
    } catch (err) {
      alert(err.message || 'Failed to delete course');
    }
  };

  return (
    <div className="teacher-courses-container">
      <header className="tc-header">
        <div>
          <h1 className="tc-title">📚 Course Management</h1>
          <p className="tc-subtitle">Add & sequence learning courses for your students</p>
        </div>
        <button className="tc-add-btn" onClick={handleOpenAddModal}>
          ➕ Add Course
        </button>
      </header>

      {error && !showModal && <div className="tc-alert error">⚠️ {error}</div>}

      {loading ? (
        <div className="tc-loading">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="tc-empty-card glass-card">
          <div className="tc-empty-icon">📺</div>
          <h3>No Courses Added Yet</h3>
          <p>Click "Add Course" to upload links and set sequence numbers for your students.</p>
          <button className="tc-add-btn" onClick={handleOpenAddModal}>
            ➕ Add First Course
          </button>
        </div>
      ) : (
        <div className="tc-grid">
          {courses.map((course) => (
            <div className="tc-card glass-card" key={course._id}>
              <div className="tc-thumbnail-wrapper">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="tc-thumbnail" />
                ) : (
                  <div className="tc-thumbnail-placeholder">
                    <span>▶ Course #{course.sequence}</span>
                  </div>
                )}
                <span className="tc-seq-badge">#{course.sequence}</span>
              </div>
              <div className="tc-card-body">
                <h3 className="tc-card-title">{course.title}</h3>
                <a
                  href={course.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tc-link"
                  title={course.link}
                >
                  🔗 {course.link}
                </a>
                <div className="tc-card-actions">
                  <button className="tc-btn edit" onClick={() => handleOpenEditModal(course)}>
                    ✏️ Edit
                  </button>
                  <button className="tc-btn delete" onClick={() => handleDelete(course._id)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="tc-modal-overlay">
          <div className="tc-modal glass-card animate-fade-in-up">
            <div className="tc-modal-header">
              <h2>{editingCourse ? '✏️ Edit Course' : '➕ Add New Course'}</h2>
              <button className="tc-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="tc-form">
              {error && <div className="tc-alert error">⚠️ {error}</div>}

              <div className="tc-form-group">
                <label>Course Title</label>
                <input
                  type="text"
                  placeholder="e.g. Intro to JavaScript & React"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="tc-form-group">
                <label>Course Link (e.g. YouTube Video / Playlist URL)</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
                <span className="tc-form-hint">YouTube links will automatically generate thumbnail cards</span>
              </div>

              <div className="tc-form-group">
                <label>Sequence Number (Completion Order)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.sequence}
                  onChange={(e) => setFormData({ ...formData, sequence: parseInt(e.target.value) || 1 })}
                />
                <span className="tc-form-hint">Students must complete courses in numerical sequence order</span>
              </div>

              <div className="tc-modal-actions">
                <button type="button" className="tc-btn cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="tc-btn submit">
                  {editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherCourses;
