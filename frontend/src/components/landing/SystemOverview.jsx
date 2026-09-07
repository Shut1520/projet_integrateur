import React, { useEffect, useRef } from 'react';
import { RadioTower, Cpu, ChartLine } from 'lucide-react';

const Card = ({ icon, title, children, innerRef }) => (
  <div className="lp-card compact" ref={innerRef}>
    <div className="lp-card-icon-box">{icon}</div>
    <h4>{title}</h4>
    <p className="muted small">{children}</p>
  </div>
);

export default function SystemOverview() {
  const refs = useRef([]);
  refs.current = [];

  useEffect(() => {
    const nodes = refs.current;
    if (!nodes.length) return;

    const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduce) {
      nodes.forEach(n => n && n.classList.add('in-view'));
      return;
    }

    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const index = Number(el.getAttribute('data-idx')) || 0;
          el.style.transitionDelay = `${index * 80}ms`;
          el.classList.add('in-view');
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.12 });

    nodes.forEach(n => n && obs.observe(n));
    return () => obs.disconnect();
  }, []);

  const attachRef = (el) => {
    if (el) refs.current.push(el);
  };

  return (
    <div className="system-overview">
        <div className="overview-label"><span>INNOVATION AGRICOLE</span></div>
        <h2>Aperçu du système</h2>
        <div className="lp-grid three-cards">
          <Card innerRef={el => { if(el){ el.setAttribute('data-idx', '0'); attachRef(el); } }} icon={<RadioTower size={22} strokeWidth={1.8} />} title="Surveillance en temps réel">Suivez l'état de vos capteurs et visualisez les mesures instantanément.</Card>
          <Card innerRef={el => { if(el){ el.setAttribute('data-idx', '1'); attachRef(el); } }} icon={<Cpu size={22} strokeWidth={1.8} />} title="Contrôle automatisé">Automatisez vos actionneurs selon des seuils et scénarios personnalisés.</Card>
          <Card innerRef={el => { if(el){ el.setAttribute('data-idx', '2'); attachRef(el); } }} icon={<ChartLine size={22} strokeWidth={1.8} />} title="Analyses précises">Exploitez des données structurées pour prendre des décisions éclairées.</Card>
        </div>
      </div>
  );
}
