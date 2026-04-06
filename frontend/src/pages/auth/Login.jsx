import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const user = await login(form);
      navigate(user.role === 'coach' ? '/coach/dashboard' : user.role === 'owner' ? '/owner/courts' : '/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-shell auth-shell">
      <Card title="Welcome back" subtitle="Log in to manage bookings, sessions, and facilities.">
        <form className="grid-form" onSubmit={handleSubmit}>
          <Input label="Username" name="username" value={form.username} onChange={handleChange} required />
          <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} required />
          {error && <p className="form-error">{error}</p>}
          <Button type="submit">Login</Button>
        </form>
      </Card>
    </div>
  );
}
