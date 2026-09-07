import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="lp-navbar">
      <div className="lp-nav-inner">
        <div className="lp-brand">
          <Link
            to="/"
            onClick={(e) => {
              try {
                if (window && window.location && window.location.pathname === '/') {
                  e.preventDefault();
                  const root = document.querySelector('.landing-root');
                  if (root && typeof root.scrollTo === 'function') {
                    root.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              } catch (err) {
                // swallow any errors to avoid breaking navigation
              }
            }}
          >
            <img src={theme === 'dark' ? '/src/assets/SAI_logo/logo_welcome_sombre.png' : '/src/assets/SAI_logo/logo_welcome_claire.png'} alt="SAI" className="lp-logo-img" />
          </Link>
        </div>
        <nav className={`lp-nav ${open ? 'open' : ''}`}>
          <a href="#overview" onClick={() => setOpen(false)}>Produit</a>
          <a href="#terrain" onClick={() => setOpen(false)}>Solutions</a>
          <a href="#team" onClick={() => setOpen(false)}>Support</a>
        </nav>
        <div className="lp-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link to="/login" className="btn btn-outline">Se connecter</Link>
          <button className="lp-burger" onClick={() => setOpen(!open)} aria-label="Menu">
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
