import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SiteHeader } from '../components/ui/SiteHeader';
import { Badge } from '../components/ui/Badge';
import { ShareButton } from '../components/mandapam/ShareButton';
import { SingleMandapamMapWrapper } from '../components/mandapam/SingleMandapamMapWrapper';
import { resolveImageUrl } from '../utils/imageUrl';
import { fetchMandapamById } from '../services/api';
import type { Mandapam } from '../types/mandapam';

export function MandapamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [mandapam, setMandapam] = useState<Mandapam | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadMandapam() {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchMandapamById(id);
        if (!mounted) return;

        if (!data || data.status !== 'approved') {
          setNotFound(true);
        } else {
          setMandapam(data);
          document.title = `${data.name} | Ganesh Darshan Hyderabad`;
        }
      } catch {
        if (mounted) setNotFound(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMandapam();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <>
        <SiteHeader />
        <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span className="empty-state-icon">🕉️</span>
          <p className="empty-state-text">Loading mandapam details…</p>
        </div>
      </>
    );
  }

  if (notFound || !mandapam) {
    return (
      <>
        <SiteHeader />
        <main className="detail-page">
          <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span className="empty-state-icon">🔍</span>
            <h2>Mandapam Not Found</h2>
            <p className="empty-state-text">
              The requested Ganesh mandapam could not be found or has not been verified yet.
            </p>
            <Link to="/" className="btn btn-primary mt-4">
              ← Back to Explore
            </Link>
          </div>
        </main>
      </>
    );
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mandapam.latitude},${mandapam.longitude}`;
  const displayImage = resolveImageUrl(mandapam.image_url);

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

      <main className="detail-page">
        <article className="detail-container">
          {/* 1. HERO IMAGE */}
          <div className="detail-hero-wrapper">
            {displayImage ? (
              <img
                src={displayImage}
                alt={mandapam.name}
                className="detail-hero-img"
              />
            ) : (
              <div className="detail-hero-fallback" aria-hidden="true">
                <span className="detail-hero-fallback-icon">🕉️</span>
              </div>
            )}
          </div>

          {/* 2. TITLE & BADGES */}
          <div className="detail-header-block">
            <div className="detail-badges-row">
              {mandapam.is_featured && (
                <Badge variant="featured">⭐ Featured Mandapam</Badge>
              )}
              {mandapam.is_verified && (
                <Badge variant="verified">✓ Verified</Badge>
              )}
            </div>

            <h1 className="detail-title">{mandapam.name}</h1>
          </div>

          {/* 3. LOCATION BLOCK */}
          <section className="detail-location-card" aria-label="Location details">
            <div className="detail-location-primary">
              <span className="detail-location-pin" aria-hidden="true">
                📍
              </span>
              <span>{mandapam.area}, Hyderabad</span>
            </div>
            {mandapam.address && (
              <p className="detail-location-address">{mandapam.address}</p>
            )}
          </section>

          {/* 4. PRIMARY ACTIONS */}
          <div className="detail-actions" aria-label="Primary actions">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-large"
              aria-label={`Get directions to ${mandapam.name} on Google Maps`}
            >
              📍 Get Directions
            </a>
            <ShareButton
              mandapamName={mandapam.name}
              area={mandapam.area}
              className="btn btn-secondary btn-large"
            />
          </div>

          {/* 5. INDIVIDUAL MAP */}
          <section className="detail-section" aria-label="Mandapam map location">
            <h2 className="detail-section-title">🗺️ Location Map</h2>
            <SingleMandapamMapWrapper
              latitude={mandapam.latitude}
              longitude={mandapam.longitude}
              name={mandapam.name}
              area={mandapam.area}
            />
          </section>

          {/* 6. DESCRIPTION / ABOUT */}
          {mandapam.description && (
            <section className="detail-section" aria-label="About this mandapam">
              <h2 className="detail-section-title">ℹ️ About this Mandapam</h2>
              <div className="detail-about-card">
                <p className="detail-about-text">{mandapam.description}</p>
              </div>
            </section>
          )}

          {/* 7. SHARE INVITE CARD */}
          <section className="detail-share-card" aria-label="Share with others">
            <div className="detail-share-content">
              <h2 className="detail-share-title">Visiting with family & friends?</h2>
              <p className="detail-share-subtext">
                Share this mandapam location and darshan details easily.
              </p>
            </div>
            <ShareButton
              mandapamName={mandapam.name}
              area={mandapam.area}
              className="btn btn-primary btn-sm"
            />
          </section>

          {/* 8. EXPLORE MORE CTA */}
          <div className="detail-bottom-cta">
            <Link to="/" className="btn btn-outline">
              ← Back to All Mandapams
            </Link>
          </div>
        </article>
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
