import { Link } from 'react-router-dom';

interface SiteHeaderProps {
  exploreHref?: string;
}

export function SiteHeader({ exploreHref = '/#all-mandapams' }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="header-brand" aria-label="Ganesh Darshan Hyderabad home">
          <span className="header-logo" aria-hidden="true">🕉️</span>
          <span className="header-name">
            <span className="header-name-main">Ganesh Darshan</span>
            <span className="header-name-sub">Hyderabad</span>
          </span>
        </Link>

        <nav className="header-nav" aria-label="Site navigation">
          {exploreHref.startsWith('/#') ? (
            <a href={exploreHref} className="header-nav-link">
              Explore
            </a>
          ) : (
            <Link to={exploreHref} className="header-nav-link">
              Explore
            </Link>
          )}
          <Link to="/submit" className="btn btn-primary btn-sm">
            ➕ Add Mandapam
          </Link>
        </nav>
      </div>
    </header>
  );
}
