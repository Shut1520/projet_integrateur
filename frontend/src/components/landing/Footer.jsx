import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer(){
  return (
    <footer className="lp-footer scroll-reveal sr-footer" data-idx="0">
      <div className="container lp-footer-inner">
        <div className="footer-brand">
          <div className="lp-logo">SAI</div>
          <p className="muted">Système Agricole Intelligent — monitoring et automatisation pour exploitations modernes.</p>
        </div>
        <div className="footer-columns">
          <div>
            <h5>Solutions</h5>
            <ul>
              <li><a href="#overview">Surveillance</a></li>
              <li><a href="#terrain">Automatisation</a></li>
            </ul>
          </div>
          <div>
            <h5>Entreprise</h5>
            <ul>
              <li><Link to="/register">S'inscrire</Link></li>
              <li><Link to="/login">Se connecter</Link></li>
            </ul>
          </div>
          <div>
            <h5>Légal</h5>
            <ul>
              <li><a href="#">Mentions</a></li>
              <li><a href="#">Confidentialité</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="lp-footer-bottom">
        <div className="container">© {new Date().getFullYear()} SAI — Tous droits réservés</div>
      </div>
    </footer>
  );
}
