import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminLogin, checkAdminAuth } from '../../services/adminApi';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    let mounted = true;
    checkAdminAuth().then((res) => {
      if (mounted && res.authenticated) {
        navigate('/admin', { replace: true });
      }
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await adminLogin(email.trim(), password);
      if (!res.success) {
        setError(res.error || 'Invalid credentials. Please try again.');
        setIsLoading(false);
        return;
      }
      navigate('/admin', { replace: true });
    } catch {
      setError('An unexpected error occurred during login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="header-brand">
            <span className="header-logo" aria-hidden="true">🕉️</span>
            <span className="header-name">
              <span className="header-name-main">Ganesh Darshan</span>
              <span className="header-name-sub">Admin Portal</span>
            </span>
          </Link>
          <Link to="/" className="btn btn-ghost btn-sm">
            ← Back to Site
          </Link>
        </div>
      </header>

      <main className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <span className="admin-login-icon">🔒</span>
            <h1 className="admin-login-title">Admin Moderation Login</h1>
            <p className="admin-login-sub">
              Access the private moderation queue to review and manage pandal listings.
            </p>
          </div>

          {error && (
            <div className="submit-banner-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="form-group">
              <label htmlFor="admin-email" className="form-label">
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ganeshdarshan.hyderabad"
                required
                autoComplete="email"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-password" className="form-label">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-large w-full mt-2"
              aria-busy={isLoading}
            >
              {isLoading ? '⏳ Verifying…' : 'Sign In to Moderation'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
