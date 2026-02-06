import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Save,
    Play,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Upload,
    Settings,
    Layout,
    Image as ImageIcon,
    Type,
    Link as LinkIcon,
    CheckCircle2,
    FileCode,
    AlertTriangle,
    Home,
    Eye,
    Edit2,
    ListChecks,
    HelpCircle,
    ArrowDownUp,
    Layers,
    Video,
    Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import useCourseStore from '../stores/courseStore';
import SlideRenderer from '../components/SlideRenderer';


const SLIDE_TYPES = [
    { id: 'SPLASH', label: 'Accueil', icon: ImageIcon },
    { id: 'STORY', label: 'Histoire', icon: LinkIcon },
    { id: 'CHOICE', label: 'QCM', icon: ListChecks },
    { id: 'TRUE_FALSE', label: 'Vrai/Faux', icon: HelpCircle },
    { id: 'ORDERING', label: 'Séquence', icon: ArrowDownUp },
    { id: 'MATCHING_PAIRS', label: 'Paires', icon: Layout },
    { id: 'SORTING', label: 'Tri', icon: Layers },
    { id: 'GAP_FILL', label: 'Trous', icon: Type },
    { id: 'DRAG_IMAGE', label: 'Identification', icon: CheckCircle2 },
    { id: 'LABEL_IMAGE', label: 'Étiquettes', icon: ImageIcon },
    { id: 'VIDEO', label: 'Vidéo Int.', icon: Video },
    { id: 'REPORT', label: 'Bilan', icon: CheckCircle2 },
];

