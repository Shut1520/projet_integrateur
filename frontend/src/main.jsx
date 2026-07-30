/**
 * Point d'entrée de l'application React.
 * Monte le composant racine App dans le DOM avec le mode StrictMode activé
 * (détection des effets de bord potentiels en développement).
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
