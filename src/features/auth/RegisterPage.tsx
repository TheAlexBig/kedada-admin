import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { getApiErrorMessage } from '../../api/httpClient';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ErrorState } from '../../components/common/StatusMessage';
import { AuthShell } from './AuthShell';

export function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setFieldError('La contrasena debe tener al menos 8 caracteres.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFieldError(null);
      await register({ name, email, password });
      navigate('/admin');
    } catch (registerError) {
      setError(getApiErrorMessage(registerError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Crear cuenta" description="Registra una cuenta para administrar tus propios eventos y catalogos.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && <ErrorState message={error} />}
        <Input
          label="Nombre"
          name="name"
          required
          maxLength={100}
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          label="Correo electronico"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          label="Contrasena"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          value={password}
          error={fieldError ?? undefined}
          helperText="Debe tener entre 8 y 72 caracteres."
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldError(null);
          }}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-stone-600">
        Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-rose-700 hover:text-rose-800">
          Iniciar sesion
        </Link>
      </p>
    </AuthShell>
  );
}
