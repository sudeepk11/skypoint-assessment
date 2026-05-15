import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const PublicJobBoard = lazy(() => import('./pages/PublicJobBoard'));
const PublicJobDetail = lazy(() => import('./pages/PublicJobDetail'));
const Profile = lazy(() => import('./pages/Profile'));

// HR pages
const HRDashboard = lazy(() => import('./pages/hr/Dashboard'));
const HRJobList = lazy(() => import('./pages/hr/JobList'));
const CreateJob = lazy(() => import('./pages/hr/CreateJob'));
const EditJob = lazy(() => import('./pages/hr/EditJob'));
const HRApplications = lazy(() => import('./pages/hr/Applications'));
const HRApplicationDetail = lazy(() => import('./pages/hr/ApplicationDetail'));
const TalentNetwork = lazy(() => import('./pages/hr/TalentNetwork'));

// Candidate pages
const CandidateDashboard = lazy(() => import('./pages/candidate/Dashboard'));
const JobBoard = lazy(() => import('./pages/candidate/JobBoard'));
const JobDetail = lazy(() => import('./pages/candidate/JobDetail'));
const MyApplications = lazy(() => import('./pages/candidate/MyApplications'));
const Connections = lazy(() => import('./pages/candidate/Connections'));

const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface">
    <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
  </div>
);

const RootRedirect: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <PageLoader />;

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
    <Suspense fallback={<PageLoader />}>
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
        <Route
          path="/hr/talent-network"
          element={
            <ProtectedRoute requiredRole="hr">
              <TalentNetwork />
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
    </Suspense>
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
