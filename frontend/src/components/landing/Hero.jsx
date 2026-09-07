import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function Hero() {
  const imgRef = useRef(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduce) {
      img.classList.add('in-view');
      return;
    }

    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    obs.observe(img);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="lp-hero">
      <div className="container lp-hero-inner">
        <div className="lp-hero-copy">
          <h1>Bienvenue sur <span className="accent">SAI</span></h1>
          <p className="lead">Votre partenaire pour une agriculture connectée et intelligente. Transformez vos données du terrain en décisions stratégiques grâce à nos capteurs de pointe.</p>
          <div className="lp-hero-ctas">
            <Link to="/login" className="btn btn-primary">Se connecter</Link>
            <Link to="/register" className="btn btn-ghost">Créer un compte</Link>
          </div>
        </div>
        <div className="lp-hero-visual" aria-hidden>
          <img ref={imgRef} src="/src/assets/landing/ecran.jfif" alt="Aperçu du dashboard SAI" />
        </div>
      </div>
    </section>
  );
}
