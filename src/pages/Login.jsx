import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, UserPlus, Loader2, Sparkles } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';

import AnimatedLogo from '../components/AnimatedLogo';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { signIn, signUp } = useAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                const user = await signIn(email, password);
                if (user) {
                    toast.success('Bon retour parmi nous !');
                    navigate('/');
                }
            } else {
                const user = await signUp(email, password, { role: email === 'admin@noor.com' ? 'admin' : 'author' });
                if (user) {
                    toast.success('Compte créé ! Vérifiez vos emails si la confirmation est activée.');
                    if (isLogin) navigate('/'); // Only navigate if logged in immediately
                }
            }
        } catch (error) {
            console.error('Auth Error:', error);
            if (error.message.includes('Email not confirmed')) {
                toast.error('Veuillez confirmer votre email avant de vous connecter.');
            } else if (error.message.includes('Invalid login credentials')) {
                toast.error('Email ou mot de passe incorrect.');
            } else {
                toast.error(error.message || 'Une erreur est survenue');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0b1e',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div className="aurora"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="login-card"
                style={{
                    width: '100%',
                    maxWidth: '450px',
                    background: 'rgba(18, 21, 45, 0.7)',
                    backdropFilter: 'blur(30px)',
                    padding: '48px',
                    borderRadius: '32px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    zIndex: 10
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        margin: '0 auto 24px',
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                        <AnimatedLogo size={120} />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>Studio Noor</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {isLogin ? 'Connectez-vous pour continuer l\'aventure' : 'Rejoignez la communauté des auteurs'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="input-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>EMAIL</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                className="input-field"
                                type="email"
                                placeholder="exemple@noor.tn"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ paddingLeft: '48px' }}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>MOT DE PASSE</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                className="input-field"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ paddingLeft: '48px' }}
                            />
                        </div>
                    </div>

                    <button
                        className="btn-primary"
                        type="submit"
                        disabled={loading}
                        style={{ padding: '16px', fontSize: '1rem', marginTop: '12px' }}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isLogin ? <><LogIn size={20} /> Connexion</> : <><UserPlus size={20} /> Créer un compte</>)}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--noor-secondary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
                    </button>
                </div>
            </motion.div>

            {/* Background elements */}
            <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'var(--noor-primary)', filter: 'blur(150px)', opacity: 0.1 }}></div>
            <div style={{ position: 'absolute', bottom: -100, left: -100, width: 400, height: 400, background: 'var(--noor-secondary)', filter: 'blur(150px)', opacity: 0.1 }}></div>
        </div>
    );
};

export default Login;
