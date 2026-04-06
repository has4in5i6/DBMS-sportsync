import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link className="brand" to="/">SportSync</Link>
      <div className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/search">Search</NavLink>
        <NavLink to="/booking">Booking</NavLink>
        <NavLink to="/profile">Profile</NavLink>
        {user?.role === 'coach' && <NavLink to="/coach/dashboard">Coach</NavLink>}
        {user?.role === 'owner' && <NavLink to="/owner/courts">Owner</NavLink>}
      </div>
      <div className="nav-actions">
        {user ? (
          <>
            <span className="badge">{user.role}</span>
            <span className="user-pill">{user.fullName}</span>
            <Button variant="ghost" onClick={handleLogout}>Logout</Button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <Button onClick={() => navigate('/signup')}>Sign up</Button>
          </>
        )}
      </div>
    </nav>
  );
}
