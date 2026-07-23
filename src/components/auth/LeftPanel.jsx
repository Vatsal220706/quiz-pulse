export default function LeftPanel() {
  return (
    <div className="left-panel">
      {/* Brand */}
      <div className="brand">
        <div className="brand-logo">
          <div className="logo-icon">⚡</div>
          <h1 className="brand-name">Quiz Pulse</h1>
        </div>
        <p className="brand-tagline">
          The real-time learning platform that bridges the gap between teaching and understanding.
          Students discover how much they truly know, while teachers feel the pulse of their
          classroom — seeing exactly where concepts click and where they need to revisit.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="features">
        <div className="feature-card">
          <div className="feature-icon cyan">🎯</div>
          <div className="feature-info">
            <h3>Real-Time Quizzes</h3>
            <p>Engage students with live, interactive quizzes that provide instant feedback and keep the energy high.</p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon purple">📊</div>
          <div className="feature-info">
            <h3>Smart Analytics</h3>
            <p>Teachers get detailed insights into student performance — spot gaps, track progress, and adapt lessons on the fly.</p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon blue">💡</div>
          <div className="feature-info">
            <h3>Live Pulse Tracking</h3>
            <p>See the heartbeat of your classroom in real-time. Know who's catching up and who needs extra support — instantly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