const CourseEditor = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const {
        course,
        activeSlideIndex,
        setActiveSlideIndex,
        addSlide,
        updateActiveSlide,
        deleteSlide,
        setCourse,
        updateCourseMetadata,
        isPreviewMode,
        setPreviewMode,
        saveCourse,
        isSaving,
        uploadAsset,
        levels,
        subjects,
        fetchCategories
    } = useCourseStore();

    useEffect(() => {
        if (levels.length === 0 || subjects.length === 0) {
            fetchCategories();
        }
    }, []);

    const [lastSaved, setLastSaved] = useState(null);

    const handleSave = async () => {
        const toastId = toast.loading('Sauvegarde en cours...');
        const success = await saveCourse();
        if (success) {
            setLastSaved(new Date().toLocaleTimeString());
            toast.success('Cours sauvegardé sur Supabase !', { id: toastId });
        } else {
            const { lastError } = useCourseStore.getState();
            toast.error(`Erreur: ${lastError || 'Sauvegarde échouée'}`, { id: toastId });
        }
    };

    const activeSlide = course?.slides ? course.slides[activeSlideIndex] : null;

    if (!activeSlide) {
        return (
            <div className="editor-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ marginBottom: '20px' }}></div>
                    <p>Chargement du cours...</p>
                </div>
            </div>
        );
    }

    const handleImportSCORM = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const toastId = toast.loading('Conversion du SCORM en cours...');

        try {
            const zip = await JSZip.loadAsync(file);
            const mainXmlFile = zip.file('pages/main.xml');
            if (!mainXmlFile) throw new Error('Format mAuthor non reconnu.');

            const mainXmlText = await mainXmlFile.async('string');
            const parser = new DOMParser();
            const mainDoc = parser.parseFromString(mainXmlText, 'text/xml');

            const pageNodes = mainDoc.querySelectorAll('page[href]');
            const newSlides = [];

            for (const [index, pageNode] of Array.from(pageNodes).entries()) {
                const href = pageNode.getAttribute('href');
                const name = pageNode.getAttribute('name');
                const pageXmlFile = zip.file(`pages/${href}`);

                if (pageXmlFile) {
                    const pageXmlText = await pageXmlFile.async('string');
                    const pageDoc = parser.parseFromString(pageXmlText, 'text/xml');

                    // 1. Check for Video (YouTube)
                    const youtubeAddon = pageDoc.querySelector('addonModule[addonId="YouTube_Addon"]');
                    if (youtubeAddon) {
                        const urlProperty = youtubeAddon.querySelector('property[name="URL"]');
                        newSlides.push({
                            id: `scorm-${Date.now()}-${index}`,
                            type: 'STORY',
                            title: name || 'Vidéo',
                            url: urlProperty?.getAttribute('value') || ''
                        });
                        continue;
                    }

                    // 2. Check for Text with Gaps (GAP_FILL)
                    const textModules = Array.from(pageDoc.querySelectorAll('textModule text'));
                    let fullText = '';
                    let hasGaps = false;

                    textModules.forEach(tm => {
                        let content = tm.textContent || '';
                        if (content.includes('\\gap{')) {
                            hasGaps = true;
                            // Convert \gap{word} to [word]
                            content = content.replace(/\\gap\{([^}]+)\}/g, '[$1]');
                        }
                        // Clean up HTML tags if any (basic)
                        content = content.replace(/<[^>]*>?/gm, '');
                        fullText += content + '\n';
                    });

                    if (hasGaps) {
                        // Extract bank from sourceListModule if available
                        const sourceListItems = Array.from(pageDoc.querySelectorAll('sourceListModule item'));
                        const bank = sourceListItems.map(item => item.textContent.trim());

                        newSlides.push({
                            id: `scorm-${Date.now()}-${index}`,
                            type: 'GAP_FILL',
                            title: name || 'Exercice',
                            instruction: 'Complétez le texte avec les mots manquants.',
                            content: fullText.trim(),
                            bank: bank.length > 0 ? bank : []
                        });
                        continue;
                    }

                    // 3. Check for Choice (QCM) - basic detection
                    const choiceModule = pageDoc.querySelector('choiceModule');
                    if (choiceModule) {
                        const options = Array.from(choiceModule.querySelectorAll('item')).map(item => ({
                            text: item.textContent.trim(),
                            isCorrect: item.getAttribute('value') === '1' // Simplification
                        }));
                        newSlides.push({
                            id: `scorm-${Date.now()}-${index}`,
                            type: 'CHOICE',
                            title: name || 'Question',
                            instruction: 'Choisissez la bonne réponse.',
                            options
                        });
                        continue;
                    }

                    // 4. Check for Image (SPLASH with image)
                    const imageModule = pageDoc.querySelector('imageModule image');
                    if (imageModule) {
                        const imgSrc = imageModule.getAttribute('src');
                        // Note: actual image upload would require extracting from zip and calling uploadAsset
                        newSlides.push({
                            id: `scorm-${Date.now()}-${index}`,
                            type: 'SPLASH',
                            title: name || 'Image',
                            description: 'Image importée de SCORM',
                            image: imgSrc || ''
                        });
                        continue;
                    }

                    // 5. Fallback to SPLASH
                    newSlides.push({
                        id: `scorm-${Date.now()}-${index}`,
                        type: 'SPLASH',
                        title: name || 'Diapo',
                        description: 'Contenu importé',
                        image: ''
                    });
                }
            }



            if (newSlides.length > 0) {
                setCourse({
                    ...course,
                    title: mainDoc.querySelector('interactiveContent')?.getAttribute('name') || course.title,
                    slides: newSlides
                });
                setActiveSlideIndex(0);
                toast.success('SCORM importé !', { id: toastId });
            }
        } catch (err) {
            toast.error(err.message, { id: toastId });
        } finally {
            event.target.value = '';
        }
    };

    return (
        <div className="editor-container">
            {/* Aurora Background Effect */}
            <div className="aurora"></div>

            <header className="editor-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button onClick={() => navigate('/')} className="btn-secondary" style={{ padding: '8px' }}>
                        <Home size={20} />
                    </button>
                    <div style={{ borderLeft: '1px solid var(--border-color)', height: '30px' }}></div>
                    <div>
                        <input
                            type="text"
                            value={course.title}
                            onChange={(e) => updateCourseMetadata({ title: e.target.value })}
                            className="input-field"
                            style={{ fontSize: '1.1rem', fontWeight: 800, border: 'none', background: 'transparent', padding: 0, width: '250px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select
                                value={course.level}
                                onChange={(e) => updateCourseMetadata({ level: e.target.value })}
                                className="input-field"
                                style={{ fontSize: '0.65rem', padding: '2px 8px', width: 'auto', background: 'transparent' }}
                            >
                                {levels.map(l => <option key={l} value={l} style={{ background: 'var(--bg-secondary)' }}>{l}</option>)}
                            </select>

                            <select
                                value={course.subject}
                                onChange={(e) => updateCourseMetadata({ subject: e.target.value })}
                                className="input-field"
                                style={{ fontSize: '0.65rem', padding: '2px 8px', width: 'auto', background: 'transparent' }}
                            >
                                {subjects.map(s => <option key={s} value={s} style={{ background: 'var(--bg-secondary)' }}>{s}</option>)}
                            </select>

                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }}></div>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{course?.slides?.length || 0} Slides</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className={`btn-secondary ${isPreviewMode ? 'active' : ''}`}
                        onClick={() => setPreviewMode(!isPreviewMode)}
                        style={{ borderColor: isPreviewMode ? 'var(--noor-secondary)' : '' }}
                    >
                        {isPreviewMode ? <Edit2 size={18} /> : <Eye size={18} />}
                        {isPreviewMode ? 'Éditer' : 'Aperçu'}
                    </button>

                    <input type="file" ref={fileInputRef} onChange={handleImportSCORM} accept=".zip" hidden />
                    <button className="btn-secondary" onClick={() => fileInputRef.current.click()}>
                        <Upload size={18} /> SCORM
                    </button>

                    {lastSaved && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', color: 'var(--text-muted)', marginRight: '8px' }}>
                            <Clock size={12} /> Sauvegardé à {lastSaved}
                        </div>
                    )}
                    <button
                        className="btn-primary"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? <Save size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left Sidebar - Navigation */}
                <aside style={{
                    width: '280px',
                    background: 'rgba(18, 21, 45, 0.4)',
                    backdropFilter: 'blur(10px)',
                    borderRight: '1px solid var(--border-color)',
                    padding: '24px',
                    overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Structure du cours</span>
                        <button className="btn-primary" style={{ padding: '6px' }} onClick={() => addSlide()}>
                            <Plus size={16} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(course?.slides || []).map((slide, idx) => (
                            <motion.div
                                key={slide.id}
                                whileHover={{ x: 4 }}
                                className={`sidebar-item ${idx === activeSlideIndex ? 'active' : ''}`}
                                onClick={() => setActiveSlideIndex(idx)}
                                style={{ position: 'relative' }}
                            >
                                <div style={{ width: '28px', height: '28px', background: 'var(--bg-tertiary)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '11px', fontWeight: 800 }}>
                                    {idx + 1}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slide.title}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>{slide.type}</div>
                                </div>
                                {idx === activeSlideIndex && (course?.slides?.length || 0) > 1 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }}
                                        style={{ background: 'none', border: 'none', color: 'var(--noor-accent)', cursor: 'pointer', padding: '4px' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </aside>

                {/* Main Canvas Area */}
                <main style={{
                    flex: 1,
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    overflowY: 'auto'
                }}>
                    {/* Toolbar Type Selection */}
                    {!isPreviewMode && (
                        <div style={{
                            marginBottom: '32px',
                            display: 'flex',
                            gap: '6px',
                            background: 'var(--bg-secondary)',
                            padding: '6px',
                            borderRadius: '16px',
                            border: '1px solid var(--glass-border)',
                            boxShadow: 'var(--shadow-md)'
                        }}>
                            {SLIDE_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => updateActiveSlide({ type: type.id })}
                                    style={{
                                        padding: '10px 18px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: activeSlide.type === type.id ? 'var(--gradient-primary)' : 'transparent',
                                        color: activeSlide.type === type.id ? 'white' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.2s',
                                        minWidth: '70px'
                                    }}
                                >
                                    <type.icon size={18} />
                                    <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}>{type.label.split(' ')[0]}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Active Area */}
                    <div style={{ width: '100%', maxWidth: '900px', position: 'relative' }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeSlideIndex + (isPreviewMode ? '-p' : '-e')}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                style={{
                                    width: '100%',
                                    maxWidth: course.aspectRatio === '9/16' ? '450px' : course.aspectRatio === '1/1' ? '700px' : '900px',
                                    margin: '0 auto',
                                    aspectRatio: course.aspectRatio || '16/9',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '32px',
                                    padding: activeSlide?.type === 'STORY' ? '0' : '48px',
                                    border: '1px solid var(--glass-border)',
                                    boxShadow: 'var(--shadow-lg)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                {/* Simulator Indicators */}
                                <div style={{ position: 'absolute', top: '24px', left: '24px', display: 'flex', gap: '8px', zIndex: 10 }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
                                </div>

                                <SlideRenderer
                                    slide={activeSlide}
                                    isPreview={isPreviewMode}
                                    onUpdate={updateActiveSlide}
                                />
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
                            <button
                                disabled={activeSlideIndex === 0}
                                onClick={() => setActiveSlideIndex(activeSlideIndex - 1)}
                                className="btn-secondary"
                                style={{ opacity: activeSlideIndex === 0 ? 0.3 : 1 }}
                            >
                                <ChevronLeft size={18} /> Précédent
                            </button>
                            <div style={{ background: 'var(--bg-secondary)', padding: '8px 20px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, border: '1px solid var(--glass-border)' }}>
                                PAGE {activeSlideIndex + 1} / {course.slides.length}
                            </div>
                            <button
                                disabled={activeSlideIndex === course.slides.length - 1}
                                onClick={() => setActiveSlideIndex(activeSlideIndex + 1)}
                                className="btn-secondary"
                                style={{ opacity: activeSlideIndex === course.slides.length - 1 ? 0.3 : 1 }}
                            >
                                Suivant <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </main>

                {/* Right Sidebar - Properties */}
                <aside style={{
                    width: '320px',
                    background: 'rgba(18, 21, 45, 0.6)',
                    backdropFilter: 'blur(20px)',
                    borderLeft: '1px solid var(--border-color)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                        <Settings size={18} /> CONFIGURATION
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
                        {/* Global Course Props */}
                        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Niveau</label>
                                <select
                                    className="input-field"
                                    value={course.level}
                                    onChange={(e) => updateCourseMetadata({ level: e.target.value })}
                                    style={{ background: 'var(--bg-tertiary)' }}
                                >
                                    {levels.map(l => <option key={l} value={l} style={{ background: 'var(--bg-secondary)' }}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Matière</label>
                                <select
                                    className="input-field"
                                    value={course.subject}
                                    onChange={(e) => updateCourseMetadata({ subject: e.target.value })}
                                    style={{ background: 'var(--bg-tertiary)' }}
                                >
                                    {subjects.map(s => <option key={s} value={s} style={{ background: 'var(--bg-secondary)' }}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Format des Slides</label>
                                <select
                                    className="input-field"
                                    value={course.aspectRatio || '16/9'}
                                    onChange={(e) => updateCourseMetadata({ aspectRatio: e.target.value })}
                                    style={{ background: 'var(--bg-tertiary)' }}
                                >
                                    <option value="16/9" style={{ background: 'var(--bg-secondary)' }}>16:9 - Écran Large</option>
                                    <option value="4/3" style={{ background: 'var(--bg-secondary)' }}>4:3 - Standard</option>
                                    <option value="1/1" style={{ background: 'var(--bg-secondary)' }}>1:1 - Carré</option>
                                    <option value="9/16" style={{ background: 'var(--bg-secondary)' }}>9:16 - Vertical</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Icône (Emoji)</label>
                                <input
                                    className="input-field"
                                    value={course.icon || '📘'}
                                    onChange={(e) => updateCourseMetadata({ icon: e.target.value })}
                                    maxLength={2}
                                    style={{ width: '50px', textAlign: 'center', fontSize: '1.2rem' }}
                                />
                            </div>
                        </section>

                        <div style={{ height: '1px', background: 'var(--border-color)' }}></div>

                        {/* Active Slide Specific Props */}
                        <section>
                            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase', marginBottom: '16px', display: 'block', letterSpacing: '1px' }}>PROPRIÉTÉS DIAPOSITIVE</label>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Titre Affiché</label>
                                    <input
                                        className="input-field"
                                        value={activeSlide.title}
                                        onChange={(e) => updateActiveSlide({ title: e.target.value })}
                                    />
                                </div>

                                {activeSlide.type === 'SPLASH' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Texte d'introduction</label>
                                            <textarea
                                                className="input-field"
                                                rows={4}
                                                value={activeSlide.description}
                                                onChange={(e) => updateActiveSlide({ description: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Image de couverture</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    className="input-field"
                                                    style={{ flex: 1 }}
                                                    value={activeSlide.image || ''}
                                                    onChange={(e) => updateActiveSlide({ image: e.target.value })}
                                                    placeholder="URL ou upload..."
                                                />
                                                <button
                                                    className="btn-secondary"
                                                    style={{ padding: '8px' }}
                                                    onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'file';
                                                        input.accept = 'image/*';
                                                        input.onchange = async (e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                const toastId = toast.loading('Upload de l\'image...');
                                                                const url = await uploadAsset(file);
                                                                if (url) {
                                                                    updateActiveSlide({ image: url });
                                                                    toast.success('Image ajoutée !', { id: toastId });
                                                                } else {
                                                                    toast.error('Erreur d\'upload', { id: toastId });
                                                                }
                                                            }
                                                        };
                                                        input.click();
                                                    }}
                                                >
                                                    <Upload size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSlide.type === 'STORY' && (
                                    <div>
                                        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>URL Source (H5P/Vimeo)</label>
                                        <input
                                            className="input-field"
                                            value={activeSlide.url || ''}
                                            onChange={(e) => updateActiveSlide({ url: e.target.value })}
                                        />
                                    </div>
                                )}

                                {activeSlide.type === 'MATCHING_PAIRS' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Consigne de l'exercice</label>
                                            <input
                                                className="input-field"
                                                value={activeSlide.instruction || ''}
                                                onChange={(e) => updateActiveSlide({ instruction: e.target.value })}
                                                placeholder="Ex: Reliez les mots..."
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Question / Énoncé</label>
                                            <textarea
                                                className="input-field"
                                                rows={2}
                                                value={activeSlide.question || ''}
                                                onChange={(e) => updateActiveSlide({ question: e.target.value })}
                                                placeholder="Saisissez le texte d'accompagnement..."
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Liste des Paires (A ↔ B)</label>
                                            {(activeSlide.pairs || []).map((pair, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <input
                                                        className="input-field"
                                                        style={{ padding: '8px', fontSize: '0.8rem' }}
                                                        value={pair.en}
                                                        onChange={(e) => {
                                                            const newPairs = [...activeSlide.pairs];
                                                            newPairs[idx].en = e.target.value;
                                                            updateActiveSlide({ pairs: newPairs });
                                                        }}
                                                    />
                                                    <input
                                                        className="input-field"
                                                        style={{ padding: '8px', fontSize: '0.8rem' }}
                                                        value={pair.fr}
                                                        onChange={(e) => {
                                                            const newPairs = [...activeSlide.pairs];
                                                            newPairs[idx].fr = e.target.value;
                                                            updateActiveSlide({ pairs: newPairs });
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const newPairs = activeSlide.pairs.filter((_, i) => i !== idx);
                                                            updateActiveSlide({ pairs: newPairs });
                                                        }}
                                                        style={{ background: 'none', border: 'none', color: 'var(--noor-accent)', cursor: 'pointer' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                className="btn-secondary"
                                                style={{ padding: '8px', fontSize: '0.75rem', width: '100%', marginTop: '8px' }}
                                                onClick={() => {
                                                    const newPairs = [...(activeSlide.pairs || []), { en: '', fr: '' }];
                                                    updateActiveSlide({ pairs: newPairs });
                                                }}
                                            >
                                                <Plus size={14} /> Ajouter une paire
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeSlide.type === 'DRAG_IMAGE' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Consigne</label>
                                            <input
                                                className="input-field"
                                                value={activeSlide.instruction || ''}
                                                onChange={(e) => updateActiveSlide({ instruction: e.target.value })}
                                                placeholder="Ex: Identifiez les zones..."
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Question / Contexte</label>
                                            <textarea
                                                className="input-field"
                                                rows={2}
                                                value={activeSlide.question || ''}
                                                onChange={(e) => updateActiveSlide({ question: e.target.value })}
                                                placeholder="Saisissez le texte d'explication..."
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Image de fond (URL)</label>
                                            <input
                                                className="input-field"
                                                value={activeSlide.mainImage || ''}
                                                onChange={(e) => updateActiveSlide({ mainImage: e.target.value })}
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Éléments à Identifier</label>
                                            {(activeSlide.items || []).map((item, idx) => (
                                                <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <input
                                                            className="input-field"
                                                            style={{ padding: '6px', fontSize: '0.8rem' }}
                                                            value={item.label}
                                                            onChange={(e) => {
                                                                const newItems = [...activeSlide.items];
                                                                newItems[idx].label = e.target.value;
                                                                updateActiveSlide({ items: newItems });
                                                            }}
                                                            placeholder="Nom de l'élément"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const newItems = activeSlide.items.filter((_, i) => i !== idx);
                                                                updateActiveSlide({ items: newItems });
                                                            }}
                                                            style={{ background: 'none', border: 'none', color: 'var(--noor-accent)', cursor: 'pointer' }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ fontSize: '0.55rem', color: 'var(--text-muted)', display: 'block' }}>X (%)</label>
                                                            <input type="number" className="input-field" value={parseInt(item.x) || 0} onChange={(e) => {
                                                                const newItems = [...activeSlide.items];
                                                                newItems[idx].x = e.target.value + '%';
                                                                updateActiveSlide({ items: newItems });
                                                            }} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ fontSize: '0.55rem', color: 'var(--text-muted)', display: 'block' }}>Y (%)</label>
                                                            <input type="number" className="input-field" value={parseInt(item.y) || 0} onChange={(e) => {
                                                                const newItems = [...activeSlide.items];
                                                                newItems[idx].y = e.target.value + '%';
                                                                updateActiveSlide({ items: newItems });
                                                            }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                className="btn-secondary"
                                                style={{ padding: '8px', fontSize: '0.75rem', width: '100%', marginTop: '8px' }}
                                                onClick={() => {
                                                    const newItems = [...(activeSlide.items || []), { label: '', x: '50%', y: '50%' }];
                                                    updateActiveSlide({ items: newItems });
                                                }}
                                            >
                                                <Plus size={14} /> Ajouter un élément
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeSlide.type === 'GAP_FILL' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Texte de l'exercice</label>
                                            <textarea
                                                className="input-field"
                                                rows={8}
                                                value={activeSlide.content || ''}
                                                onChange={(e) => updateActiveSlide({ content: e.target.value })}
                                                placeholder="Saisissez votre texte ici..."
                                            />
                                            <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(72, 52, 212, 0.05)', borderRadius: '12px', border: '1px solid rgba(72, 52, 212, 0.1)' }}>
                                                <p style={{ fontSize: '0.65rem', color: 'var(--noor-secondary)', fontWeight: 800, marginBottom: '4px' }}>💡 ASTUCE</p>
                                                <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                                    Utilisez des crochets pour créer des trous. <br />
                                                    Exemple : "Le chat [mange] la souris."
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Consigne</label>
                                            <input
                                                className="input-field"
                                                value={activeSlide.instruction || ''}
                                                onChange={(e) => updateActiveSlide({ instruction: e.target.value })}
                                                placeholder="Ex: Complétez les phrases..."
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeSlide.type === 'LABEL_IMAGE' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Consigne</label>
                                            <input
                                                className="input-field"
                                                value={activeSlide.instruction || ''}
                                                onChange={(e) => updateActiveSlide({ instruction: e.target.value })}
                                                placeholder="Ex: Placez les étiquettes..."
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Question / Énoncé</label>
                                            <textarea
                                                className="input-field"
                                                rows={2}
                                                value={activeSlide.question || ''}
                                                onChange={(e) => updateActiveSlide({ question: e.target.value })}
                                                placeholder="Saisissez l'énoncé de l'exercice..."
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Image de l'exercice (URL)</label>
                                            <input
                                                className="input-field"
                                                value={activeSlide.mainImage || ''}
                                                onChange={(e) => updateActiveSlide({ mainImage: e.target.value })}
                                                placeholder="URL de l'image..."
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Étiquettes à placer</label>
                                            {(activeSlide.labels || []).map((label, idx) => (
                                                <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <input
                                                            className="input-field"
                                                            style={{ padding: '6px', fontSize: '0.8rem' }}
                                                            value={label.text}
                                                            onChange={(e) => {
                                                                const newLabels = [...activeSlide.labels];
                                                                newLabels[idx].text = e.target.value;
                                                                updateActiveSlide({ labels: newLabels });
                                                            }}
                                                            placeholder="Texte de l'étiquette"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const newLabels = activeSlide.labels.filter((_, i) => i !== idx);
                                                                updateActiveSlide({ labels: newLabels });
                                                            }}
                                                            style={{ background: 'none', border: 'none', color: 'var(--noor-accent)', cursor: 'pointer' }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ fontSize: '0.55rem', color: 'var(--text-muted)', display: 'block' }}>X (%)</label>
                                                            <input type="number" className="input-field" value={parseInt(label.x) || 0} onChange={(e) => {
                                                                const newLabels = [...activeSlide.labels];
                                                                newLabels[idx].x = e.target.value + '%';
                                                                updateActiveSlide({ labels: newLabels });
                                                            }} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ fontSize: '0.55rem', color: 'var(--text-muted)', display: 'block' }}>Y (%)</label>
                                                            <input type="number" className="input-field" value={parseInt(label.y) || 0} onChange={(e) => {
                                                                const newLabels = [...activeSlide.labels];
                                                                newLabels[idx].y = e.target.value + '%';
                                                                updateActiveSlide({ labels: newLabels });
                                                            }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                className="btn-secondary"
                                                style={{ padding: '8px', fontSize: '0.75rem', width: '100%', marginTop: '8px' }}
                                                onClick={() => {
                                                    const newLabels = [...(activeSlide.labels || []), { text: '', x: '50%', y: '50%' }];
                                                    updateActiveSlide({ labels: newLabels });
                                                }}
                                            >
                                                <Plus size={14} /> Ajouter une étiquette
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeSlide.type === 'CHOICE' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Consigne</label>
                                            <input className="input-field" value={activeSlide.instruction || ''} onChange={(e) => updateActiveSlide({ instruction: e.target.value })} placeholder="Ex: Choisissez la bonne réponse" />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Question / Énoncé</label>
                                            <textarea className="input-field" value={activeSlide.question || ''} onChange={(e) => updateActiveSlide({ question: e.target.value })} rows={3} placeholder="Saisissez votre question ici..." />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Options de réponse</label>
                                            {(activeSlide.options || []).map((opt, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={opt.isCorrect}
                                                        onChange={(e) => {
                                                            const newOptions = [...activeSlide.options];
                                                            newOptions[idx].isCorrect = e.target.checked;
                                                            updateActiveSlide({ options: newOptions });
                                                        }}
                                                    />
                                                    <input
                                                        className="input-field"
                                                        style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
                                                        value={opt.text}
                                                        onChange={(e) => {
                                                            const newOptions = [...activeSlide.options];
                                                            newOptions[idx].text = e.target.value;
                                                            updateActiveSlide({ options: newOptions });
                                                        }}
                                                    />
                                                    <button onClick={() => {
                                                        const newOptions = activeSlide.options.filter((_, i) => i !== idx);
                                                        updateActiveSlide({ options: newOptions });
                                                    }} style={{ background: 'none', border: 'none', color: 'var(--noor-accent)' }}><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                            <button className="btn-secondary" style={{ padding: '8px', fontSize: '0.75rem' }} onClick={() => updateActiveSlide({ options: [...(activeSlide.options || []), { text: '', isCorrect: false }] })}>
                                                <Plus size={14} /> Ajouter une option
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeSlide.type === 'TRUE_FALSE' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Consigne</label>
                                            <input className="input-field" value={activeSlide.instruction || ''} onChange={(e) => updateActiveSlide({ instruction: e.target.value })} placeholder="Ex: Répondez par Vrai ou Faux" />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Question / Affirmation</label>
                                            <textarea className="input-field" value={activeSlide.question || ''} onChange={(e) => updateActiveSlide({ question: e.target.value })} rows={3} placeholder="Saisissez l'affirmation..." />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Réponse attendue</label>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    className={`btn-${activeSlide.correctAnswer === 'VRAI' ? 'primary' : 'secondary'}`}
                                                    style={{ flex: 1, padding: '10px' }}
                                                    onClick={() => updateActiveSlide({ correctAnswer: 'VRAI' })}
                                                >VRAI</button>
                                                <button
                                                    className={`btn-${activeSlide.correctAnswer === 'FAUX' ? 'primary' : 'secondary'}`}
                                                    style={{ flex: 1, padding: '10px' }}
                                                    onClick={() => updateActiveSlide({ correctAnswer: 'FAUX' })}
                                                >FAUX</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSlide.type === 'ORDERING' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Consigne</label>
                                            <input className="input-field" value={activeSlide.instruction || ''} onChange={(e) => updateActiveSlide({ instruction: e.target.value })} placeholder="Ex: Ordonnez les étapes" />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Question / Contexte</label>
                                            <textarea className="input-field" value={activeSlide.question || ''} onChange={(e) => updateActiveSlide({ question: e.target.value })} rows={2} placeholder="Saisissez le texte d'accompagnement..." />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Éléments (dans le bon ordre)</label>
                                            {(activeSlide.items || []).map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--noor-secondary)' }}>{idx + 1}</span>
                                                    <input
                                                        className="input-field"
                                                        style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
                                                        value={item.text}
                                                        onChange={(e) => {
                                                            const newItems = [...activeSlide.items];
                                                            newItems[idx].text = e.target.value;
                                                            updateActiveSlide({ items: newItems });
                                                        }}
                                                    />
                                                    <button onClick={() => {
                                                        const newItems = activeSlide.items.filter((_, i) => i !== idx);
                                                        updateActiveSlide({ items: newItems });
                                                    }} style={{ background: 'none', border: 'none', color: 'var(--noor-accent)' }}><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                            <button className="btn-secondary" style={{ padding: '8px', fontSize: '0.75rem' }} onClick={() => updateActiveSlide({ items: [...(activeSlide.items || []), { text: '' }] })}>
                                                <Plus size={14} /> Ajouter un élément
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeSlide.type === 'SORTING' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Consigne</label>
                                            <input className="input-field" value={activeSlide.instruction || ''} onChange={(e) => updateActiveSlide({ instruction: e.target.value })} placeholder="Ex: Triez les éléments" />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Question / Énoncé</label>
                                            <textarea className="input-field" value={activeSlide.question || ''} onChange={(e) => updateActiveSlide({ question: e.target.value })} rows={2} placeholder="Saisissez l'énoncé de l'exercice..." />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Colonnes / Catégories</label>
                                            {(activeSlide.categories || []).map((cat, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <input
                                                        className="input-field"
                                                        style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
                                                        value={cat}
                                                        onChange={(e) => {
                                                            const newCats = [...activeSlide.categories];
                                                            newCats[idx] = e.target.value;
                                                            updateActiveSlide({ categories: newCats });
                                                        }}
                                                    />
                                                    <button onClick={() => {
                                                        const newCats = activeSlide.categories.filter((_, i) => i !== idx);
                                                        updateActiveSlide({ categories: newCats });
                                                    }} style={{ background: 'none', border: 'none', color: 'var(--noor-accent)' }}><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                            <button className="btn-secondary" style={{ padding: '8px', fontSize: '0.75rem' }} onClick={() => updateActiveSlide({ categories: [...(activeSlide.categories || []), ''] })}>
                                                <Plus size={14} /> Ajouter une catégorie
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeSlide.type === 'VIDEO' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Titre de la vidéo</label>
                                            <input className="input-field" value={activeSlide.title || ''} onChange={(e) => updateActiveSlide({ title: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>URL Source (YouTube / Vimeo / MP4)</label>
                                            <input className="input-field" value={activeSlide.url || ''} onChange={(e) => updateActiveSlide({ url: e.target.value })} placeholder="https://..." />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        <div style={{ marginTop: 'auto', padding: '20px', background: 'rgba(72, 52, 212, 0.05)', borderRadius: '20px', border: '1px solid rgba(72, 52, 212, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--noor-secondary)' }}>
                                <FileCode size={16} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>MOTEUR SCORM 2.0</span>
                            </div>
                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                Votre cours est automatiquement optimisé pour une lecture fluide sur mobile et tablette.
                            </p>
                        </div>
                    </div>
                </aside>
            </div >
        </div >
    );
};

export default CourseEditor;
