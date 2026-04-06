import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Onboarding from './pages/auth/Onboarding';
import Signup from './pages/auth/Signup';
import Home from './pages/player/Home';
import Search from './pages/player/Search';
import Booking from './pages/player/Booking';
import Profile from './pages/player/Profile';
import GroupDetails from './pages/player/GroupDetails';
import Dashboard from './pages/coach/Dashboard';
import Schedule from './pages/coach/Schedule';
import Courts from './pages/owner/Courts';
import ManageBookings from './pages/owner/ManageBookings';
import './App.css';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-shell"><p>Loading session...</p></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <div className="app-container">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/onboarding"
          element={(
            <ProtectedRoute roles={['coach', 'owner']}>
              <Onboarding />
            </ProtectedRoute>
          )}
        />
        <Route path="/search" element={<Search />} />
        <Route
          path="/booking"
          element={(
            <ProtectedRoute roles={['player']}>
              <Booking />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/profile"
          element={(
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          )}
        />
        <Route path="/groups/:groupId" element={<GroupDetails />} />
        <Route
          path="/coach/dashboard"
          element={(
            <ProtectedRoute roles={['coach']}>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/coach/schedule"
          element={(
            <ProtectedRoute roles={['coach']}>
              <Schedule />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/owner/courts"
          element={(
            <ProtectedRoute roles={['owner']}>
              <Courts />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/owner/manage-bookings"
          element={(
            <ProtectedRoute roles={['owner']}>
              <ManageBookings />
            </ProtectedRoute>
          )}
        />
      </Routes>
    </div>
  );
}
