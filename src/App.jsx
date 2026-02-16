import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import CourseEditor from './pages/CourseEditor';
import Login from './pages/Login';
import Settings from './pages/Settings';
import SCORMImporter from './pages/SCORMImporter';
import PreviewPage from './pages/PreviewPage';
import useAuthStore from './stores/authStore';

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

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/editor" element={<ProtectedRoute><CourseEditor /></ProtectedRoute>} />
          <Route path="/preview/:courseId/:slideIndex?" element={<ProtectedRoute><PreviewPage /></ProtectedRoute>} />
          <Route path="/course/:courseId/:slideIndex?" element={<ProtectedRoute><PreviewPage isPlayer={true} /></ProtectedRoute>} />
          <Route path="/import" element={<ProtectedRoute><SCORMImporter /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute adminOnly><Settings /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
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
