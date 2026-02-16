import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    Settings as SettingsIcon,
    Plus,
    Trash2,
    Save,
    Layers,
    BookOpen,
    Loader2,
    Users,
    ChevronRight as ChevronRightIcon,
    Check
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';
import useCourseStore from '../stores/courseStore';
import toast from 'react-hot-toast';

const Settings = () => {
    const navigate = useNavigate();
    const { levels, subjects, fetchCategories } = useCourseStore();

    const [activeTab, setActiveTab] = useState('levels');
    const [newItemName, setNewItemName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [authors, setAuthors] = useState([]);
    const [selectedAuthor, setSelectedAuthor] = useState(null);
    const [newAuthorEmail, setNewAuthorEmail] = useState('');
    const [newAuthorPassword, setNewAuthorPassword] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    // Recovery states for confirmation modals
    const [authorToDelete, setAuthorToDelete] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        fetchCategories();
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        getUser();
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
                const { data: { user } } = await supabase.auth.getUser();
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
            fetchAuthors();
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
                options: {
                    data: { role: 'author' }
                }
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

    const handleDeleteAuthor = async (id, email) => {
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
            toast.success(`${newItemName} ajouté avec succès`);
            setNewItemName('');
            fetchCategories();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteItem = async (id, name) => {
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

    return (
        <div className="app-container" style={{ padding: '40px' }}>
            <div className="aurora"></div>

            <header style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '48px' }}>
                <button className="btn-secondary" onClick={() => navigate('/')} style={{ padding: '12px' }}>
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Configuration</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Gérez les catégories et accès de votre plateforme</p>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '40px' }}>
                <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        className={`btn-tab ${activeTab === 'levels' ? 'active' : ''}`}
                        onClick={() => setActiveTab('levels')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', borderRadius: '16px',
                            background: activeTab === 'levels' ? 'var(--noor-primary)' : 'rgba(255,255,255,0.05)',
                            color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s ease'
                        }}
                    >
                        <Layers size={20} /> Niveaux
                    </button>
                    <button
                        className={`btn-tab ${activeTab === 'subjects' ? 'active' : ''}`}
                        onClick={() => setActiveTab('subjects')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', borderRadius: '16px',
                            background: activeTab === 'subjects' ? 'var(--noor-primary)' : 'rgba(255,255,255,0.05)',
                            color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s ease'
                        }}
                    >
                        <BookOpen size={20} /> Matières
                    </button>
                    <button
                        className={`btn-tab ${activeTab === 'authors' ? 'active' : ''}`}
                        onClick={() => setActiveTab('authors')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', borderRadius: '16px',
                            background: activeTab === 'authors' ? 'var(--noor-primary)' : 'rgba(255,255,255,0.05)',
                            color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s ease'
                        }}
                    >
                        <Users size={20} /> Auteurs & Accès
                    </button>
                </div>

                <div style={{
                    flex: 1, background: 'rgba(18, 21, 45, 0.4)', backdropFilter: 'blur(20px)',
                    borderRadius: '24px', padding: '40px', border: '1px solid var(--border-color)', minHeight: '600px'
                }}>
                    {activeTab !== 'authors' ? (
                        <>
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                                <input
                                    className="input-field"
                                    placeholder={activeTab === 'levels' ? 'Nouveau niveau...' : 'Nouvelle matière...'}
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                                />
                                <button className="btn-primary" onClick={handleAddItem} disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <Plus size={20} />} Ajouter
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {currentList.map((item, index) => (
                                    <motion.div
                                        key={item} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '16px 24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}
                                    >
                                        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{item}</span>
                                        <button
                                            onClick={() => setItemToDelete({ id: null, name: item })}
                                            style={{ background: 'rgba(255, 71, 87, 0.1)', color: '#ff4757', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 700 }}>➕ Ajouter un nouvel auteur</h3>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <input className="input-field" placeholder="Email" value={newAuthorEmail} onChange={(e) => setNewAuthorEmail(e.target.value)} style={{ flex: 1 }} />
                                    <input className="input-field" type="password" placeholder="Mot de passe" value={newAuthorPassword} onChange={(e) => setNewAuthorPassword(e.target.value)} style={{ flex: 1 }} />
                                    <button className="btn-primary" onClick={handleCreateAuthor} disabled={isProcessing}>Créer le compte</button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '40px' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Liste des comptes</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {authors.map(author => (
                                            <div
                                                key={author.id} onClick={() => setSelectedAuthor(author)}
                                                style={{
                                                    padding: '16px', background: selectedAuthor?.id === author.id ? 'var(--noor-primary)' : 'rgba(255,255,255,0.03)',
                                                    borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', border: '1px solid',
                                                    borderColor: selectedAuthor?.id === author.id ? 'var(--noor-primary)' : 'transparent'
                                                }}
                                            >
                                                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                                    <span style={{ fontWeight: 600, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{author.email}</span>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', background: author.role === 'admin' ? '#ff4757' : 'rgba(255,255,255,0.1)', color: 'white' }}>{author.role?.toUpperCase()}</span>
                                                        {currentUser?.id === author.id && <span style={{ fontSize: '0.65rem', color: 'var(--noor-success)' }}>(Vous)</span>}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {currentUser?.id !== author.id && (
                                                        <button onClick={(e) => { e.stopPropagation(); setAuthorToDelete(author); }} style={{ background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                                                    )}
                                                    <ChevronRightIcon size={18} opacity={0.5} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedAuthor && (
                                    <div style={{ flex: 1.5, background: 'rgba(255,255,255,0.02)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <h3 style={{ fontSize: '1.1rem', color: 'var(--noor-secondary)', marginBottom: '24px' }}>Paramètres : {selectedAuthor.email}</h3>

                                        <div style={{ marginBottom: '32px' }}>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Type d'accès</label>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                {['admin', 'author'].map(role => (
                                                    <button key={role} onClick={() => handleUpdateAuthor(selectedAuthor.id, { role })} style={{
                                                        padding: '10px 24px', borderRadius: '12px', border: '1px solid', borderColor: selectedAuthor.role === role ? 'transparent' : 'rgba(255,255,255,0.1)',
                                                        background: selectedAuthor.role === role ? 'var(--noor-primary)' : 'rgba(255,255,255,0.03)', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, flex: 1
                                                    }}>
                                                        {role === 'admin' ? 'Administrateur (Tout)' : 'Auteur (Limité)'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '32px' }}>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Accès aux Niveaux</label>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {levels.map(level => {
                                                    const isAllowed = selectedAuthor.allowed_levels?.includes(level);
                                                    return (
                                                        <button key={level} onClick={() => {
                                                            const current = selectedAuthor.allowed_levels || [];
                                                            const next = isAllowed ? current.filter(l => l !== level) : [...current, level];
                                                            handleUpdateAuthor(selectedAuthor.id, { allowed_levels: next });
                                                            setSelectedAuthor({ ...selectedAuthor, allowed_levels: next });
                                                        }} style={{
                                                            padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', background: isAllowed ? 'var(--noor-primary)' : 'rgba(255,255,255,0.05)',
                                                            border: 'none', color: 'white', cursor: 'pointer'
                                                        }}>
                                                            {isAllowed && <Check size={12} style={{ marginRight: '6px' }} />} {level}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Accès aux Matières</label>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {subjects.map(subject => {
                                                    const isAllowed = selectedAuthor.allowed_subjects?.includes(subject);
                                                    return (
                                                        <button key={subject} onClick={() => {
                                                            const current = selectedAuthor.allowed_subjects || [];
                                                            const next = isAllowed ? current.filter(s => s !== subject) : [...current, subject];
                                                            handleUpdateAuthor(selectedAuthor.id, { allowed_subjects: next });
                                                            setSelectedAuthor({ ...selectedAuthor, allowed_subjects: next });
                                                        }} style={{
                                                            padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', background: isAllowed ? 'var(--noor-primary)' : 'rgba(255,255,255,0.05)',
                                                            border: 'none', color: 'white', cursor: 'pointer'
                                                        }}>
                                                            {isAllowed && <Check size={12} style={{ marginRight: '6px' }} />} {subject}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modals */}
            <ConfirmModal
                isOpen={!!authorToDelete}
                onClose={() => setAuthorToDelete(null)}
                onConfirm={() => handleDeleteAuthor(authorToDelete.id, authorToDelete.email)}
                title="Supprimer l'auteur ?"
                message={`Êtes-vous sûr de vouloir supprimer le compte de ${authorToDelete?.email} ? Ses accès seront révoqués immédiatement.`}
                confirmText="Oui, supprimer"
            />

            <ConfirmModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={() => handleDeleteItem(itemToDelete.id, itemToDelete.name)}
                title={`Supprimer ${activeTab === 'levels' ? 'ce niveau' : 'cette matière'} ?`}
                message={`Voulez-vous vraiment supprimer "${itemToDelete?.name}" ? Cela pourrait impacter les cours associés.`}
                confirmText="Supprimer définitivement"
            />
        </div>
    );
};

export default Settings;
