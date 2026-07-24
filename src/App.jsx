import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import Courses from './pages/Courses';
import JoinQuiz from './pages/JoinQuiz';
import CompetitiveRounds from './pages/CompetitiveRounds';
import Leaderboard from './pages/Leaderboard';
import QuizReports from './pages/QuizReports';

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
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/join-quiz" element={<JoinQuiz />} />
                <Route path="/competitive" element={<CompetitiveRounds />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/reports" element={<QuizReports />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
