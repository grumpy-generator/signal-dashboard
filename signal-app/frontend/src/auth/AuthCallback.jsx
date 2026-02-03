import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleCallback(token);
      navigate('/');
    } else {
      navigate('/login?error=auth_failed');
    }
  }, [searchParams, handleCallback, navigate]);

  return (
    <div className="login-container">
      <div className="login-loading">
        <div className="login-logo">
          <span className="login-logo-icon">◉</span>
          <span className="login-logo-ring" />
        </div>
        <p>Authenticating...</p>
      </div>
    </div>
  );
}
