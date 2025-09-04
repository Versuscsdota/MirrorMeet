import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ModelsPage from './pages/ModelsPage';
import SlotsPage from './pages/SlotsPage';
import ShiftsPage from './pages/ShiftsPage';
import EmployeesPage from './pages/EmployeesPage';
import AuditPage from './pages/AuditPage';
import AnalyticsPage from './pages/AnalyticsPage';
import RoleManagement from './components/RoleManagement';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={
            <ProtectedRoute module="models">
              <ModelsPage />
            </ProtectedRoute>
          } />
          <Route path="models" element={
            <ProtectedRoute module="models">
              <ModelsPage />
            </ProtectedRoute>
          } />
          <Route path="slots" element={
            <ProtectedRoute module="slots">
              <SlotsPage />
            </ProtectedRoute>
          } />
          <Route path="shifts" element={
            <ProtectedRoute module="shifts">
              <ShiftsPage />
            </ProtectedRoute>
          } />
          <Route path="employees" element={
            <ProtectedRoute module="users" permission="view">
              <EmployeesPage />
            </ProtectedRoute>
          } />
          <Route path="analytics" element={
            <ProtectedRoute module="analytics">
              <AnalyticsPage />
            </ProtectedRoute>
          } />
          <Route path="audit" element={
            <ProtectedRoute module="audit" permission="view">
              <AuditPage />
            </ProtectedRoute>
          } />
          <Route path="roles" element={
            <ProtectedRoute requireRoot={true}>
              <RoleManagement />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </>
  );
}

export default App;
