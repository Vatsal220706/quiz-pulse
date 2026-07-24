import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import './CourseViewerModal.css';

function getYouTubeVideoId(url) {
  try {
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('v');
    } else if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split(/[?&#]/)[0];
    } else if (url.includes('youtube.com/embed/')) {
      return url.split('youtube.com/embed/')[1]?.split(/[?&#]/)[0];
    }
  } catch (e) {
    // ignore
  }
  return null;
}

const CourseViewerModal = ({ course, onClose, onComplete, isAlreadyCompleted }) => {
  const videoId = getYouTubeVideoId(course.link);

  const [completed, setCompleted] = useState(isAlreadyCompleted);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchTime, setWatchTime] = useState(0); // active playback seconds watched
  const [videoDuration, setVideoDuration] = useState(0); // total video length in seconds
  const [playerReady, setPlayerReady] = useState(false);
  const [autoCompleting, setAutoCompleting] = useState(false);

  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const playerContainerIdRef = useRef(`yt-player-${course._id}`);

  // Load YouTube Iframe API script dynamically
  useEffect(() => {
    if (!videoId) return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    let isSubscribed = true;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player(playerContainerIdRef.current, {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          enablejsapi: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            if (!isSubscribed) return;
            setPlayerReady(true);
            const duration = Math.round(event.target.getDuration());
            if (duration > 0) {
              setVideoDuration(duration);
            }
          },
          onStateChange: (event) => {
            if (!isSubscribed) return;
            // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              const duration = Math.round(event.target.getDuration());
              if (duration > 0) {
                setVideoDuration(duration);
              }
            } else {
              setIsPlaying(false);
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
      // Fallback check
      const checkYTInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkYTInterval);
          initPlayer();
        }
      }, 500);
    }

    return () => {
      isSubscribed = false;
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, course._id]);

  // Target required watch time is 50% of total video duration (or default 60s if duration unknown)
  const targetRequiredSeconds = videoDuration > 0 ? Math.round(videoDuration * 0.5) : 60;

  // Active watch time timer — increments ONLY when isPlaying === true
  useEffect(() => {
    if (completed || !isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setWatchTime((prev) => {
        const nextTime = prev + 1;
        
        // Also check actual playback currentTime if player available
        let actualCurrentTime = nextTime;
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          try {
            actualCurrentTime = Math.round(playerRef.current.getCurrentTime());
          } catch (e) {}
        }

        // Completion condition: watched time OR current playback position >= 50% of video duration
        const reached50Percent =
          nextTime >= targetRequiredSeconds || actualCurrentTime >= targetRequiredSeconds;

        if (reached50Percent && !completed && !autoCompleting) {
          triggerCompletion();
        }

        return nextTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, completed, targetRequiredSeconds, autoCompleting]);

  const triggerCompletion = async () => {
    setAutoCompleting(true);
    try {
      await api.post(`/courses/${course._id}/complete`);
      setCompleted(true);
      if (onComplete) onComplete(course._id);
    } catch (err) {
      console.error('Auto completion error:', err);
    } finally {
      setAutoCompleting(false);
    }
  };

  const currentProgressPct = completed
    ? 100
    : Math.min(100, Math.round((watchTime / targetRequiredSeconds) * 100));

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="cv-modal-overlay">
      <div className="cv-modal glass-card animate-fade-in-up">
        {/* Header */}
        <div className="cv-modal-header">
          <div className="cv-header-title">
            <span className="cv-seq-tag">Course #{course.sequence}</span>
            <h2>{course.title}</h2>
          </div>
          <button className="cv-close-btn" onClick={onClose} title="Close Viewer">
            ✕
          </button>
        </div>

        {/* Watch Progress Tracker */}
        <div className={`cv-progress-tracker ${completed ? 'completed' : isPlaying ? 'playing' : 'paused'}`}>
          <div className="cv-progress-info">
            <span className="cv-progress-status">
              {completed ? (
                '🎉 50% Total Video Length Watched — Course Completed & Next Level Unlocked!'
              ) : isPlaying ? (
                `▶ Video Resumed — Watching: ${formatTime(watchTime)} / ${formatTime(targetRequiredSeconds)} (50% of ${formatTime(videoDuration)} Video Length)`
              ) : (
                `⏸️ Video Paused — Resumed Watch Time: ${formatTime(watchTime)} / ${formatTime(targetRequiredSeconds)} (Play video to continue tracking)`
              )}
            </span>
            <span className="cv-progress-pct">{currentProgressPct}%</span>
          </div>

          <div className="cv-progress-track">
            <div
              className={`cv-progress-fill ${completed ? 'completed' : ''}`}
              style={{ width: `${currentProgressPct}%` }}
            />
          </div>
        </div>

        {/* Player Container */}
        <div className="cv-player-container">
          {videoId ? (
            <div id={playerContainerIdRef.current} className="cv-iframe" />
          ) : (
            <div className="cv-external-fallback">
              <p>This course content is hosted externally.</p>
              <a
                href={course.link}
                target="_blank"
                rel="noopener noreferrer"
                className="cv-open-link-btn"
              >
                🔗 Open Course Link in New Tab
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="cv-modal-footer">
          <div className="cv-footer-info">
            {completed ? (
              <span className="cv-badge-complete">✅ Course Completed (50%+ Watched)</span>
            ) : isPlaying ? (
              <span className="cv-badge-in-progress active">
                ▶ Watching Video — {formatTime(targetRequiredSeconds - watchTime > 0 ? targetRequiredSeconds - watchTime : 0)} remaining to reach 50%
              </span>
            ) : (
              <span className="cv-badge-in-progress paused">
                ⏸️ Click Play on the video to resume watch timer
              </span>
            )}
          </div>
          <button className="cv-btn-close" onClick={onClose}>
            {completed ? 'Done' : 'Close Viewer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseViewerModal;
