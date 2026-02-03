import { useAuth } from './AuthContext';
import { Navigate } from 'react-router-dom';

export function LoginPage() {
  const { loginWithX, loginDemo, error, loading, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <span className="login-logo-icon">◉</span>
            <span className="login-logo-ring" />
          </div>
          <h1 className="login-title">SIGNAL</h1>
          <p className="login-subtitle">Feedback Intelligence Dashboard</p>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <div className="login-buttons">
          <button onClick={loginWithX} className="login-btn login-btn-x">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>Continue with X</span>
          </button>

          <div className="login-divider">
            <span>or</span>
          </div>

          <button onClick={loginDemo} className="login-btn login-btn-demo">
            <span>⚡</span>
            <span>Demo Login</span>
          </button>
        </div>

        <p className="login-footer">
          Sign in to access the Signal dashboard and manage feedback signals in real-time.
        </p>
      </div>
    </div>
  );
}
