import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    BookOpen,
    Clock,
    Settings,
    Plus,
    Upload,
    ArrowRight,
    TrendingUp,
    Shield,
    Activity,
    LogOut,
    ChevronRight,
    Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../stores/authStore';
import useCourseStore from '../stores/courseStore';
import StatCard from '../components/StatCard';
import AnimatedLogo from '../components/AnimatedLogo';
import toast from 'react-hot-toast';

const AdminHome = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuthStore();
    const { dashboardCourses, fetchDashboardCourses } = useCourseStore();

    const [stats, setStats] = useState({
        totalCourses: 0,
        totalAuthors: 0,
        recentUpdates: 0,
        averageSlides: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            await fetchDashboardCourses();

            // Fetch total authors
            const { count: authorsCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            const courses = dashboardCourses || [];

            // Calculate some basic stats
            const totalSlides = courses.reduce((acc, curr) => acc + (curr.data?.slides?.length || 0), 0);

            setStats({
                totalCourses: courses.length,
                totalAuthors: authorsCount || 0,
                recentUpdates: courses.filter(c => {
                    const updated = new Date(c.updated_at);
                    const now = new Date();
                    return (now - updated) < (7 * 24 * 60 * 60 * 1000); // last 7 days
                }).length,
                averageSlides: courses.length > 0 ? Math.round(totalSlides / courses.length) : 0
            });

            // Get last 5 updated courses
            setRecentActivity(courses.slice(0, 5));

        } catch (error) {
            console.error('Error loading admin data:', error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = ['admin@noor.com', 'khayati.med.ahmed@gmail.com'].includes(user?.email);

    if (!isAdmin) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Accès réservé aux administrateurs.</div>;
    }

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
            <div className="aurora"></div>

            {/* Sidebar */}
            <aside style={{
                width: '320px',
                background: 'rgba(18, 21, 45, 0.7)',
                backdropFilter: 'blur(40px)',
                borderRight: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 100
            }}>
                <div style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <AnimatedLogo size={50} />
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', letterSpacing: '1px' }}>ADMIN PANEL</h2>
                        <span style={{ fontSize: '0.6rem', color: 'var(--noor-secondary)', fontWeight: 800 }}>VERSION 2.0</span>
                    </div>
                </div>

                <div style={{ flex: 1, padding: '20px' }}>
                    <div className="sidebar-item active" onClick={() => navigate('/admin')}>
                        <Activity size={18} />
                        <span style={{ fontWeight: 700 }}>Vue d'ensemble</span>
                    </div>
                    <div className="sidebar-item" onClick={() => navigate('/dashboard')}>
                        <BookOpen size={18} />
                        <span>Tous les Cours</span>
                    </div>
                    <div className="sidebar-item" onClick={() => navigate('/settings')}>
                        <Users size={18} />
                        <span>Auteurs & Accès</span>
                    </div>
                    <div className="sidebar-item" onClick={() => navigate('/import')}>
                        <Upload size={18} />
                        <span>Import SCORM</span>
                    </div>
                </div>

                <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                            A
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Administrateur</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                        </div>
                        <button
                            onClick={() => { signOut(); navigate('/login'); }}
                            style={{ background: 'rgba(255, 71, 87, 0.1)', color: '#ff4757', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '48px' }}>
                <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Tableau de bord <span className="gradient-text">Noor</span></h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Bienvenue dans l'espace de gestion centralisée.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-secondary" onClick={() => navigate('/settings')}>
                            <Settings size={20} /> Paramètres
                        </button>
                        <button className="btn-primary" onClick={() => navigate('/dashboard')}>
                            <Plus size={20} /> Gérer les cours
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '24px',
                    marginBottom: '48px'
                }}>
                    <StatCard
                        title="Total Cours"
                        value={stats.totalCourses}
                        icon={BookOpen}
                        color="var(--noor-primary)"
                        trend={`+${stats.recentUpdates} cette semaine`}
                    />
                    <StatCard
                        title="Auteurs"
                        value={stats.totalAuthors}
                        icon={Users}
                        color="var(--noor-secondary)"
                    />
                    <StatCard
                        title="Activité Récente"
                        value={stats.recentUpdates}
                        icon={Activity}
                        color="var(--noor-accent)"
                    />
                    <StatCard
                        title="Moy. Diapositives"
                        value={stats.averageSlides}
                        icon={Clock}
                        color="#ff9f43"
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                    {/* Recent Activity */}
                    <section style={{
                        background: 'rgba(18, 21, 45, 0.4)',
                        borderRadius: '32px',
                        padding: '32px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Clock size={20} color="var(--noor-secondary)" /> Activité Récente
                            </h3>
                            <button className="btn-text" onClick={() => navigate('/dashboard')} style={{ fontSize: '0.9rem', color: 'var(--noor-secondary)', fontWeight: 600 }}>
                                Voir tout
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {recentActivity.map((course, idx) => (
                                <motion.div
                                    key={course.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    onClick={() => navigate('/dashboard')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '20px',
                                        padding: '16px',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: '16px',
                                        cursor: 'pointer',
                                        border: '1px solid transparent',
                                        transition: 'all 0.2s'
                                    }}
                                    whileHover={{ background: 'rgba(255, 255, 255, 0.06)', borderSide: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: 'rgba(72, 52, 212, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem'
                                    }}>
                                        {course.data?.icon || '📘'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{course.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            Mis à jour {new Date(course.updated_at).toLocaleDateString('fr-FR')}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontWeight: 700
                                        }}>
                                            {course.data?.level}
                                        </span>
                                    </div>
                                    <ChevronRight size={18} color="var(--text-muted)" />
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Quick Actions / Shortcuts */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <section style={{
                            background: 'var(--gradient-primary)',
                            borderRadius: '32px',
                            padding: '32px',
                            color: 'white',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 20px 40px rgba(72, 52, 212, 0.4)'
                        }}>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px' }}>Nouvelle Matière ?</h3>
                                <p style={{ opacity: 0.9, marginBottom: '24px', fontSize: '0.95rem' }}>Gérez les catégories disponibles sur la plateforme pour les auteurs.</p>
                                <button
                                    className="btn-secondary"
                                    onClick={() => navigate('/settings')}
                                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: '100%', justifyContent: 'center' }}
                                >
                                    Accéder aux réglages
                                </button>
                            </div>
                            <Shield size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1, transform: 'rotate(-15deg)' }} />
                        </section>

                        <section style={{
                            background: 'rgba(18, 21, 45, 0.4)',
                            borderRadius: '32px',
                            padding: '32px',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px' }}>Accès Rapides</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <QuickAction icon={Users} label="Utilisateurs" onClick={() => navigate('/settings')} />
                                <QuickAction icon={BookOpen} label="Catalogue" onClick={() => navigate('/dashboard')} />
                                <QuickAction icon={Upload} label="Import" onClick={() => navigate('/import')} />
                                <QuickAction icon={Plus} label="Nouveau" onClick={() => {
                                    useCourseStore.getState().loadCourse({
                                        id: null,
                                        title: 'Nouveau Cours',
                                        level: 'Primaire 1',
                                        subject: 'Mathématiques',
                                        icon: '📝',
                                        theme: { primary: '#4834d4', secondary: '#7b61ff', accent: '#ff4757' },
                                        slides: [{ id: 'slide-0', type: 'SPLASH', title: 'Bienvenue !', description: 'Nouveau cours', image: '' }]
                                    });
                                    navigate('/editor');
                                }} />
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

const QuickAction = ({ icon: Icon, label, onClick }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            color: 'white'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.borderColor = 'var(--noor-secondary)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
        }}
    >
        <Icon size={24} color="var(--noor-secondary)" />
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{label}</span>
    </button>
);

export default AdminHome;
