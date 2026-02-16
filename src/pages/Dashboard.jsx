import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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
    Trash2,
    Book,
    Calculator,
    Music,
    Globe,
    Palette,
    Microscope,
    Languages,
    School,
    Cpu,
    FlaskConical,
    History,
    Trophy,
    Gamepad2,
    Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useCourseStore from '../stores/courseStore';
import useAuthStore from '../stores/authStore';

import AnimatedLogo from '../components/AnimatedLogo';
import ConfirmModal from '../components/ConfirmModal';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuthStore();
    const {
        dashboardCourses,
        fetchDashboardCourses,
        levels,
        subjects,
        fetchCategories,
        loadCourse,
        userProfile
    } = useCourseStore();

    const [selectedLevel, setSelectedLevel] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedLevels, setExpandedLevels] = useState(new Set());
    const [courseToDelete, setCourseToDelete] = useState(null);

    useEffect(() => {
        fetchDashboardCourses();
        fetchCategories();
    }, []);

    const toggleLevel = (level) => {
        const newExpanded = new Set(expandedLevels);
        if (newExpanded.has(level)) {
            newExpanded.delete(level);
        } else {
            newExpanded.add(level);
        }
        setExpandedLevels(newExpanded);
    };

    const CourseIcon = ({ name, size = 32 }) => {
        const icons = {
            Book, Calculator, Music, Globe, Palette, Microscope,
            Languages, School, Cpu, FlaskConical, History, Trophy, Gamepad2
        };
        const IconComponent = icons[name];
        if (IconComponent) return <IconComponent size={size} color="var(--noor-secondary)" />;
        return <span style={{ fontSize: `${size}px` }}>{name || '📚'}</span>;
    };

    const getFallbackIcon = (subject, title) => {
        const s = subject?.toLowerCase() || '';
        const t = title?.toLowerCase() || '';
        if (s.includes('math')) return '📐';
        if (s.includes('anglais') || t.includes('photo')) return '📸';
        if (s.includes('sciences')) return '🔬';
        if (s.includes('français')) return '📚';
        if (s.includes('histoire')) return '🌍';
        if (s.includes('arabe')) return '☪️';
        return '📘';
    };

    const allCourses = dashboardCourses.map(c => {
        const data = c.data || {};
        return {
            ...data,
            id: c.id,
            icon: data.icon || getFallbackIcon(data.subject, data.title),
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

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
            <div className="aurora"></div>

            {/* --- SIDEBAR --- */}
            <aside style={{
                width: '320px',
                background: 'rgba(18, 21, 45, 0.7)',
                backdropFilter: 'blur(40px)',
                borderRight: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 100,
                boxShadow: '20px 0 50px rgba(0,0,0,0.3)'
            }}>
                <div style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <AnimatedLogo size={50} />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '1px' }}>NOOR STUDIO</h2>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 32px' }}>
                    {/* Navigation Items */}
                    <div style={{ marginBottom: '24px' }}>
                        <div
                            className={`sidebar-item ${!selectedLevel && !selectedSubject ? 'active' : ''}`}
                            onClick={resetSelection}
                            style={{ borderRadius: '14px' }}
                        >
                            <Layers size={18} />
                            <span style={{ fontWeight: 700 }}>Tableau de bord</span>
                        </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '16px', marginBottom: '12px', display: 'block' }}>Explorateur</span>
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {levels.map(level => {
                                const levelCoursesCount = allCourses.filter(c => c.level === level).length;
                                const isExpanded = expandedLevels.has(level);
                                const isSelected = selectedLevel === level;

                                return (
                                    <div key={level}>
                                        <div
                                            className={`sidebar-item ${isSelected ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedLevel(level);
                                                setSelectedSubject(null);
                                                toggleLevel(level);
                                            }}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                borderRadius: '12px',
                                                padding: '10px 14px'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <motion.div
                                                    animate={{ rotate: isExpanded ? 90 : 0 }}
                                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                                    style={{ display: 'flex', color: 'var(--text-muted)' }}
                                                >
                                                    <ChevronRight size={16} />
                                                </motion.div>
                                                <span style={{ fontSize: '0.9rem', fontWeight: isSelected ? 700 : 500 }}>{level}</span>
                                            </div>
                                            {levelCoursesCount > 0 && (
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    background: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                                                    color: isSelected ? 'white' : 'var(--text-muted)',
                                                    padding: '2px 8px',
                                                    borderRadius: '8px',
                                                    fontWeight: 800
                                                }}>
                                                    {levelCoursesCount}
                                                </span>
                                            )}
                                        </div>

                                        {/* Subjects nested with smooth transition */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    style={{ overflow: 'hidden' }}
                                                >
                                                    <div style={{ marginLeft: '24px', paddingLeft: '14px', borderLeft: '1px solid rgba(255,255,255,0.05)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        {subjects.map(subject => {
                                                            const subjectCount = allCourses.filter(c => c.level === level && c.subject === subject).length;
                                                            const isSubActive = selectedSubject === subject && selectedLevel === level;

                                                            return (
                                                                <div
                                                                    key={subject}
                                                                    className={`sidebar-item ${isSubActive ? 'active' : ''}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedLevel(level);
                                                                        setSelectedSubject(subject);
                                                                    }}
                                                                    style={{
                                                                        padding: '8px 12px',
                                                                        fontSize: '0.8rem',
                                                                        borderRadius: '10px',
                                                                        background: isSubActive ? 'var(--gradient-primary)' : 'transparent',
                                                                        borderLeft: 'none',
                                                                        color: isSubActive ? 'white' : 'var(--text-secondary)'
                                                                    }}
                                                                >
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                                        <BookOpen size={14} style={{ opacity: isSubActive ? 1 : 0.4 }} />
                                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subject}</span>
                                                                    </div>
                                                                    {subjectCount > 0 && <span style={{ fontSize: '0.6rem', opacity: isSubActive ? 1 : 0.4 }}>{subjectCount}</span>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(72, 52, 212, 0.3)' }}>
                            {user?.email?.[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email?.split('@')[0]}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Auteur Noor</div>
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

            {/* --- MAIN CONTENT --- */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto' }}>
                {/* Fixed Head Bar */}
                <header style={{
                    padding: '24px 48px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(10, 12, 26, 0.4)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid var(--border-color)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 90
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
                        <div style={{ flex: 1, maxWidth: '500px', position: 'relative' }}>
                            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                            <input
                                className="input-field"
                                placeholder="Rechercher un cours..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '48px', borderRadius: '16px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginLeft: '24px' }}>
                        {(userProfile?.role === 'admin' || ['admin@noor.com', 'khayati.med.ahmed@gmail.com'].includes(user?.email)) && (
                            <button className="btn-secondary" onClick={() => navigate('/settings')} style={{ padding: '12px' }}>
                                <Settings size={20} />
                            </button>
                        )}
                        <button className="btn-secondary" onClick={() => navigate('/import')}>
                            <Upload size={18} /> Importer un ancien cours
                        </button>
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
                    </div>
                </header>

                <div style={{ padding: '40px 48px' }}>
                    {/* Page Title & Breadcrumbs */}
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>
                            <span onClick={resetSelection} style={{ cursor: 'pointer' }}>Studio</span>
                            <ChevronRight size={14} />
                            <span>{selectedLevel || 'Tous les niveaux'}</span>
                            {selectedSubject && (
                                <>
                                    <ChevronRight size={14} />
                                    <span style={{ color: 'var(--noor-secondary)' }}>{selectedSubject}</span>
                                </>
                            )}
                        </div>
                        <h1 style={{ fontSize: '2.4rem', fontWeight: 800 }}>
                            {selectedSubject || selectedLevel || "Tous les cours"}
                            <span style={{ color: 'var(--noor-secondary)', marginLeft: '12px', fontSize: '1.2rem', opacity: 0.6 }}>({filteredCourses.length})</span>
                        </h1>
                    </div>

                    {/* Courses Grid */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedLevel + selectedSubject}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="dashboard-grid"
                            style={{ padding: 0 }}
                        >
                            {filteredCourses.length === 0 ? (
                                <div style={{
                                    gridColumn: '1/-1',
                                    textAlign: 'center',
                                    padding: '100px',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: '32px',
                                    border: '1px dashed var(--border-color)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '24px'
                                }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <BookOpen size={40} color="var(--text-muted)" />
                                    </div>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>Aucun cours trouvé dans cette sélection.</p>
                                        <p style={{ color: 'var(--text-muted)', opacity: 0.6, fontSize: '0.9rem', marginTop: '4px' }}>Essayez de modifier vos filtres ou créez votre premier cours.</p>
                                    </div>
                                    <button
                                        className="btn-primary"
                                        onClick={() => {
                                            loadCourse({
                                                id: null,
                                                title: 'Nouveau Cours',
                                                level: selectedLevel || 'Primaire 1',
                                                subject: selectedSubject || 'Mathématiques',
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
                                        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'auto' }}>
                                            <div style={{
                                                fontSize: '3rem',
                                                width: '70px',
                                                height: '70px',
                                                background: 'rgba(72, 52, 212, 0.1)',
                                                borderRadius: '18px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: '20px'
                                            }}>
                                                <CourseIcon name={course.icon} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCourseToDelete(course);
                                                    }}
                                                    style={{
                                                        background: 'rgba(255, 71, 87, 0.1)',
                                                        color: '#ff4757',
                                                        border: 'none',
                                                        padding: '8px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer'
                                                    }}
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px' }}>{course.title || 'Sans titre'}</h3>

                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                                                <span style={{ background: 'rgba(72, 52, 212, 0.15)', color: 'var(--noor-secondary)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>
                                                    {course.level}
                                                </span>
                                                <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>
                                                    {course.subject}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                                                    <Layers size={14} />
                                                    {course.slidesCount} diapositives
                                                </div>
                                                <div style={{ color: 'var(--noor-success)', fontSize: '0.6rem', fontWeight: 800, background: 'rgba(46, 213, 115, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                                                    ACTIF
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            <ConfirmModal
                isOpen={!!courseToDelete}
                onClose={() => setCourseToDelete(null)}
                onConfirm={async () => {
                    if (!courseToDelete) return;
                    const success = await useCourseStore.getState().deleteCourse(courseToDelete.id);
                    if (success) {
                        toast.success('Cours supprimé avec succès');
                    } else {
                        toast.error('Erreur lors de la suppression');
                    }
                }}
                title="Supprimer ce cours ?"
                message={`Êtes-vous sûr de vouloir supprimer "${courseToDelete?.title || 'ce cours'}" ? Cette action est irréversible.`}
                confirmText="Oui, supprimer"
                cancelText="Annuler"
            />
        </div>
    );
};

export default Dashboard;
