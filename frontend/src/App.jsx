import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { Parcelles } from './pages/Parcelles';
import { Actionneurs } from './pages/Actionneurs';
import { Thresholds } from './pages/Thresholds';
import { UsersPage } from './pages/Users';
import { Capteurs } from './pages/Capteurs';
import { Profile } from './pages/Profile';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8faf5] dark:bg-[#0D1117] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
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
                <Route path="/users" element={<UsersPage />} />
                <Route path="/capteurs" element={<Capteurs />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
