import { useState, useEffect } from 'react';
import { SiteHeader } from '../components/ui/SiteHeader';
import { HomepageContent } from '../components/HomepageContent';
import { fetchMandapams, fetchFeaturedMandapams } from '../services/api';
import type { Mandapam } from '../types/mandapam';

export function HomePage() {
  const [allMandapams, setAllMandapams] = useState<Mandapam[]>([]);
  const [featuredMandapams, setFeaturedMandapams] = useState<Mandapam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [all, featured] = await Promise.all([
          fetchMandapams(),
          fetchFeaturedMandapams(),
        ]);
        if (mounted) {
          setAllMandapams(all);
          setFeaturedMandapams(featured);
        }
      } catch (err) {
        console.error('Failed to load mandapams:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <SiteHeader />

      <main>
        {isLoading ? (
          <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span className="empty-state-icon" style={{ animation: 'spin 2s linear infinite' }}>🕉️</span>
            <p className="empty-state-text">Loading Ganesh Mandapams…</p>
          </div>
        ) : (
          <HomepageContent
            allMandapams={allMandapams}
            featuredMandapams={featuredMandapams}
          />
        )}
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
