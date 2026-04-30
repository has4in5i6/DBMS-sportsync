import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';

const roleOptions = [
  { value: 'player', label: 'Player' },
  { value: 'coach', label: 'Coach' },
  { value: 'owner', label: 'Court Owner' },
];

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'player',
  });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const createdUser = await signup(form);
      navigate(createdUser.role === 'player' ? '/' : '/onboarding');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-shell auth-shell">
      <Card title="Create your SportSync profile" subtitle="Start with the basics now and complete the rest from your profile later.">
        <form className="grid-form" onSubmit={handleSubmit}>
          <Input label="Full name" name="fullName" value={form.fullName} onChange={handleChange} required />
          <Input label="Username" name="username" value={form.username} onChange={handleChange} required />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} required />
          <Input label="Role" as="select" name="role" value={form.role} onChange={handleChange} options={roleOptions} />
          {error && <p className="form-error">{error}</p>}
          <Button type="submit">Create account</Button>
        </form>
      </Card>
    </div>
  );
}
