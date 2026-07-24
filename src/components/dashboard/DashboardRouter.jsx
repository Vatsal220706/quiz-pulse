import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Dashboard from './Dashboard';
import TeacherDashboard from './TeacherDashboard';

const DashboardRouter = () => {
  const { user } = useAuth();

  if (user?.role === 'teacher') {
    return <TeacherDashboard />;
  }

  return <Dashboard />;
};

export default DashboardRouter;
