import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Verify from './components/Verify';
import { AuthProvider, useAuth } from './context/authContext';
import './App.css'; 
import LoginPage from './pages/LoginPage';
import UserManagement from "./components/UserManagement"
import ReportingPage from "./pages/ReportingPage"

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader-spin w-12 h-12"></div> {/* Changed className */}
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader-spin w-12 h-12"></div> {/* Changed className */}
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route path="/verify/:userUuid" element={<Verify />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportingPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;