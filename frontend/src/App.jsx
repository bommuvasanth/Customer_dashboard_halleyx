import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import DashboardConfigPage from './pages/DashboardConfigPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected Routes */} 
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/configure" 
        element={
          <ProtectedRoute>
            <DashboardConfigPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customer-orders" 
        element={   
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Legacy/Other Routes Removed */}
      <Route path="/admin/dashboard" element={<Navigate to="/customer-orders" replace />} />
      <Route path="/dashboard-config" element={<Navigate to="/dashboard/configure" replace />} />

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;