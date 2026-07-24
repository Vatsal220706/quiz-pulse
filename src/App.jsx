import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import DashboardRouter from './components/dashboard/DashboardRouter';

// Student pages
import Courses from './pages/Courses';
import JoinQuiz from './pages/JoinQuiz';
import CompetitiveRounds from './pages/CompetitiveRounds';
import Leaderboard from './pages/Leaderboard';
import QuizReports from './pages/QuizReports';

// Teacher pages
import Announcements from './pages/Announcements';
import Assignments from './pages/Assignments';
import QuizManage from './pages/QuizManage';
import PerformanceReports from './pages/PerformanceReports';
import Doubts from './pages/Doubts';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<AuthPage />} />

            {/* Protected — wrapped in Layout (sidebar + navbar) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                {/* Shared */}
                <Route path="/dashboard" element={<DashboardRouter />} />
                <Route path="/courses" element={<Courses />} />

                {/* Student routes */}
                <Route path="/join-quiz" element={<JoinQuiz />} />
                <Route path="/competitive" element={<CompetitiveRounds />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/reports" element={<QuizReports />} />

                {/* Teacher routes */}
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/assignments" element={<Assignments />} />
                <Route path="/quiz-manage" element={<QuizManage />} />
                <Route path="/performance" element={<PerformanceReports />} />
                <Route path="/doubts" element={<Doubts />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
