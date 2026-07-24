import React from 'react';
import { useAuth } from '../context/AuthContext';
import TeacherCourses from '../components/courses/TeacherCourses';
import StudentCourses from '../components/courses/StudentCourses';

const Courses = () => {
  const { user } = useAuth();

  if (user?.role === 'teacher') {
    return <TeacherCourses />;
  }

  return <StudentCourses />;
};

export default Courses;
