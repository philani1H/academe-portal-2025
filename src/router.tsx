import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Login from './pages/auth/Login';
import StudentPortal from './pages/student/StudentPortal';
import TutorDashboard from './pages/tutor/TutorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AboutUs from './pages/AboutUs';
import Plan from './pages/Plan';
import Subjects from './pages/Subjects';
import Research from './pages/Research';
import Library from './pages/Library';
import Events from './pages/Events';
import BecomeTutor from './pages/BecomeTutor';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: 'about-us', element: <AboutUs /> },
      { path: 'plan', element: <Plan /> },
      { path: 'subjects', element: <Subjects /> },
      { path: 'research', element: <Research /> },
      { path: 'library', element: <Library /> },
      { path: 'events', element: <Events /> },
      { path: 'become-tutor', element: <BecomeTutor /> },
      { path: 'student-portal', element: <StudentPortal /> },
      { path: 'tutors-dashboard', element: <TutorDashboard /> },
      { path: 'admin', element: <AdminDashboard /> },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
]);