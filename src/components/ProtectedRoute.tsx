import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../auth';
import { AUTH_REQUIRED_MESSAGE } from '../routes/constants';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          flashMessage: AUTH_REQUIRED_MESSAGE,
          redirectAfterLogin: location.pathname,
        }}
      />
    );
  }

  return <>{children}</>;
}
