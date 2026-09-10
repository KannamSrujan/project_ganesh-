import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/ui/SiteHeader';
import { SubmitMandapamForm } from '../components/submit/SubmitMandapamForm';

export function SubmitPage() {
  return (
    <>
      <SiteHeader />

      {/* Sub-nav back bar */}
      <nav className="detail-nav-bar" aria-label="Breadcrumb">
        <div className="container">
          <Link to="/" className="detail-back-link">
            ← Explore Mandapams
          </Link>
        </div>
      </nav>

      <main className="submit-page">
        <div className="submit-container">
          <header className="submit-header">
            <h1 className="submit-title">
              Know a Ganesh Mandapam We're Missing?
            </h1>
            <p className="submit-subtext">
              Help other Hyderabad residents discover it.
            </p>
          </header>

          <SubmitMandapamForm />
        </div>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p className="footer-text">
            © {new Date().getFullYear()} Ganesh Darshan Hyderabad
          </p>
          <p className="footer-subtext">
            Community-driven directory of Ganesh mandapams across Hyderabad.
          </p>
        </div>
      </footer>
    </>
  );
}
