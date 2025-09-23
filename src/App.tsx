import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { Dashboard } from './components/user/Dashboard';
import { TaskList } from './components/user/TaskList';
import { Wallet } from './components/user/Wallet';
import { WithdrawalHistory } from './components/user/WithdrawalHistory';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UserManagement } from './components/admin/UserManagement';
import { WithdrawalManagement } from './components/admin/WithdrawalManagement';
import { TaskManagement } from './components/admin/TaskManagement';
import { TaskReview } from './components/admin/TaskReview';
import { TaskCreate } from './components/admin/TaskCreate';
import { TaskAssign } from './components/admin/TaskAssign';
import { SettingsManagement } from './components/admin/SettingsManagement';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={!isAuthenticated ? <LoginForm /> : <Navigate to="/dashboard" replace />} 
      />
      <Route 
        path="/register" 
        element={!isAuthenticated ? <RegisterForm /> : <Navigate to="/dashboard" replace />} 
      />

      {/* User Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute requireRole="user">
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tasks" 
        element={
          <ProtectedRoute requireRole="user">
            <TaskList />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/wallet" 
        element={
          <ProtectedRoute requireRole="user">
            <Wallet />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/withdrawals"
        element={
          <ProtectedRoute requireRole="user">
            <WithdrawalHistory />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requireRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute requireRole="admin">
            <UserManagement />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/admin/tasks"
        element={
          <ProtectedRoute requireRole="admin">
            <TaskManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tasks/create"
        element={
          <ProtectedRoute requireRole="admin">
            <TaskCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tasks/:taskId/assign"
        element={
          <ProtectedRoute requireRole="admin">
            <TaskAssign />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tasks/review"
        element={
          <ProtectedRoute requireRole="admin">
            <TaskReview />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/admin/withdrawals" 
        element={
          <ProtectedRoute requireRole="admin">
            <WithdrawalManagement />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requireRole="admin">
            <SettingsManagement />
          </ProtectedRoute>
        }
      />

      {/* Default Redirects */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            user?.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <AppRoutes />
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;