import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Components
import Login from './components/Login';
import ProductsManager from './components/ProductsManager';
import VoiceInterface from './components/VoiceInterface';

import ChatInterface from './components/ChatInterface';
import { Sparkles, LogOut, MessageCircle, X } from 'lucide-react';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  React.useEffect(() => {
    const handleVoiceLogout = () => {
      console.log('🎤 Voice Logout Triggered');
      handleLogout();
    };

    window.addEventListener('logout_attempt', handleVoiceLogout);
    return () => window.removeEventListener('logout_attempt', handleVoiceLogout);
  }, []);

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: isAuthenticated ? 'var(--bg-primary)' : 'white' }}>

      {/* Show Nav only if authenticated */}
      {isAuthenticated && (
        <nav className="glass-effect border-0 border-bottom shadow-sm sticky-top" style={{ borderColor: 'var(--border-color)', zIndex: 1020 }}>
          <div className="container-fluid px-4 py-3">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <div className="position-relative">
                  <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                    style={{
                      width: '40px',
                      height: '40px',
                      background: 'var(--gradient-primary)',
                      color: 'white',
                      boxShadow: 'var(--shadow-glow)'
                    }}>
                    <Sparkles size={18} />
                  </div>
                </div>
                <div>
                  <h1 className="h6 mb-0 fw-bold gradient-text">Pet Shop Manager</h1>
                  <p className="small text-muted mb-0">{user?.nombre || 'Usuario'} | {user?.role?.toUpperCase() || 'STAFF'}</p>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <button onClick={handleLogout} className="btn btn-light btn-sm d-flex align-items-center gap-2 text-danger">
                  <LogOut size={16} /> <span className="d-none d-md-inline">Salir</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-grow-1 position-relative">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={
            <ProtectedRoute>
              <ProductsManager />
            </ProtectedRoute>
          } />
        </Routes>
      </main>

      {/* Persistent Voice Overlay (Global) */}
      <div className="fixed-bottom p-4 d-none d-md-block" style={{ zIndex: 1070 }}>
        <div className="position-absolute bottom-0 start-50 translate-middle-x mb-4">
          <VoiceInterface />
        </div>
      </div>

      {/* Chat Floating Button & Drawer (Only if authenticated) */}
      {isAuthenticated && (
        <>
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="btn rounded-circle position-fixed shadow-lg d-flex align-items-center justify-content-center"
            style={{
              bottom: '2rem',
              right: '2rem',
              width: '56px',
              height: '56px',
              background: 'var(--gradient-primary)',
              border: 'none',
              zIndex: 1070,
              transition: 'all 0.3s ease'
            }}
          >
            <MessageCircle size={24} color="white" />
          </button>

          {/* Chat Drawer */}
          <div
            className={`position-fixed top-0 end-0 h-100 bg-white shadow-2xl ${isChatOpen ? '' : 'translate-end'}`}
            style={{
              width: '380px',
              maxWidth: '100vw',
              transform: isChatOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s ease-in-out',
              zIndex: 1100
            }}
          >
            <div className="h-100 d-flex flex-column">
              <div className="p-3 border-bottom d-flex justify-content-between align-items-center glass-effect bg-light">
                <h5 className="fw-bold mb-0">Asistente de Tienda</h5>
                <button onClick={() => setIsChatOpen(false)} className="btn btn-sm btn-icon">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-grow-1 overflow-hidden">
                <ChatInterface />
              </div>
              {/* Voice Interface for Mobile inside Chat */}
              <div className="d-md-none border-top p-3 d-flex justify-content-center bg-light">
                <VoiceInterface />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
