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
    Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import useCourseStore from '../stores/courseStore';
import toast from 'react-hot-toast';

const Settings = () => {
    const navigate = useNavigate();
    const { levels, subjects, fetchCategories } = useCourseStore();

    const [activeTab, setActiveTab] = useState('levels');
    const [newItemName, setNewItemName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleAddItem = async () => {
        if (!newItemName.trim()) return;
        setIsProcessing(true);
        const table = activeTab; // 'levels' or 'subjects'

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
        if (!confirm(`Voulez-vous vraiment supprimer "${name}" ?`)) return;
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
                    <p style={{ color: 'var(--text-secondary)' }}>Gérez les catégories de votre plateforme</p>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '40px' }}>
                {/* Tabs Sidebar */}
                <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        className={`btn-tab ${activeTab === 'levels' ? 'active' : ''}`}
                        onClick={() => setActiveTab('levels')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '16px 24px',
                            borderRadius: '16px',
                            background: activeTab === 'levels' ? 'var(--noor-primary)' : 'rgba(255,255,255,0.05)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <Layers size={20} /> Niveaux
                    </button>
                    <button
                        className={`btn-tab ${activeTab === 'subjects' ? 'active' : ''}`}
                        onClick={() => setActiveTab('subjects')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '16px 24px',
                            borderRadius: '16px',
                            background: activeTab === 'subjects' ? 'var(--noor-primary)' : 'rgba(255,255,255,0.05)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <BookOpen size={20} /> Matières
                    </button>
                </div>

                {/* Content Area */}
                <div style={{
                    flex: 1,
                    background: 'rgba(18, 21, 45, 0.4)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    padding: '40px',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                        <input
                            className="input-field"
                            placeholder={activeTab === 'levels' ? 'Nouveau niveau (ex: Lycée 1)...' : 'Nouvelle matière (ex: Philosophie)...'}
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                        />
                        <button className="btn-primary" onClick={handleAddItem} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="animate-spin" /> : <><Plus size={20} /> Ajouter</>}
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {currentList.map((item, index) => (
                            <motion.div
                                key={item}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px 24px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}
                            >
                                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{item}</span>
                                <button
                                    onClick={() => handleDeleteItem(null, item)}
                                    style={{
                                        background: 'rgba(255, 71, 87, 0.1)',
                                        color: '#ff4757',
                                        border: 'none',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
