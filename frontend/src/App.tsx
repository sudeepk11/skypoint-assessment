import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PublicJobBoard from './pages/PublicJobBoard';
import PublicJobDetail from './pages/PublicJobDetail';
import Profile from './pages/Profile';

// HR pages
import HRDashboard from './pages/hr/Dashboard';
import HRJobList from './pages/hr/JobList';
import CreateJob from './pages/hr/CreateJob';
import EditJob from './pages/hr/EditJob';
import HRApplications from './pages/hr/Applications';
import HRApplicationDetail from './pages/hr/ApplicationDetail';

// Candidate pages
import CandidateDashboard from './pages/candidate/Dashboard';
import JobBoard from './pages/candidate/JobBoard';
import JobDetail from './pages/candidate/JobDetail';
import MyApplications from './pages/candidate/MyApplications';
import Connections from './pages/candidate/Connections';
import TalentNetwork from './pages/hr/TalentNetwork';

// Root redirect based on auth state
const RootRedirect: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <Navigate
        to={user.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard'}
        replace
      />
    );
  }

  return <Landing />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/jobs" element={<PublicJobBoard />} />
      <Route path="/jobs/:id" element={<PublicJobDetail />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute requiredRole="any">
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* HR routes */}
      <Route
        path="/hr/dashboard"
        element={
          <ProtectedRoute requiredRole="hr">
            <HRDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/jobs"
        element={
          <ProtectedRoute requiredRole="hr">
            <HRJobList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/jobs/new"
        element={
          <ProtectedRoute requiredRole="hr">
            <CreateJob />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/jobs/:id/edit"
        element={
          <ProtectedRoute requiredRole="hr">
            <EditJob />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/applications"
        element={
          <ProtectedRoute requiredRole="hr">
            <HRApplications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/applications/:id"
        element={
          <ProtectedRoute requiredRole="hr">
            <HRApplicationDetail />
          </ProtectedRoute>
        }
      />

      {/* Candidate routes */}
      <Route
        path="/candidate/dashboard"
        element={
          <ProtectedRoute requiredRole="candidate">
            <CandidateDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/jobs"
        element={
          <ProtectedRoute requiredRole="candidate">
            <JobBoard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/jobs/:id"
        element={
          <ProtectedRoute requiredRole="candidate">
            <JobDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/applications"
        element={
          <ProtectedRoute requiredRole="candidate">
            <MyApplications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/hr/talent-network"
        element={
          <ProtectedRoute requiredRole="hr">
            <TalentNetwork />
          </ProtectedRoute>
        }
      />

      <Route
        path="/candidate/connections"
        element={
          <ProtectedRoute requiredRole="candidate">
            <Connections />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
