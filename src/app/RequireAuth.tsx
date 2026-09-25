import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import Spinner from '@/components/UI/Spinner'

export default function RequireAuth() {
  const { isAuthenticated, loading, recoveryMode } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="app-loading">
        <Spinner label="Carregando..." size={56} />
      </div>
    )
  }

  // O link do e-mail de recuperação já cria uma sessão válida. Mandar para a
  // troca de senha antes de liberar o resto do app.
  if (recoveryMode && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
