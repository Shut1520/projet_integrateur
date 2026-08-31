/**
 * Composant racine de l'application SAI (Système Agricole Intelligent).
 * Définit l'arborescence de routes, les providers globaux (auth, thème, toasts)
 * et protège les routes nécessitant une authentification.
 */
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

// Chargement paresseux des pages — chaque page devient un chunk séparé
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = React.lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const History = React.lazy(() => import('./pages/History').then(m => ({ default: m.History })));
const Parcelles = React.lazy(() => import('./pages/Parcelles').then(m => ({ default: m.Parcelles })));
const Actionneurs = React.lazy(() => import('./pages/Actionneurs').then(m => ({ default: m.Actionneurs })));
const Thresholds = React.lazy(() => import('./pages/Thresholds').then(m => ({ default: m.Thresholds })));
const UsersPage = React.lazy(() => import('./pages/Users').then(m => ({ default: m.UsersPage })));
const Capteurs = React.lazy(() => import('./pages/Capteurs').then(m => ({ default: m.Capteurs })));
const Profile = React.lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Alertes = React.lazy(() => import('./pages/Alertes').then(m => ({ default: m.Alertes })));
const NotFound = React.lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

/** Indicateur de chargement affiché pendant le lazy load d'une page */
const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-8 h-8 border-4 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
  </div>
);

/**
 * Route protégée : redirige vers /login si l'utilisateur n'est pas authentifié.
 * Affiche un indicateur de chargement pendant la vérification du token.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  // Afficher un spinner pendant la vérification initiale du token JWT
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] dark:bg-[#0D1117] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  // Redirection vers la page de connexion si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

/**
 * Route réservée aux administrateurs.
 * Redirige vers /dashboard si l'utilisateur n'est pas admin.
 */
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, hasRole } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] dark:bg-[#0D1117] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!hasRole('admin')) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected App Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/history" element={<History />} />
                <Route path="/parcelles" element={<Parcelles />} />
                <Route path="/actionneurs" element={<Actionneurs />} />
                <Route path="/thresholds" element={<Thresholds />} />
                <Route path="/seuils" element={<Navigate to="/thresholds" replace />} />
                <Route path="/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
                <Route path="/capteurs" element={<AdminRoute><Capteurs /></AdminRoute>} />
                <Route path="/alertes" element={<Alertes />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              {/* Fallback 404 */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
