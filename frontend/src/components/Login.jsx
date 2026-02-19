import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authAPI, usersAPI } from '../api/client';
import { Sparkles, ArrowRight } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const setAuth = useAuthStore((state) => state.setAuth);

    const handleLogin = async (e, credentials = null) => {
        if (e) e.preventDefault();
        setError('');
        setIsLoading(true);

        const loginEmail = credentials ? credentials.email : email;
        const loginPassword = credentials ? credentials.password : password;

        try {
            const response = await authAPI.login(loginEmail, loginPassword);
            const token = response.data.access_token;
            // ... (rest calls)
            useAuthStore.setState({ token });
            const userResponse = await usersAPI.getMe();
            setAuth(token, userResponse.data);
        } catch (err) {
            setError(credentials ? 'Fallo en login por voz. Verifica credenciales.' : 'Credenciales incorrectas.');
            console.error(err);
            useAuthStore.setState({ token: null });
        } finally {
            setIsLoading(false);
        }
    };

    // Voice Login Listener
    React.useEffect(() => {
        const handleVoiceLogin = (event) => {
            const { email, password } = event.detail;
            if (email && password) {
                console.log("🎤 Voice Login Attempt:", email);
                // Visual feedback
                setEmail(email);
                setPassword(password);
                // Execute login
                handleLogin(null, { email, password });
            }
        };

        window.addEventListener('login_attempt', handleVoiceLogin);
        return () => window.removeEventListener('login_attempt', handleVoiceLogin);
    }, []);

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center p-4 position-relative overflow-hidden"
            style={{ background: 'var(--bg-primary)' }}>

            {/* Background decoration */}
            <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0 }}>
                <div className="position-absolute top-0 start-0 translate-middle-x"
                    style={{ width: '600px', height: '600px', background: 'var(--gradient-primary)', filter: 'blur(100px)', opacity: 0.1, borderRadius: '50%' }}></div>
                <div className="position-absolute bottom-0 end-0 translate-middle-x"
                    style={{ width: '500px', height: '500px', background: 'var(--gradient-secondary)', filter: 'blur(100px)', opacity: 0.1, borderRadius: '50%' }}></div>
            </div>

            <div className="glass-effect rounded-4 p-5 shadow-xl position-relative z-1" style={{ maxWidth: '420px', width: '100%' }}>
                <div className="text-center mb-5">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                        style={{ width: '64px', height: '64px', background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}>
                        <Sparkles size={32} color="white" />
                    </div>
                    <h2 className="h3 fw-bold gradient-text">Bienvenido</h2>
                    <p className="text-muted small">Pet Shop Management</p>
                </div>

                {error && (
                    <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center gap-2 mb-4" role="alert" style={{ fontSize: '0.9rem' }}>
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="form-label small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.5px' }}>
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            className="form-control border-0 border-bottom rounded-0 px-0 shadow-none bg-transparent"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nombre@ejemplo.com"
                            required
                            style={{ paddingBottom: '10px' }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>

                    <div className="mb-5">
                        <label className="form-label small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.5px' }}>
                            Contraseña
                        </label>
                        <input
                            type="password"
                            className="form-control border-0 border-bottom rounded-0 px-0 shadow-none bg-transparent"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{ paddingBottom: '10px' }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100 py-3 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-lg hover-lift"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                            <>
                                Acceder <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p className="small text-muted mb-0">
                        ¿No tienes cuenta? <span className="text-primary fw-semibold cursor-pointer">Contacta al administrador</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
