import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import { getApiErrorMessage } from '../../api/httpClient';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ErrorState } from '../../components/common/StatusMessage';
import { AuthShell } from './AuthShell';

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);
      await login({ email, password });
      navigate('/admin');
    } catch (loginError) {
      setError(getApiErrorMessage(loginError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Iniciar sesion" description="Ingresa con tu cuenta para crear y editar contenido.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && <ErrorState message={error} />}
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
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-stone-600">
        No tienes cuenta?{' '}
        <Link to="/register" className="font-semibold text-rose-700 hover:text-rose-800">
          Crear cuenta
        </Link>
      </p>
    </AuthShell>
  );
}
