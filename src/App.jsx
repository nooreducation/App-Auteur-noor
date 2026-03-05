import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './stores/authStore';

// 🚀 CODE SPLITTING : Chargement asynchrone des composants lourds
// Au lieu de tout charger d'un coup, on charge ces morceaux de l'app uniquement quand l'utilisateur navigue vers ces pages.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CourseEditor = lazy(() => import('./pages/CourseEditor'));
const Login = lazy(() => import('./pages/Login'));
const Settings = lazy(() => import('./pages/Settings'));
const SCORMImporter = lazy(() => import('./pages/SCORMImporter'));
const PreviewPage = lazy(() => import('./pages/PreviewPage'));
const AdminHome = lazy(() => import('./pages/AdminHome'));

// Composant de chargement pendant le téléchargement des "chunks" JS
const PageLoader = () => (
  <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0c1a' }}>
    <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(123, 97, 255, 0.3)', borderTopColor: '#7b61ff', animation: 'spin 1s linear infinite' }} />
    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuthStore();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (adminOnly) {
    const admins = ['admin@noor.com', 'khayati.med.ahmed@gmail.com'];
    const isAdmin = admins.includes(user.email) || user.user_metadata?.role === 'admin';
    if (!isAdmin) return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// --- ErrorBoundary Anti-Black Screen ---
import { Component } from 'react';
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0c1a', color: 'white', textAlign: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
          <div style={{ padding: '40px', background: 'rgba(255,71,87,0.1)', border: '1px solid #ff4757', borderRadius: '24px', maxWidth: '600px' }}>
            <h1 style={{ color: '#ff4757', marginBottom: '16px', fontSize: '1.5rem' }}>Erreur Critique détectée</h1>
            <p style={{ opacity: 0.8, marginBottom: '20px' }}>Une erreur a fait planter l'affichage. Voici le détail pour le support :</p>
            <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', overflow: 'auto', fontSize: '0.8rem', textAlign: 'left', marginBottom: '24px', color: '#ff9f43' }}>
              {this.state.error?.toString()}
            </pre>
            <button onClick={() => window.location.href = '/dashboard'} style={{ background: '#7b61ff', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              Retour au Studio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  const HomeRedirect = () => {
    const { user, loading } = useAuthStore();
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;

    const admins = ['admin@noor.com', 'khayati.med.ahmed@gmail.com'];
    const isAdmin = admins.includes(user.email) || user.user_metadata?.role === 'admin';

    if (isAdmin) return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  };

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/editor" element={<ProtectedRoute><CourseEditor /></ProtectedRoute>} />
            <Route path="/preview/:courseId/:slideIndex?" element={<ProtectedRoute><PreviewPage /></ProtectedRoute>} />
            <Route path="/course/:courseId/:slideIndex?" element={<ProtectedRoute><PreviewPage isPlayer={true} /></ProtectedRoute>} />
            <Route path="/import" element={<ProtectedRoute><SCORMImporter /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminHome /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute adminOnly><Settings /></ProtectedRoute>} />
            <Route path="/" element={<HomeRedirect />} />
          </Routes>
        </Suspense>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(18, 21, 45, 0.95)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            },
            success: {
              iconTheme: {
                primary: 'var(--noor-success)',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--noor-accent)',
                secondary: '#fff',
              },
            },
            loading: {
              style: {
                background: 'rgba(72, 52, 212, 0.95)',
              }
            }
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
