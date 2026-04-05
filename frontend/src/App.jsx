import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Home from './pages/player/Home';
import Search from './pages/player/Search';
import Booking from './pages/player/Booking';
import Profile from './pages/player/Profile';
import Dashboard from './pages/coach/Dashboard';
import Schedule from './pages/coach/Schedule';
import Courts from './pages/owner/Courts';
import ManageBookings from './pages/owner/ManageBookings';

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/search" element={<Search />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/coach/dashboard" element={<Dashboard />} />
        <Route path="/coach/schedule" element={<Schedule />} />
        <Route path="/owner/courts" element={<Courts />} />
        <Route path="/owner/manage-bookings" element={<ManageBookings />} />
      </Routes>
    </div>
  );
}

export default App;
