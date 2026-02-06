import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    BookOpen,
    Settings,
    LogOut,
    Search,
    Filter,
    Layers,
    ChevronLeft,
    ChevronRight,
    Briefcase,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useCourseStore from '../stores/courseStore';
import useAuthStore from '../stores/authStore';

import AnimatedLogo from '../components/AnimatedLogo';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuthStore();
    const {
        dashboardCourses,
        fetchDashboardCourses,
        levels,
        subjects,
        fetchCategories,
        loadCourse
    } = useCourseStore();

    const [selectedLevel, setSelectedLevel] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchDashboardCourses();
        fetchCategories();
    }, []);

    const getSubjectIcon = (subject, title) => {
        const s = subject?.toLowerCase() || '';
        const t = title?.toLowerCase() || '';
        if (s.includes('math')) return '📐';
        if (s.includes('anglais') || t.includes('photo')) return '📸';
        if (s.includes('sciences')) return '🔬';
        if (s.includes('français')) return '📚';
        if (s.includes('histoire')) return '🌍';
        return '📘';
    };

    const allCourses = dashboardCourses.map(c => {
        const data = c.data || {};
        return {
            ...data,
            id: c.id,
            icon: data.icon || getSubjectIcon(data.subject, data.title),
            isProject: true,
            slidesCount: data.slides?.length || 0
        };
    });

    // Filtered Content
    const filteredCourses = allCourses.filter(c => {
        const matchLevel = !selectedLevel || c.level === selectedLevel;
        const matchSubject = !selectedSubject || c.subject === selectedSubject;
        const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchLevel && matchSubject && matchSearch;
    });

    const resetSelection = () => {
        setSelectedLevel(null);
        setSelectedSubject(null);
    };

    const renderBreadcrumbs = () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '0.9rem' }}>
            <button
                onClick={resetSelection}
                style={{ background: 'none', border: 'none', color: selectedLevel ? 'var(--noor-secondary)' : 'var(--text-primary)', cursor: 'pointer', fontWeight: 700 }}
            >
                Studio
            </button>
            {selectedLevel && (
                <>
                    <ChevronRight size={14} color="var(--text-muted)" />
                    <button
                        onClick={() => setSelectedSubject(null)}
                        style={{ background: 'none', border: 'none', color: selectedSubject ? 'var(--noor-secondary)' : 'var(--text-primary)', cursor: 'pointer', fontWeight: 700 }}
                    >
                        {selectedLevel}
                    </button>
                </>
            )}
            {selectedSubject && (
                <>
                    <ChevronRight size={14} color="var(--text-muted)" />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{selectedSubject}</span>
                </>
            )}
        </div>
    );

    return (
        <div className="app-container" style={{ padding: '40px' }}>
            <div className="aurora"></div>

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <AnimatedLogo size={80} />
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>
                            Bonjour, <span style={{ color: 'var(--noor-secondary)' }}>{user?.email?.split('@')[0]}</span> 👋
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Espace Auteur Noor Education</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    {(user?.email === 'admin@noor.com' || user?.user_metadata?.role === 'admin') && (
                        <button className="btn-secondary" onClick={() => navigate('/settings')}>
                            <Settings size={20} /> Paramètres
                        </button>
                    )}
                    <button className="btn-primary" onClick={() => {
                        loadCourse({
                            id: null,
                            title: 'Nouveau Cours',
                            level: selectedLevel || (levels[0] || 'Primaire 1'),
                            subject: selectedSubject || (subjects[0] || 'Mathématiques'),
                            icon: '📝',
                            theme: { primary: '#4834d4', secondary: '#7b61ff', accent: '#ff4757' },
                            slides: [{ id: 'slide-0', type: 'SPLASH', title: 'Bienvenue !', description: 'Nouveau cours', image: '' }]
                        });
                        navigate('/editor');
                    }}>
                        <Plus size={20} /> Créer un nouveau cours
                    </button>
                    <button className="btn-secondary" onClick={() => { signOut(); navigate('/login'); }} style={{ color: '#ff4757' }}>
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <section style={{ marginBottom: '40px' }}>
                {renderBreadcrumbs()}

                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                        <input
                            className="input-field"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '48px' }}
                        />
                    </div>
                    {selectedLevel && (
                        <button className="btn-secondary" onClick={() => selectedSubject ? setSelectedSubject(null) : setSelectedLevel(null)}>
                            <ChevronLeft size={18} /> Retour
                        </button>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {levels.length === 0 ? (
                        /* FALLBACK: SHOW ALL IF NO LEVELS DEFINED */
                        <motion.div
                            key="all-fallback"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="dashboard-grid"
                        >
                            {filteredCourses.length === 0 ? (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                                    <p style={{ color: 'var(--text-muted)' }}>Aucun cours trouvé.</p>
                                </div>
                            ) : (
                                filteredCourses.map((course, idx) => (
                                    <motion.div
                                        key={course.id || idx}
                                        whileHover={{ y: -5 }}
                                        className="course-card"
                                        onClick={() => {
                                            loadCourse(course);
                                            navigate('/editor');
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>{course.icon}</div>
                                            <div style={{ background: 'var(--noor-success)', color: 'white', fontSize: '0.6rem', padding: '4px 8px', borderRadius: '8px', fontWeight: 800 }}>PROJET SAUVEGARDÉ</div>
                                        </div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>{course.title || 'Sans titre'}</h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{course.slidesCount} Diapos</span>
                                            <span style={{ background: 'rgba(72, 52, 212, 0.1)', color: 'var(--noor-secondary)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>{course.level}</span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    ) : !selectedLevel ? (
                        /* LEVELS GRID */
                        <motion.div
                            key="levels"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="dashboard-grid"
                        >
                            {levels.map((level, idx) => {
                                const count = allCourses.filter(c => c.level === level).length;
                                return (
                                    <motion.div
                                        key={level}
                                        whileHover={{ y: -5 }}
                                        className="course-card"
                                        onClick={() => setSelectedLevel(level)}
                                        style={{ cursor: 'pointer', textAlign: 'center', padding: '40px' }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            top: '20px',
                                            right: '20px',
                                            background: count > 0 ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                                            color: count > 0 ? 'white' : 'var(--text-muted)',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            boxShadow: count > 0 ? '0 4px 12px rgba(72, 52, 212, 0.3)' : 'none',
                                            border: '1px solid var(--glass-border)'
                                        }}>
                                            {count} {count > 1 ? 'Cours' : 'Cours'}
                                        </div>
                                        <div style={{ background: 'rgba(123, 97, 255, 0.1)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                            <Layers size={40} color="var(--noor-secondary)" />
                                        </div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{level}</h3>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ) : !selectedSubject ? (
                        /* SUBJECTS GRID */
                        <motion.div
                            key="subjects"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="dashboard-grid"
                        >
                            {subjects.map((subject, idx) => {
                                const count = allCourses.filter(c => c.level === selectedLevel && c.subject === subject).length;
                                return (
                                    <motion.div
                                        key={subject}
                                        whileHover={{ y: -5 }}
                                        className="course-card"
                                        onClick={() => setSelectedSubject(subject)}
                                        style={{ cursor: 'pointer', textAlign: 'center', padding: '40px' }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            top: '20px',
                                            right: '20px',
                                            background: count > 0 ? 'var(--noor-primary)' : 'rgba(255,255,255,0.05)',
                                            color: count > 0 ? 'white' : 'var(--text-muted)',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            boxShadow: count > 0 ? '0 4px 12px rgba(72, 52, 212, 0.3)' : 'none',
                                            border: '1px solid var(--glass-border)'
                                        }}>
                                            {count} {count > 1 ? 'Cours' : 'Cours'}
                                        </div>
                                        <div style={{ background: 'rgba(72, 52, 212, 0.1)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                            <BookOpen size={40} color="var(--noor-primary)" />
                                        </div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{subject}</h3>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        /* COURSES GRID */
                        <motion.div
                            key="courses"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="dashboard-grid"
                        >
                            {filteredCourses.length === 0 ? (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px dashed var(--border-color)' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Aucun cours créé pour cette catégorie.</p>
                                    <button
                                        className="btn-primary"
                                        style={{ marginTop: '24px', marginInline: 'auto' }}
                                        onClick={() => {
                                            loadCourse({
                                                id: null,
                                                title: 'Nouveau Cours',
                                                level: selectedLevel,
                                                subject: selectedSubject,
                                                icon: '📝',
                                                theme: { primary: '#4834d4', secondary: '#7b61ff', accent: '#ff4757' },
                                                slides: [{ id: 'slide-0', type: 'SPLASH', title: 'Bienvenue !', description: 'Nouveau cours', image: '' }]
                                            });
                                            navigate('/editor');
                                        }}
                                    >
                                        <Plus size={20} /> Créer le premier cours
                                    </button>
                                </div>
                            ) : (
                                filteredCourses.map((course, idx) => (
                                    <motion.div
                                        key={course.id || idx}
                                        whileHover={{ y: -5 }}
                                        className="course-card"
                                        onClick={() => {
                                            loadCourse(course);
                                            navigate('/editor');
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>{course.icon}</div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <div style={{ background: 'var(--noor-success)', color: 'white', fontSize: '0.6rem', padding: '4px 8px', borderRadius: '8px', fontWeight: 800 }}>
                                                    PROJET SAUVEGARDÉ
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Voulez-vous vraiment supprimer ce cours ?')) {
                                                            useCourseStore.getState().deleteCourse(course.id);
                                                        }
                                                    }}
                                                    style={{ background: 'rgba(255, 71, 87, 0.1)', color: '#ff4757', border: 'none', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}
                                                    title="Supprimer le cours"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>{course.title || 'Sans titre'}</h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {course.slidesCount} Diapositives
                                            </span>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <span style={{ background: 'rgba(72, 52, 212, 0.1)', color: 'var(--noor-secondary)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>
                                                    {course.level}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
};

export default Dashboard;
