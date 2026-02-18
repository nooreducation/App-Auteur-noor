import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Plus,
    Trash2,
    Layers,
    BookOpen,
    Loader2,
    Users,
    ChevronRight,
    Check,
    Shield,
    Mail,
    Lock,
    Search,
    UserPlus,
    Settings as SettingsIcon,
    ArrowRight
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';
import useCourseStore from '../stores/courseStore';
import useAuthStore from '../stores/authStore';
import AnimatedLogo from '../components/AnimatedLogo';
import toast from 'react-hot-toast';

const Settings = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { levels, subjects, fetchCategories } = useCourseStore();

    const [activeTab, setActiveTab] = useState('levels');
    const [newItemName, setNewItemName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [authors, setAuthors] = useState([]);
    const [selectedAuthor, setSelectedAuthor] = useState(null);
    const [newAuthorEmail, setNewAuthorEmail] = useState('');
    const [newAuthorPassword, setNewAuthorPassword] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Recovery states for confirmation modals
    const [authorToDelete, setAuthorToDelete] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        fetchCategories();
        if (activeTab === 'authors') {
            fetchAuthors();
        }
    }, [activeTab]);

    const fetchAuthors = async () => {
        setIsProcessing(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('email');

            if (error) {
                console.warn("Table 'profiles' non trouvée.");
                if (user) setAuthors([{ id: user.id, email: user.email, role: 'admin', allowed_levels: levels, allowed_subjects: subjects }]);
            } else {
                setAuthors(data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateAuthor = async (authorId, updates) => {
        setIsProcessing(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({ id: authorId, ...updates });

            if (error) throw error;
            toast.success("Permissions mises à jour");

            // Update local state for immediate feedback
            setAuthors(prev => prev.map(a => a.id === authorId ? { ...a, ...updates } : a));
            if (selectedAuthor?.id === authorId) {
                setSelectedAuthor(prev => ({ ...prev, ...updates }));
            }
        } catch (error) {
            toast.error("Erreur de mise à jour");
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCreateAuthor = async () => {
        if (!newAuthorEmail || !newAuthorPassword) {
            toast.error("Remplissez l'email et le mot de passe");
            return;
        }
        setIsProcessing(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: newAuthorEmail,
                password: newAuthorPassword,
                options: { data: { role: 'author' } }
            });

            if (error) throw error;

            await supabase.from('profiles').insert([{
                id: data.user.id,
                email: newAuthorEmail,
                role: 'author'
            }]);

            toast.success("Compte auteur créé !");
            setNewAuthorEmail('');
            setNewAuthorPassword('');
            fetchAuthors();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteAuthor = async (id) => {
        setIsProcessing(true);
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            toast.success("Profil supprimé.");
            fetchAuthors();
            if (selectedAuthor?.id === id) setSelectedAuthor(null);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddItem = async () => {
        if (!newItemName.trim()) return;
        setIsProcessing(true);
        const table = activeTab;
        try {
            const { error } = await supabase
                .from(table)
                .insert([{ name: newItemName.trim() }]);
            if (error) throw error;
            toast.success(`${newItemName} ajouté !`);
            setNewItemName('');
            fetchCategories();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteItem = async (name) => {
        setIsProcessing(true);
        const table = activeTab;
        try {
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('name', name);
            if (error) throw error;
            toast.success('Supprimé avec succès');
            fetchCategories();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const currentList = activeTab === 'levels' ? levels : subjects;
    const filteredAuthors = authors.filter(a => a.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const isAdmin = ['admin@noor.com', 'khayati.med.ahmed@gmail.com'].includes(user?.email);

    if (!isAdmin) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Accès réservé aux administrateurs.</div>;
    }

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
            <div className="aurora"></div>

            {/* Admin Sidebar consistent with AdminHome */}
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
                        <span style={{ fontSize: '0.6rem', color: 'var(--noor-secondary)', fontWeight: 800 }}>CONFIGURATION</span>
                    </div>
                </div>

                <div style={{ flex: 1, padding: '20px' }}>
                    <div className="sidebar-item" onClick={() => navigate('/admin')}>
                        <Activity size={18} />
                        <span>Vue d'ensemble</span>
                    </div>
                    <div className={`sidebar-item ${activeTab === 'levels' ? 'active' : ''}`} onClick={() => setActiveTab('levels')}>
                        <Layers size={18} />
                        <span style={{ fontWeight: activeTab === 'levels' ? 700 : 500 }}>Niveaux Scolaies</span>
                    </div>
                    <div className={`sidebar-item ${activeTab === 'subjects' ? 'active' : ''}`} onClick={() => setActiveTab('subjects')}>
                        <BookOpen size={18} />
                        <span style={{ fontWeight: activeTab === 'subjects' ? 700 : 500 }}>Matières & Sujets</span>
                    </div>
                    <div className={`sidebar-item ${activeTab === 'authors' ? 'active' : ''}`} onClick={() => setActiveTab('authors')}>
                        <Users size={18} />
                        <span style={{ fontWeight: activeTab === 'authors' ? 700 : 500 }}>Auteurs & Accès</span>
                    </div>

                    <div style={{ margin: '20px 0', height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>

                    <div className="sidebar-item" onClick={() => navigate('/dashboard')}>
                        <ChevronLeft size={18} />
                        <span>Retour au Studio</span>
                    </div>
                </div>

                <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                            {user?.email?.[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user?.email?.split('@')[0]}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Administrateur</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, overflow: 'hidden', padding: '48px', display: 'flex', flexDirection: 'column' }}>
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>
                        {activeTab === 'levels' ? 'Gestion des ' : activeTab === 'subjects' ? 'Catalogue des ' : 'Contrôle des '}
                        <span className="gradient-text">
                            {activeTab === 'levels' ? 'Niveaux' : activeTab === 'subjects' ? 'Matières' : 'Accès'}
                        </span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        {activeTab === 'levels' ? 'Définissez les niveaux scolaires disponibles sur la plateforme.' :
                            activeTab === 'subjects' ? 'Gérez les matières et sujets que les auteurs peuvent sélectionner.' :
                                'Gérez les comptes auteurs et leurs permissions spécifiques.'}
                    </p>
                </header>

                <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
                    <AnimatePresence mode="wait">
                        {activeTab !== 'authors' ? (
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}
                            >
                                <div style={{
                                    background: 'rgba(18, 21, 45, 0.4)',
                                    borderRadius: '24px',
                                    padding: '32px',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    gap: '16px'
                                }}>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <Plus size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                        <input
                                            className="input-field"
                                            placeholder={activeTab === 'levels' ? 'Ex: Terminale S, 6ème...' : 'Ex: Mathématiques, Science...'}
                                            value={newItemName}
                                            onChange={(e) => setNewItemName(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                                            style={{ paddingLeft: '48px' }}
                                        />
                                    </div>
                                    <button className="btn-primary" onClick={handleAddItem} disabled={isProcessing} style={{ padding: '0 32px' }}>
                                        {isProcessing ? <Loader2 className="animate-spin" /> : 'Ajouter au catalogue'}
                                    </button>
                                </div>

                                <div style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                    gap: '16px',
                                    paddingRight: '12px'
                                }}>
                                    {currentList.map((item, index) => (
                                        <motion.div
                                            key={item}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="course-card"
                                            style={{
                                                margin: 0,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '24px',
                                                background: 'rgba(255,255,255,0.02)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'var(--noor-primary)' }}></div>
                                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{item}</span>
                                            </div>
                                            <button
                                                onClick={() => setItemToDelete({ name: item })}
                                                style={{ background: 'rgba(255, 71, 87, 0.1)', color: '#ff4757', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.2)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.1)'}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="authors"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                style={{ width: '100%', height: '100%', display: 'flex', gap: '32px' }}
                            >
                                {/* Authors List Split-View Left */}
                                <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ background: 'rgba(18, 21, 45, 0.4)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>AUTEURS ({authors.length})</h3>
                                            <button
                                                className="btn-text"
                                                onClick={() => { setSelectedAuthor(null); }}
                                                style={{ color: 'var(--noor-secondary)', fontSize: '0.8rem', fontWeight: 700 }}
                                            >
                                                + Nouveau
                                            </button>
                                        </div>
                                        <div style={{ position: 'relative', marginBottom: '16px' }}>
                                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                            <input
                                                className="input-field"
                                                placeholder="Rechercher..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                style={{ paddingLeft: '40px', height: '40px', fontSize: '0.85rem' }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
                                            {filteredAuthors.map(author => (
                                                <div
                                                    key={author.id}
                                                    onClick={() => setSelectedAuthor(author)}
                                                    style={{
                                                        padding: '12px 16px',
                                                        background: selectedAuthor?.id === author.id ? 'rgba(72, 52, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                                                        borderRadius: '16px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        transition: 'all 0.2s',
                                                        border: '1px solid',
                                                        borderColor: selectedAuthor?.id === author.id ? 'rgba(72, 52, 212, 0.3)' : 'transparent'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                        <span style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{author.email}</span>
                                                        <span style={{ fontSize: '0.65rem', color: author.role === 'admin' ? 'var(--noor-accent)' : 'var(--text-muted)', fontWeight: 800 }}>
                                                            {author.role?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <ChevronRight size={16} opacity={0.3} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Detail Split-View Right */}
                                <div style={{ flex: 1, display: 'flex' }}>
                                    <AnimatePresence mode="wait">
                                        {!selectedAuthor ? (
                                            <motion.div
                                                key="new-author"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                style={{ width: '100%', background: 'rgba(18, 21, 45, 0.4)', borderRadius: '32px', padding: '48px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
                                            >
                                                <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(72, 52, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                                                    <UserPlus size={40} color="var(--noor-primary)" />
                                                </div>
                                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px' }}>Nouvel Auteur</h3>
                                                <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '400px' }}>Créez un compte pour un nouvel enseignant ou collaborateur.</p>

                                                <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    <div style={{ position: 'relative' }}>
                                                        <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                                        <input className="input-field" placeholder="Adresse Email" value={newAuthorEmail} onChange={(e) => setNewAuthorEmail(e.target.value)} style={{ paddingLeft: '48px' }} />
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                                        <input className="input-field" type="password" placeholder="Mot de passe" value={newAuthorPassword} onChange={(e) => setNewAuthorPassword(e.target.value)} style={{ paddingLeft: '48px' }} />
                                                    </div>
                                                    <button className="btn-primary" onClick={handleCreateAuthor} disabled={isProcessing} style={{ height: '56px', borderRadius: '16px', fontSize: '1rem' }}>
                                                        {isProcessing ? <Loader2 className="animate-spin" /> : 'Enregistrer le compte'}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key={selectedAuthor.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                style={{ width: '100%', background: 'rgba(18, 21, 45, 0.4)', borderRadius: '32px', padding: '40px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800 }}>
                                                            {selectedAuthor.email[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedAuthor.email}</div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <Shield size={14} /> Rôle: {selectedAuthor.role?.toUpperCase()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setAuthorToDelete(selectedAuthor)}
                                                        className="btn-secondary"
                                                        style={{ background: 'rgba(255, 71, 87, 0.1)', border: 'none', color: '#ff4757', padding: '12px 24px' }}
                                                    >
                                                        Supprimer l'accès
                                                    </button>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                                                    <div>
                                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', display: 'block', letterSpacing: '1px' }}>Rôle de l'utilisateur</label>
                                                        <div style={{ display: 'flex', gap: '16px' }}>
                                                            <button
                                                                onClick={() => handleUpdateAuthor(selectedAuthor.id, { role: 'admin' })}
                                                                style={{
                                                                    flex: 1, padding: '20px', borderRadius: '20px', border: '1px solid',
                                                                    background: selectedAuthor.role === 'admin' ? 'rgba(72, 52, 212, 0.1)' : 'rgba(255,255,255,0.02)',
                                                                    borderColor: selectedAuthor.role === 'admin' ? 'var(--noor-primary)' : 'rgba(255,255,255,0.05)',
                                                                    color: 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                <div style={{ fontWeight: 800, marginBottom: '4px', color: selectedAuthor.role === 'admin' ? 'var(--noor-primary)' : 'white' }}>Administrateur</div>
                                                                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Accès total à toutes les configurations et tous les cours.</div>
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateAuthor(selectedAuthor.id, { role: 'author' })}
                                                                style={{
                                                                    flex: 1, padding: '20px', borderRadius: '20px', border: '1px solid',
                                                                    background: selectedAuthor.role === 'author' ? 'rgba(123, 97, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                                                                    borderColor: selectedAuthor.role === 'author' ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.05)',
                                                                    color: 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                <div style={{ fontWeight: 800, marginBottom: '4px', color: selectedAuthor.role === 'author' ? 'var(--noor-secondary)' : 'white' }}>Auteur</div>
                                                                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Accès restreint aux niveaux et matières autorisés.</div>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', display: 'block', letterSpacing: '1px' }}>Permissions Niveaux</label>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                            {levels.map(level => {
                                                                const isAllowed = selectedAuthor.allowed_levels?.includes(level);
                                                                return (
                                                                    <button
                                                                        key={level}
                                                                        onClick={() => {
                                                                            const current = selectedAuthor.allowed_levels || [];
                                                                            const next = isAllowed ? current.filter(l => l !== level) : [...current, level];
                                                                            handleUpdateAuthor(selectedAuthor.id, { allowed_levels: next });
                                                                        }}
                                                                        style={{
                                                                            padding: '10px 18px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
                                                                            background: isAllowed ? 'var(--noor-primary)' : 'rgba(255,255,255,0.05)',
                                                                            border: '1px solid', borderColor: isAllowed ? 'var(--noor-primary)' : 'rgba(255,255,255,0.1)',
                                                                            color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                                                                        }}
                                                                    >
                                                                        {isAllowed ? <Check size={14} /> : <Plus size={14} opacity={0.5} />} {level}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', display: 'block', letterSpacing: '1px' }}>Permissions Matières</label>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                            {subjects.map(subject => {
                                                                const isAllowed = selectedAuthor.allowed_subjects?.includes(subject);
                                                                return (
                                                                    <button
                                                                        key={subject}
                                                                        onClick={() => {
                                                                            const current = selectedAuthor.allowed_subjects || [];
                                                                            const next = isAllowed ? current.filter(s => s !== subject) : [...current, subject];
                                                                            handleUpdateAuthor(selectedAuthor.id, { allowed_subjects: next });
                                                                        }}
                                                                        style={{
                                                                            padding: '10px 18px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
                                                                            background: isAllowed ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.05)',
                                                                            border: '1px solid', borderColor: isAllowed ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.1)',
                                                                            color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                                                                        }}
                                                                    >
                                                                        {isAllowed ? <Check size={14} /> : <Plus size={14} opacity={0.5} />} {subject}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Confirmation Modals */}
            <ConfirmModal
                isOpen={!!authorToDelete}
                onClose={() => setAuthorToDelete(null)}
                onConfirm={() => {
                    handleDeleteAuthor(authorToDelete.id);
                    setAuthorToDelete(null);
                }}
                title="Supprimer l'accès ?"
                message={`Êtes-vous sûr de vouloir supprimer le compte de ${authorToDelete?.email} ? Cette action est irréversible.`}
                confirmText="Oui, supprimer"
                cancelText="Annuler"
            />

            <ConfirmModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={() => {
                    handleDeleteItem(itemToDelete.name);
                    setItemToDelete(null);
                }}
                title={`Supprimer ${activeTab === 'levels' ? 'ce niveau' : 'cette matière'} ?`}
                message={`Voulez-vous vraiment supprimer "${itemToDelete?.name}" ? Cela pourrait impacter les cours associés.`}
                confirmText="Supprimer définitivement"
                cancelText="Annuler"
            />
        </div>
    );
};

export default Settings;
