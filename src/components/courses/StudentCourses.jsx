import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import CourseViewerModal from './CourseViewerModal';
import './StudentCourses.css';

const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [progressMap, setProgressMap] = useState({}); // { courseId: progressObj }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCourse, setActiveCourse] = useState(null); // Course currently open in viewer modal

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, progressRes] = await Promise.all([
        api.get('/courses'),
        api.get('/courses/progress'),
      ]);

      const fetchedCourses = coursesRes.courses || [];
      // Sort by sequence ascending
      fetchedCourses.sort((a, b) => a.sequence - b.sequence);
      setCourses(fetchedCourses);

      // Create lookup map for progress
      const pMap = {};
      (progressRes.progress || []).forEach((p) => {
        pMap[p.course] = p;
      });
      setProgressMap(pMap);
    } catch (err) {
      setError(err.message || 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute unlock status for each course in sequence
  const getCourseStatus = (course, index) => {
    const p = progressMap[course._id];
    const isCompleted = p?.completed || false;
    const isStarted = !!p;

    // Course is unlocked if it's the first course OR if the previous course in sequence is completed
    let isUnlocked = false;
    if (index === 0) {
      isUnlocked = true;
    } else {
      const prevCourse = courses[index - 1];
      const prevProgress = progressMap[prevCourse._id];
      if (prevProgress?.completed) {
        isUnlocked = true;
      }
    }

    return { isCompleted, isUnlocked, isStarted };
  };

  const handleOpenCourseViewer = async (course) => {
    try {
      // Mark as started in backend if not already started
      if (!progressMap[course._id]) {
        await api.post(`/courses/${course._id}/start`);
        fetchData();
      }
      setActiveCourse(course);
    } catch (err) {
      alert(err.message || 'Failed to start course');
    }
  };

  const handleCourseCompleted = (courseId) => {
    fetchData(); // Refresh progress map so next course unlocks
  };

  const completedCount = Object.values(progressMap).filter((p) => p.completed).length;

  return (
    <div className="student-courses-container">
      <header className="sc-header">
        <div>
          <h1 className="sc-title">📚 Course Roadmap</h1>
          <p className="sc-subtitle">Complete 50% of each course to automatically unlock the next level</p>
        </div>
        <div className="sc-progress-badge">
          <span>🏆 Progress: {completedCount} / {courses.length} Completed</span>
          <div className="sc-progress-bar-track">
            <div
              className="sc-progress-bar-fill"
              style={{
                width: `${courses.length ? (completedCount / courses.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </header>

      {error && <div className="sc-alert error">⚠️ {error}</div>}

      {loading ? (
        <div className="sc-loading">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="sc-empty-card glass-card">
          <div className="sc-empty-icon">🎓</div>
          <h3>No Courses Available Yet</h3>
          <p>Your teacher has not uploaded any courses yet. Check back soon!</p>
        </div>
      ) : (
        <div className="sc-grid">
          {courses.map((course, index) => {
            const { isCompleted, isUnlocked, isStarted } = getCourseStatus(course, index);

            return (
              <div
                className={`sc-card glass-card ${
                  isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked'
                }`}
                key={course._id}
              >
                <div className="sc-thumbnail-wrapper">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className={`sc-thumbnail ${!isUnlocked ? 'grayscale' : ''}`}
                    />
                  ) : (
                    <div className="sc-thumbnail-placeholder">
                      <span>▶ Course #{course.sequence}</span>
                    </div>
                  )}

                  {/* Status Badge on Thumbnail */}
                  <span className={`sc-status-badge ${isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked'}`}>
                    {isCompleted ? '✅ Completed' : isUnlocked ? '🔓 Unlocked' : '🔒 Locked'}
                  </span>

                  <span className="sc-seq-badge">#{course.sequence}</span>
                </div>

                <div className="sc-card-body">
                  <h3 className="sc-card-title">{course.title}</h3>
                  <span className="sc-teacher-tag">
                    By {course.createdBy?.name || 'Teacher'}
                  </span>

                  <div className="sc-card-actions">
                    {!isUnlocked ? (
                      <button className="sc-btn locked" disabled title="Complete 50% of previous course to unlock">
                        🔒 Complete #{courses[index - 1]?.sequence || 1} First
                      </button>
                    ) : isCompleted ? (
                      <div className="sc-action-group">
                        <button className="sc-btn completed-btn" onClick={() => setActiveCourse(course)}>
                          📖 Review Course
                        </button>
                      </div>
                    ) : (
                      <div className="sc-action-group">
                        <button className="sc-btn start-btn" onClick={() => handleOpenCourseViewer(course)}>
                          {isStarted ? '▶ Continue Course' : '🚀 Start Course'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Course Viewer Modal */}
      {activeCourse && (
        <CourseViewerModal
          course={activeCourse}
          onClose={() => setActiveCourse(null)}
          onComplete={handleCourseCompleted}
          isAlreadyCompleted={progressMap[activeCourse._id]?.completed || false}
        />
      )}
    </div>
  );
};

export default StudentCourses;
