import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/ui/SiteHeader';

export function NotFoundPage() {
  return (
    <>
      <SiteHeader />
      <main className="detail-page">
        <div
          className="empty-state"
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="empty-state-icon">4️⃣0️⃣4️⃣</span>
          <h2>Page Not Found</h2>
          <p className="empty-state-text">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link to="/" className="btn btn-primary mt-4">
            ← Return to Home
          </Link>
        </div>
      </main>
    </>
  );
}
