import { useEffect } from 'react';

export default function ScrollReveal(){
  useEffect(() => {
    const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Helper: find or add scroll-reveal markers to common landing elements
    const ensureMarkers = () => {
      // Hero visual
      const hero = document.querySelector('.lp-hero-visual');
      if (hero && !hero.classList.contains('scroll-reveal')) hero.classList.add('scroll-reveal');

      // Overview cards
      const overview = Array.from(document.querySelectorAll('.system-overview .lp-card'));
      overview.forEach((el, i) => { if (!el.classList.contains('scroll-reveal')) { el.classList.add('scroll-reveal'); el.setAttribute('data-idx', String(i)); } });

      // Terrain columns
      const terrainCols = Array.from(document.querySelectorAll('#terrain .col'));
      terrainCols.forEach((el, i) => { if (!el.classList.contains('scroll-reveal')) el.classList.add('scroll-reveal'); if (!el.getAttribute('data-idx')) el.setAttribute('data-idx', String(i)); });

      // Team cards (some already have it in JSX)
      const teamCards = Array.from(document.querySelectorAll('.team-card'));
      teamCards.forEach((el, i) => { if (!el.classList.contains('scroll-reveal')) el.classList.add('scroll-reveal'); if (!el.getAttribute('data-idx')) el.setAttribute('data-idx', String(i)); });

      // Footer
      const footer = document.querySelector('.lp-footer');
      if (footer && !footer.classList.contains('scroll-reveal')) { footer.classList.add('scroll-reveal'); if (!footer.getAttribute('data-idx')) footer.setAttribute('data-idx', '0'); }
    };

    const nodes = () => Array.from(document.querySelectorAll('.scroll-reveal'));
    if (prefersReduce) {
      ensureMarkers();
      nodes().forEach(n => n.classList.add('is-visible'));
      return;
    }

    ensureMarkers();
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const el = entry.target;
        const idx = Number(el.getAttribute('data-idx')) || 0;
        if (entry.isIntersecting) {
          // stagger via inline delay
          el.style.transitionDelay = `${idx * 80}ms`;
          el.classList.add('is-visible');
        } else {
          el.classList.remove('is-visible');
          el.style.transitionDelay = '';
        }
      });
    }, { threshold: 0.12 });

    nodes().forEach(n => io.observe(n));
    return () => io.disconnect();
  }, []);

  return null;
}
