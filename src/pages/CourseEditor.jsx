import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
    Plus,
    Save,
    Trash2,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    Upload,
    Layout,
    Image as ImageIcon,
    Type,
    Link as LinkIcon,
    CheckCircle2,
    AlertTriangle,
    Eye,
    Edit2,
    ListChecks,
    HelpCircle,
    ArrowDownUp,
    Layers,
    Video,
    Sliders,
    X,
    Target,
    MousePointer2,
    CheckSquare,
    GripVertical,
    Share2,
    PenTool,
    Grid,
    Activity,
    ArrowRight,
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
    ArrowRightLeft,
    Maximize2,
    Columns,
    AlignLeft,
    AlignCenter,
    AlignRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import useCourseStore from '../stores/courseStore';
import SlideRenderer, { ComponentRenderer } from '../components/SlideRenderer';
import ColorPicker from '../components/ColorPicker';
import TextStyleEditor from '../components/TextStyleEditor';
import HeaderFooterToolbar from '../components/HeaderFooterToolbar';
import AnimatedLogo from '../components/AnimatedLogo';
import { ComponentModal } from '../components/SlideRenderer';

const BLOCK_CATEGORIES = [
    {
        name: 'Contenu',
        blocks: [
            { id: 'BLANK', label: 'Bloc Vide', icon: Plus },
            { id: 'SPLASH', label: 'Titre/Intro', icon: ImageIcon },
            { id: 'PARAGRAPH', label: 'Texte Riche', icon: Type },
            { id: 'VIDEO', label: 'Vidéo', icon: Video },
            { id: 'STORY', label: 'Web/Iframe', icon: LinkIcon },
            { id: 'HOTSPOTS', label: 'Image Interactive', icon: Target },
            { id: 'TIMELINE', label: 'Frise Chrono', icon: Activity },
        ]
    },
    {
        name: 'Interactivité',
        blocks: [
            { id: 'GAP_FILL', label: 'Texte à trous', icon: Type },
            { id: 'DROPDOWN_TEXT', label: 'Menus déroulants', icon: Sliders },
            { id: 'FREE_TEXT', label: 'Saisie libre', icon: PenTool },
            { id: 'TEXT_SELECT', label: 'Identification', icon: CheckCircle2 },
        ]
    },
    {
        name: 'Manipulation',
        blocks: [
            { id: 'SOURCE_LIST', label: 'Liste Source', icon: GripVertical },
            { id: 'DROP_ZONE', label: 'Zone de Dépôt', icon: Target },
            { id: 'DRAG_DROP', label: 'Triage de blocs', icon: Layers },
            { id: 'ORDERING', label: 'Mise en ordre', icon: ArrowDownUp },
            { id: 'MATCHING_PAIRS', label: 'Paires', icon: Grid },
            { id: 'IMAGE_CLICK', label: 'Zone de clic', icon: MousePointer2 },
            { id: 'GAMEMEMO', label: 'Jeu de mémoire', icon: Grid },
        ]
    },
    {
        name: 'Évaluation',
        blocks: [
            { id: 'CHOICE', label: 'QCM Unique', icon: ListChecks },
            { id: 'CHOICE_MULTI', label: 'Choix Multiples', icon: CheckSquare },
            { id: 'TRUE_FALSE', label: 'Vrai/Faux', icon: HelpCircle },
            { id: 'CONNECTING', label: 'Liaison', icon: Share2 },
        ]
    }
];

const CourseIcon = ({ name, size = 18, color = 'var(--noor-secondary)' }) => {
    const icons = {
        Book, Calculator, Music, Globe, Palette, Microscope,
        Languages, School, Cpu, FlaskConical, History, Trophy, Gamepad2
    };
    const IconComponent = icons[name];
    if (IconComponent) return <IconComponent size={size} color={color} />;
    return <span style={{ fontSize: `${size}px` }}>{name || '📚'}</span>;
};

const CourseEditor = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const {
        course,
        activeSlideIndex,
        setActiveSlideIndex,
        activeBlockIndex,
        setActiveBlockIndex,
        activeComponentIndex,
        setActiveComponentIndex,
        addSlide,
        updateActiveSlide,
        addBlock,
        updateActiveBlock,
        addComponentToBlock,
        updateActiveComponent,
        deleteComponent,
        reorderComponents,
        deleteBlock,
        deleteSlide,
        setCourse,
        updateCourseMetadata,
        isPreviewMode,
        saveCourse,
        isSaving,
        uploadAsset,
        levels,
        subjects,
        fetchCategories,
        setBlockElements,
        moveComponentBetweenBlocks,
        activeGlobalElement,
        setEditingGlobalElement
    } = useCourseStore();

    const [isImporting, setIsImporting] = useState(false);

    // Load categories on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    // Safety check for active slides/elements (Anti-Crash)
    useEffect(() => {
        if (course && course.slides) {
            // Case 1: Neither slide nor global element is active
            if (activeSlideIndex === null && !activeGlobalElement && course.slides.length > 0) {
                setActiveSlideIndex(0);
            }
            // Case 2: Selected slide index is out of bounds
            if (activeSlideIndex !== null && course.slides.length > 0 && !course.slides[activeSlideIndex]) {
                setActiveSlideIndex(Math.max(0, course.slides.length - 1));
            }
        }
    }, [course?.slides?.length, activeSlideIndex, activeGlobalElement]);

    // Force course integrity on mount (ensure header/footer/slides exist for rehydrated states)
    useEffect(() => {
        if (course) {
            const hasHeader = !!course.header;
            const hasFooter = !!course.footer;
            const hasSlides = course.slides && course.slides.length > 0;

            if (!hasHeader || !hasFooter || !hasSlides) {
                // setCourse now includes verifyCourseIntegrity logic
                setCourse(course);
            }
        }
    }, [course]);

    useEffect(() => {
        // --- Sécurité d'index (Anti-Black Screen) ---
        if (course?.slides && activeSlideIndex >= course.slides.length) {
            setActiveSlideIndex(Math.max(0, course.slides.length - 1));
        }

    }, [course?.header?.blocks?.[0]?.elements, course?.slides?.length, activeSlideIndex]);

    const [showCourseSettings, setShowCourseSettings] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);
    const [showMoveMenu, setShowMoveMenu] = useState(null); // Format: { blockIndex, componentIndex }
    const [globalCompModal, setGlobalCompModal] = useState({ isOpen: false, type: null, cellId: null });
    const [activeCellId, setActiveCellId] = useState(null);

    // Close move menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            if (showMoveMenu) setShowMoveMenu(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showMoveMenu]);

    const handleSave = async () => {
        const toastId = toast.loading('Sauvegarde en cours...');
        const success = await saveCourse();
        if (success) {
            useCourseStore.setState({ lastSaved: new Date().toLocaleTimeString() });
            toast.success('Cours sauvegardé sur Supabase !', { id: toastId });
        } else {
            const { lastError } = useCourseStore.getState();
            toast.error(`Erreur: ${lastError || 'Sauvegarde échouée'}`, { id: toastId });
        }
    };


    const handleImportSCORM = async (file) => {
        setIsImporting(true);
        const toastId = toast.loading('Analyse du package SCORM...');

        try {
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(file);

            // 1. Trouver le manifest
            const manifestFile = zipContent.file("imsmanifest.xml");
            if (!manifestFile) throw new Error("Fichier imsmanifest.xml non trouvé à la racine du ZIP");

            const manifestText = await manifestFile.async("text");
            const parser = new DOMParser();
            const manifestXml = parser.parseFromString(manifestText, "text/xml");

            // 2. Extraire les ressources et l'organisation
            const items = Array.from(manifestXml.querySelectorAll('item[identifierref]'));
            const resources = Array.from(manifestXml.querySelectorAll('resource'));

            const importedSlides = [];

            for (const [index, item] of items.entries()) {
                const ref = item.getAttribute('identifierref');
                const title = item.querySelector('title')?.textContent || `Diapositive ${index + 1}`;
                const resource = resources.find(r => r.getAttribute('identifier') === ref);
                const href = resource?.getAttribute('href');

                if (href) {
                    toast.loading(`Importation : ${title}`, { id: toastId });

                    // Trouver le fichier de la page (peut être dans pages/ ou ailleurs)
                    let pageFile = zipContent.file(href);

                    // Si pas trouvé, essayer de chercher le fichier sans le chemin complet
                    if (!pageFile) {
                        const fileName = href.split('/').pop();
                        const foundFiles = Object.keys(zipContent.files).filter(path => path.endsWith(fileName));
                        if (foundFiles.length > 0) pageFile = zipContent.file(foundFiles[0]);
                    }

                    const blocks = [];

                    if (pageFile) {
                        let pageText = await pageFile.async("text");

                        // Si le fichier trouvé ne contient pas de modules (ex: index.html), 
                        // on essaie de chercher un fichier XML correspondant dans pages/
                        if (!pageText.includes('<module') && !pageText.includes('<addon')) {
                            const fileName = href.split('/').pop().replace(/\.[^/.]+$/, "");
                            const potentialFiles = Object.keys(zipContent.files).filter(path =>
                                path.toLowerCase().includes(`pages/${fileName.toLowerCase()}.xml`) ||
                                (path.toLowerCase().startsWith('pages/') && path.toLowerCase().endsWith(`${fileName.toLowerCase()}.xml`))
                            );

                            if (potentialFiles.length > 0) {
                                pageFile = zipContent.file(potentialFiles[0]);
                                pageText = await pageFile.async("text");
                            }
                        }

                        const pageXml = parser.parseFromString(pageText, "text/xml");

                        // Extraire les modules (format mAuthor : <module> ou <addon>)
                        const modules = Array.from(pageXml.querySelectorAll('module, addon'));

                        for (const mod of modules) {
                            const type = mod.getAttribute('type')?.toLowerCase() || 'unknown';
                            const modId = mod.getAttribute('id') || type;

                            // Extraction du contenu texte multi-format mAuthor
                            const textTag = mod.querySelector('text, content, value, property[name="Text"]');
                            const propertyTags = Array.from(mod.querySelectorAll('property'));
                            const propText = propertyTags.find(p => p.getAttribute('name').toLowerCase() === 'text');
                            const propImage = propertyTags.find(p => p.getAttribute('name').toLowerCase() === 'image');

                            let contentText = textTag ? (textTag.getAttribute('value') || textTag.textContent) : (propText ? propText.getAttribute('value') : mod.textContent);
                            let imagePath = propImage ? propImage.getAttribute('value') : null;

                            if (contentText && contentText.length > 0) {
                                contentText = contentText
                                    .replace(/&nbsp;/g, ' ')
                                    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
                                    .replace(/<br\s*\/?>/gi, '\n')
                                    .replace(/<\/p>/gi, '\n')
                                    .replace(/<[^>]*>?/gm, '')
                                    .trim();
                            }

                            // Ignorer les modules sans contenu utile (sauf images/liens)
                            if (!contentText && !imagePath && !type.includes('choice')) continue;

                            if ((type.includes('text') || type.includes('heading') || type.includes('header')) && contentText) {
                                blocks.push({
                                    id: 'import-blk-' + Math.random().toString(36).substr(2, 9),
                                    type: (type.includes('heading') || type.includes('header')) ? 'SPLASH' : 'PARAGRAPH',
                                    title: modId,
                                    content: contentText,
                                    description: type.includes('heading') ? contentText : '',
                                    style: { columns: 12, margin: 16, padding: 24, background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }
                                });
                            } else if (type.includes('image')) {
                                let imageUrl = '';
                                if (imagePath) {
                                    const cleanPath = imagePath.replace(/^(\.\/|\.\.\/|\/)+/, '');
                                    let imgFile = zipContent.file(cleanPath);
                                    if (!imgFile) {
                                        const fileName = cleanPath.split('/').pop();
                                        const foundFiles = Object.keys(zipContent.files).filter(path => path.endsWith(fileName));
                                        if (foundFiles.length > 0) imgFile = zipContent.file(foundFiles[0]);
                                    }

                                    if (imgFile) {
                                        const blob = await imgFile.async("blob");
                                        const fileObj = new File([blob], cleanPath.split('/').pop(), { type: "image/png" });
                                        imageUrl = await uploadAsset(fileObj);
                                    }
                                }

                                blocks.push({
                                    id: 'import-blk-' + Math.random().toString(36).substr(2, 9),
                                    type: 'SPLASH',
                                    title: modId,
                                    image: imageUrl,
                                    description: contentText || '',
                                    style: { columns: imageUrl ? 6 : 12, margin: 16, background: 'rgba(255,255,255,0.02)' }
                                });
                            } else if (type.includes('choice') || type.includes('selection')) {
                                blocks.push({
                                    id: 'import-blk-' + Math.random().toString(36).substr(2, 9),
                                    type: 'CHOICE',
                                    title: modId,
                                    instruction: contentText || 'Choisissez la bonne réponse',
                                    options: [
                                        { text: 'Option importée 1', isCorrect: true },
                                        { text: 'Option importée 2', isCorrect: false }
                                    ],
                                    style: { columns: 12, margin: 16, padding: 20, showBorder: true, borderColor: 'var(--noor-secondary)' }
                                });
                            }
                        }
                    }

                    if (blocks.length === 0) {
                        blocks.push({
                            id: 'import-empty-' + index,
                            type: 'PARAGRAPH',
                            title: 'Page Importée',
                            content: `Contenu brut détecté pour "${title}".\n\n(Certaines activités mAuthor complexes ne sont pas encore totalement supportées).`,
                            style: { columns: 12, margin: 16 }
                        });
                    }

                    importedSlides.push({
                        id: 'import-slide-' + index + '-' + Date.now(),
                        title: title,
                        blocks: blocks
                    });
                }
            }

            if (importedSlides.length > 0) {
                setCourse({
                    ...course,
                    slides: importedSlides
                });
                setActiveSlideIndex(0);
                toast.success(`${importedSlides.length} diapositives importées avec succès !`, { id: toastId });
            } else {
                throw new Error("Aucune ressource de type 'page' détectée dans le manifest.");
            }

        } catch (error) {
            console.error("Erreur Import SCORM détaillée:", error);
            toast.error(`Échec de l'import : ${error.message}`, { id: toastId });
        } finally {
            setIsImporting(false);
        }
    };

    // --- Sécurisation des données (Anti-Crash Écran Noir) ---
    const activeSlide = activeGlobalElement
        ? course[activeGlobalElement]
        : (course?.slides && course.slides[activeSlideIndex]) ? course.slides[activeSlideIndex] : null;

    const activeBlock = (activeSlide?.blocks && activeSlide.blocks[activeBlockIndex]) ? activeSlide.blocks[activeBlockIndex] : null;
    const activeComponent = (activeBlock?.elements && activeBlock.elements[activeComponentIndex] !== undefined) ? activeBlock.elements[activeComponentIndex] : null;

    if (!course || !course.slides) {
        return (
            <div className="editor-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0c1a' }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <div className="spinner" style={{ marginBottom: '20px', margin: '0 auto' }}></div>
                    <p style={{ marginTop: '20px', fontWeight: 700 }}>Chargement du studio...</p>
                </div>
            </div>
        );
    }

    if (!activeSlide) {
        return (
            <div className="editor-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0c1a' }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <AlertTriangle size={48} color="var(--noor-secondary)" style={{ marginBottom: '20px' }} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Oups, cette page n'existe pas</h2>
                    <p style={{ opacity: 0.6, marginBottom: '24px' }}>La structure du cours semble avoir changé.</p>
                    <button className="btn-primary" onClick={() => setActiveSlideIndex(0)}>Retour à la première page</button>
                </div>
            </div>
        );
    }

    // Helper for inspector updates
    const getInspectorTarget = () => {
        if (activeComponent) return activeComponent;

        if (activeGlobalElement && activeCellId) {
            const layout = activeGlobalElement === 'header' ? course.playerConfig.headerLayout : course.playerConfig.footerLayout;
            return layout.cells.find(c => c.id === activeCellId) || activeBlock || activeSlide;
        }

        return activeBlock || activeSlide;
    };

    const getInspectorUpdateFn = () => {
        if (activeComponent) return updateActiveComponent;

        if (activeGlobalElement && activeCellId) {
            return (fields) => {
                const configKey = activeGlobalElement === 'header' ? 'headerLayout' : 'footerLayout';
                const layout = course.playerConfig[configKey];
                updateCourseMetadata({
                    playerConfig: {
                        ...course.playerConfig,
                        [configKey]: {
                            ...layout,
                            cells: layout.cells.map(c => c.id === activeCellId ? { ...c, ...fields } : c)
                        }
                    }
                });
            };
        }

        return activeBlock ? updateActiveBlock : updateActiveSlide;
    };

    return (
        <div className="editor-container">
            <div className="aurora"></div>

            {/* HEADER */}
            <header style={{
                padding: '0 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(10, 12, 26, 0.8)',
                backdropFilter: 'blur(30px)',
                borderBottom: '1px solid var(--border-color)',
                zIndex: 1000,
                height: '70px',
                position: 'relative'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={() => navigate('/dashboard')} className="btn-icon-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CourseIcon name={course.icon} size={16} />
                            <input
                                type="text"
                                value={course.title}
                                onChange={(e) => updateCourseMetadata({ title: e.target.value })}
                                className="input-field"
                                style={{ fontSize: '1rem', fontWeight: 800, border: 'none', background: 'transparent', padding: 0, width: '200px', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.6rem', color: 'var(--noor-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>{course.level}</span>
                            <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{course.subject}</span>
                        </div>
                    </div>
                </div>

                {/* CENTRAL RIBBON */}
                {!isPreviewMode && (
                    <div style={{
                        display: 'flex',
                        gap: '6px',
                        background: 'rgba(18, 21, 45, 0.6)',
                        padding: '6px',
                        borderRadius: '18px',
                        border: '1px solid var(--glass-border)',
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        {BLOCK_CATEGORIES.map(category => (
                            <div key={category.name} style={{ position: 'relative' }} onMouseEnter={() => setActiveCategory(category.name)} onMouseLeave={() => setActiveCategory(null)}>
                                <button style={{
                                    padding: '10px 18px',
                                    borderRadius: '14px',
                                    border: 'none',
                                    background: activeCategory === category.name ? 'rgba(123, 97, 255, 0.25)' : 'transparent',
                                    color: activeCategory === category.name ? 'white' : 'var(--text-secondary)',
                                    fontSize: '0.85rem',
                                    fontWeight: 800,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {category.name}
                                    <ChevronDown size={14} style={{ opacity: 0.6, transform: activeCategory === category.name ? 'rotate(180deg)' : 'none' }} />
                                </button>
                                <AnimatePresence>
                                    {activeCategory === category.name && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            style={{
                                                position: 'absolute',
                                                top: 'calc(100% + 8px)',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                background: '#1a1d3a',
                                                border: '2px solid var(--noor-secondary)',
                                                borderRadius: '24px',
                                                padding: '12px',
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(2, 180px)',
                                                gap: '8px',
                                                zIndex: 1100,
                                                boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
                                            }}
                                        >
                                            {category.blocks.map(type => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => { type.id === 'BLANK' ? addBlock(null) : addBlock(type.id); setActiveCategory(null); }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        padding: '12px 14px',
                                                        borderRadius: '16px',
                                                        border: 'none',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        color: 'white',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(123, 97, 255, 0.2)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                                >
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '12px',
                                                        background: 'var(--noor-secondary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        boxShadow: '0 4px 10px rgba(123, 97, 255, 0.4)'
                                                    }}>
                                                        <type.icon size={20} dark={false} />
                                                    </div>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{type.label}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button className="btn-icon-sm" onClick={() => setShowCourseSettings(true)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}><Sliders size={18} /></button>
                    <button
                        className="btn-secondary"
                        onClick={async () => {
                            const toastId = toast.loading('Sauvegarde du cours avant prévisualisation...');
                            const success = await saveCourse();
                            if (success) {
                                toast.success('Prêt pour la prévisualisation !', { id: toastId });
                                const { course: updatedCourse } = useCourseStore.getState();
                                if (updatedCourse.id) {
                                    window.open(`/preview/${updatedCourse.id}/${activeSlideIndex}`, '_blank');
                                }
                            } else {
                                const { lastError } = useCourseStore.getState();
                                toast.error(`Erreur: ${lastError || 'Sauvegarde échouée'}`, { id: toastId });
                            }
                        }}
                        style={{ height: '38px', padding: '0 16px', borderRadius: '12px' }}
                    >
                        <Eye size={16} />
                        <span style={{ fontSize: '0.8rem' }}>Aperçu</span>
                    </button>
                    <button className="btn-primary" onClick={handleSave} disabled={isSaving} style={{ height: '38px', padding: '0 18px', borderRadius: '12px' }}>
                        {isSaving ? <Save size={16} className="animate-spin" /> : <Save size={16} />}
                        <span style={{ fontSize: '0.8rem' }}>Enregistrer</span>
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* LEFT SIDEBAR - EXPLORER */}
                <aside style={{ width: '300px', background: 'rgba(18, 21, 45, 0.4)', backdropFilter: 'blur(30px)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
                    <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>EXPLORATEUR</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="btn-icon-sm"
                                onClick={() => fileInputRef.current?.click()}
                                title="Importer SCORM"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}
                                disabled={isImporting}
                            >
                                {isImporting ? <Activity size={16} className="animate-spin" /> : <Upload size={16} />}
                            </button>
                            <button className="btn-icon-sm" onClick={() => addSlide()} style={{ background: 'var(--noor-secondary)', color: 'white' }}><Plus size={16} /></button>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".zip"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) handleImportSCORM(file);
                            }}
                        />
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                        {/* HEADER SECTION */}
                        <div style={{ marginBottom: '16px' }}>
                            <div
                                onClick={() => { setEditingGlobalElement('header'); setActiveCellId(null); setActiveComponentIndex(null); }}
                                className={`sidebar-item ${activeGlobalElement === 'header' && activeCellId === null && activeComponentIndex === null ? 'active' : ''}`}
                                style={{ padding: '10px 12px', borderRadius: '12px', background: activeGlobalElement === 'header' && activeCellId === null && activeComponentIndex === null ? 'rgba(123, 97, 255, 0.15)' : 'transparent', border: activeGlobalElement === 'header' && activeCellId === null && activeComponentIndex === null ? '1px solid rgba(123, 97, 255, 0.3)' : '1px solid transparent' }}
                            >
                                <ChevronUp size={16} style={{ color: 'var(--noor-secondary)' }} />
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, flex: 1 }}>EN-TÊTE (GLOBAL)</span>
                            </div>
                            <style>{`
                                .sidebar-item:hover { background: rgba(255,255,255,0.05) !important; }
                                .sidebar-item.active { background: rgba(123, 97, 255, 0.15) !important; border-color: rgba(123, 97, 255, 0.3) !important; }
                            `}</style>
                            {activeGlobalElement === 'header' && (course.playerConfig?.headerLayout?.cells || []).map((cell, cIdx) => {
                                const elements = (course.header.blocks[0]?.elements || []).filter(el => el.cellId === cell.id);
                                return (
                                    <div key={cell.id} className="sidebar-cell-container" style={{ marginLeft: '16px', marginTop: '4px' }}>
                                        <div
                                            onClick={() => { setActiveCellId(cell.id); setActiveBlockIndex(0); setActiveComponentIndex(null); }}
                                            className={`sidebar-item ${activeCellId === cell.id && activeComponentIndex === null ? 'active' : ''}`}
                                            style={{ padding: '6px 10px', borderRadius: '10px', background: activeCellId === cell.id && activeComponentIndex === null ? 'rgba(123, 97, 255, 0.1)' : 'transparent', fontSize: '0.75rem' }}
                                        >
                                            <Columns size={13} style={{ opacity: 0.6, marginRight: '8px' }} />
                                            <span style={{ fontWeight: 600, flex: 1 }}>Col {cIdx + 1} (Span {cell.span})</span>
                                        </div>
                                        {elements.map((comp, eIdx) => {
                                            const globalId = comp.id || `comp-header-${eIdx}`;
                                            const globalIdx = (course.header.blocks[0]?.elements || []).indexOf(comp);
                                            return (
                                                <div
                                                    key={globalId}
                                                    onClick={() => { setActiveCellId(cell.id); setActiveBlockIndex(0); setActiveComponentIndex(globalIdx); }}
                                                    className={`sidebar-item ${activeComponentIndex === globalIdx && activeGlobalElement === 'header' ? 'active' : ''}`}
                                                    style={{ marginLeft: '20px', marginTop: '2px', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem' }}
                                                >
                                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', marginRight: '8px' }} />
                                                    <span style={{ fontWeight: 500, flex: 1 }}>{comp.type}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); if (window.confirm('Supprimer ?')) deleteComponent(0, globalIdx); }}
                                                        style={{ background: 'transparent', border: 'none', color: 'var(--noor-accent)', opacity: 0.6, cursor: 'pointer', display: 'flex' }}
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ height: '1px', background: 'var(--glass-border)', margin: '8px 0 16px 0' }} />

                        {/* SLIDES SECTION */}
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', padding: '0 12px' }}>PAGES DU COURS</div>
                        {(course?.slides || []).map((slide, sIdx) => (
                            <div key={slide.id || sIdx} style={{ marginBottom: '8px' }}>
                                <div onClick={() => { setActiveSlideIndex(sIdx); setActiveBlockIndex(null); setActiveComponentIndex(null); }} className={`sidebar-item ${sIdx === activeSlideIndex && activeBlockIndex === null ? 'active' : ''}`} style={{ padding: '10px 12px', borderRadius: '12px', background: sIdx === activeSlideIndex ? 'rgba(123, 97, 255, 0.1)' : 'transparent' }}>
                                    <Layout size={16} style={{ color: 'var(--noor-secondary)' }} />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, flex: 1 }}>{slide.title || `Diapo ${sIdx + 1}`}</span>
                                    {sIdx === activeSlideIndex && <button onClick={(e) => { e.stopPropagation(); deleteSlide(sIdx); }} className="btn-icon-sm" style={{ background: 'transparent' }}><Trash2 size={12} style={{ color: 'var(--noor-accent)' }} /></button>}
                                </div>
                                {sIdx === activeSlideIndex && (slide.blocks || []).map((block, bIdx) => {
                                    const blockKey = block.id || `block-${sIdx}-${bIdx}`;
                                    return (
                                        <div
                                            key={blockKey}
                                            className="sidebar-block-container"
                                            data-block-index={bIdx}
                                            style={{ marginLeft: '16px', marginTop: '4px' }}
                                        >
                                            <div
                                                onClick={() => { setActiveBlockIndex(bIdx); setActiveComponentIndex(null); }}
                                                className={`sidebar-item ${bIdx === activeBlockIndex && activeComponentIndex === null ? 'active' : ''}`}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '10px',
                                                    background: bIdx === activeBlockIndex ? 'rgba(255,255,255,0.05)' : 'transparent',
                                                    fontSize: '0.75rem',
                                                    border: '1px solid transparent',
                                                    borderColor: bIdx === activeBlockIndex ? 'rgba(123, 97, 255, 0.2)' : 'transparent'
                                                }}
                                            >
                                                <Grid size={13} style={{ opacity: 0.6 }} />
                                                <span style={{ fontWeight: 600 }}>{block.title || `Bloc ${bIdx + 1}`}</span>
                                                <button onClick={(e) => { e.stopPropagation(); deleteBlock(bIdx); }} className="btn-icon-sm" style={{ background: 'transparent' }}><X size={10} /></button>
                                            </div>

                                            <Reorder.Group
                                                as="div"
                                                axis="y"
                                                values={block.elements || []}
                                                onReorder={(newElements) => {
                                                    // Only update if we're not in the middle of a cross-block drag
                                                    if (!window._isCrossBlockDrag && (window._dragSourceBlockIndex === undefined || window._dragSourceBlockIndex === bIdx)) {
                                                        setBlockElements(bIdx, newElements);
                                                    }
                                                }}
                                                style={{
                                                    padding: 0,
                                                    margin: '4px 0 12px 0',
                                                    minHeight: '10px'
                                                }}
                                            >
                                                {(block.elements || []).map((comp, cIdx) => (
                                                    <Reorder.Item
                                                        as="div"
                                                        key={comp.id || `${bIdx}-${cIdx}-${comp.type}`}
                                                        value={comp}
                                                        onDragStart={() => {
                                                            // Store the source block index when drag starts
                                                            window._dragSourceBlockIndex = bIdx;
                                                            window._dragSourceComponentIndex = cIdx;
                                                            window._isCrossBlockDrag = false;
                                                        }}
                                                        onDragEnd={(event, info) => {
                                                            const elementsUnderPointer = document.elementsFromPoint(info.point.x, info.point.y);

                                                            // Find the target block container
                                                            let targetContainer = null;
                                                            for (const el of elementsUnderPointer) {
                                                                const container = el.closest('.sidebar-block-container');
                                                                if (container) {
                                                                    targetContainer = container;
                                                                    break;
                                                                }
                                                            }

                                                            if (targetContainer) {
                                                                const targetIndex = parseInt(targetContainer.getAttribute('data-block-index'));
                                                                if (!isNaN(targetIndex) && targetIndex !== bIdx) {
                                                                    // Moving to a different block
                                                                    window._isCrossBlockDrag = true;
                                                                    moveComponentBetweenBlocks(bIdx, cIdx, targetIndex);
                                                                }
                                                            }

                                                            // Clean up after a short delay to let onReorder finish
                                                            setTimeout(() => {
                                                                delete window._dragSourceBlockIndex;
                                                                delete window._dragSourceComponentIndex;
                                                                delete window._isCrossBlockDrag;
                                                            }, 100);
                                                        }}
                                                    >
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveBlockIndex(bIdx);
                                                                setActiveComponentIndex(cIdx);
                                                            }}
                                                            className={`sidebar-item ${(bIdx === activeBlockIndex && cIdx === activeComponentIndex) ? 'active' : ''}`}
                                                            style={{
                                                                marginLeft: '20px',
                                                                marginTop: '2px',
                                                                padding: '4px 8px',
                                                                borderRadius: '6px',
                                                                fontSize: '0.7rem',
                                                                color: (bIdx === activeBlockIndex && cIdx === activeComponentIndex) ? 'var(--noor-secondary)' : 'var(--text-muted)',
                                                                cursor: 'grab',
                                                                background: (bIdx === activeBlockIndex && cIdx === activeComponentIndex) ? 'rgba(123, 97, 255, 0.1)' : 'transparent'
                                                            }}
                                                        >
                                                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }} />
                                                            <span style={{ fontWeight: 500, flex: 1 }}>{comp.type}</span>
                                                            {bIdx === activeBlockIndex && cIdx === activeComponentIndex && (
                                                                <div style={{ display: 'flex', gap: '4px', position: 'relative' }}>
                                                                    {/* Move button */}
                                                                    {(course.slides[activeSlideIndex]?.blocks || []).length > 1 && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setShowMoveMenu(showMoveMenu?.blockIndex === bIdx && showMoveMenu?.componentIndex === cIdx ? null : { blockIndex: bIdx, componentIndex: cIdx });
                                                                            }}
                                                                            className="btn-icon-sm"
                                                                            style={{ background: 'transparent', width: '20px', height: '20px', position: 'relative' }}
                                                                            title="Déplacer vers un autre bloc"
                                                                        >
                                                                            <ArrowRightLeft size={10} style={{ color: 'var(--noor-secondary)' }} />
                                                                        </button>
                                                                    )}

                                                                    {/* Delete button */}
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); deleteComponent(bIdx, cIdx); }}
                                                                        className="btn-icon-sm"
                                                                        style={{ background: 'transparent', width: '20px', height: '20px' }}
                                                                    >
                                                                        <Trash2 size={10} style={{ color: 'var(--noor-accent)' }} />
                                                                    </button>

                                                                    {/* Move menu dropdown */}
                                                                    {showMoveMenu?.blockIndex === bIdx && showMoveMenu?.componentIndex === cIdx && (
                                                                        <div
                                                                            style={{
                                                                                position: 'absolute',
                                                                                top: '100%',
                                                                                right: 0,
                                                                                marginTop: '4px',
                                                                                background: 'var(--bg-secondary)',
                                                                                border: '1px solid var(--glass-border)',
                                                                                borderRadius: '8px',
                                                                                padding: '4px',
                                                                                zIndex: 1000,
                                                                                minWidth: '150px',
                                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                                                            }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', padding: '4px 8px', fontWeight: 700 }}>
                                                                                Déplacer vers:
                                                                            </div>
                                                                            {(course.slides[activeSlideIndex]?.blocks || []).map((targetBlock, targetIdx) => {
                                                                                if (targetIdx === bIdx) return null;
                                                                                return (
                                                                                    <button
                                                                                        key={targetIdx}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            moveComponentBetweenBlocks(bIdx, cIdx, targetIdx);
                                                                                            setShowMoveMenu(null);
                                                                                            toast.success('Composant déplacé !');
                                                                                        }}
                                                                                        style={{
                                                                                            width: '100%',
                                                                                            padding: '6px 8px',
                                                                                            background: 'transparent',
                                                                                            border: 'none',
                                                                                            borderRadius: '6px',
                                                                                            color: 'white',
                                                                                            fontSize: '0.7rem',
                                                                                            cursor: 'pointer',
                                                                                            textAlign: 'left',
                                                                                            display: 'flex',
                                                                                            alignItems: 'center',
                                                                                            gap: '6px'
                                                                                        }}
                                                                                        onMouseEnter={(e) => e.target.style.background = 'rgba(123, 97, 255, 0.1)'}
                                                                                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                                                    >
                                                                                        <Grid size={10} style={{ opacity: 0.6 }} />
                                                                                        {targetBlock.title || `Bloc ${targetIdx + 1}`}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Reorder.Item>
                                                ))}
                                            </Reorder.Group>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}

                        <div style={{ height: '1px', background: 'var(--glass-border)', margin: '16px 0' }} />

                        {/* FOOTER SECTION */}
                        <div style={{ marginBottom: '16px' }}>
                            <div
                                onClick={() => { setEditingGlobalElement('footer'); setActiveCellId(null); setActiveComponentIndex(null); }}
                                className={`sidebar-item ${activeGlobalElement === 'footer' && activeCellId === null && activeComponentIndex === null ? 'active' : ''}`}
                                style={{ padding: '10px 12px', borderRadius: '12px', background: activeGlobalElement === 'footer' && activeCellId === null && activeComponentIndex === null ? 'rgba(123, 97, 255, 0.15)' : 'transparent', border: activeGlobalElement === 'footer' && activeCellId === null && activeComponentIndex === null ? '1px solid rgba(123, 97, 255, 0.3)' : '1px solid transparent' }}
                            >
                                <ChevronDown size={16} style={{ color: 'var(--noor-secondary)' }} />
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, flex: 1 }}>PIED DE PAGE (GLOBAL)</span>
                            </div>
                            {activeGlobalElement === 'footer' && (course.playerConfig?.footerLayout?.cells || []).map((cell, cIdx) => {
                                const elements = (course.footer.blocks[0]?.elements || []).filter(el => el.cellId === cell.id);
                                return (
                                    <div key={cell.id} className="sidebar-cell-container" style={{ marginLeft: '16px', marginTop: '4px' }}>
                                        <div
                                            onClick={() => { setActiveCellId(cell.id); setActiveBlockIndex(0); setActiveComponentIndex(null); }}
                                            className={`sidebar-item ${activeCellId === cell.id && activeComponentIndex === null ? 'active' : ''}`}
                                            style={{ padding: '6px 10px', borderRadius: '10px', background: activeCellId === cell.id && activeComponentIndex === null ? 'rgba(123, 97, 255, 0.1)' : 'transparent', fontSize: '0.75rem' }}
                                        >
                                            <Columns size={13} style={{ opacity: 0.6, marginRight: '8px' }} />
                                            <span style={{ fontWeight: 600, flex: 1 }}>Col {cIdx + 1} (Span {cell.span})</span>
                                        </div>
                                        {elements.map((comp) => {
                                            const globalIdx = (course.footer.blocks[0]?.elements || []).indexOf(comp);
                                            return (
                                                <div
                                                    key={comp.id}
                                                    onClick={() => { setActiveCellId(cell.id); setActiveBlockIndex(0); setActiveComponentIndex(globalIdx); }}
                                                    className={`sidebar-item ${activeComponentIndex === globalIdx && activeGlobalElement === 'footer' ? 'active' : ''}`}
                                                    style={{ marginLeft: '20px', marginTop: '2px', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem' }}
                                                >
                                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', marginRight: '8px' }} />
                                                    <span style={{ fontWeight: 500, flex: 1 }}>{comp.type}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); if (window.confirm('Supprimer ?')) deleteComponent(0, globalIdx); }}
                                                        style={{ background: 'transparent', border: 'none', color: 'var(--noor-accent)', opacity: 0.6, cursor: 'pointer', display: 'flex' }}
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* MAIN CANVAS */}
                <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', zIndex: 1 }}>
                    <div style={{ width: '100%', maxWidth: '900px', position: 'relative' }}>
                        <AnimatePresence mode="wait">
                            <motion.div key={activeSlideIndex + (isPreviewMode ? '-p' : '-e')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{
                                width: '100%',
                                maxWidth: course.aspectRatio === '9/16' ? '450px' : '900px',
                                margin: '0 auto',
                                aspectRatio: course.aspectRatio || '16/9',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '32px',
                                border: '1px solid var(--glass-border)',
                                boxShadow: 'var(--shadow-lg)',
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {(() => {
                                    const hLayout = course.playerConfig?.headerLayout || {};
                                    return (
                                        <div style={{
                                            height: `${hLayout.height || 60}px`,
                                            padding: hLayout.isCard ? '8px 16px' : '0',
                                            zIndex: 10,
                                            opacity: activeGlobalElement === 'footer' ? 0.3 : 1,
                                            position: 'relative'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                background: hLayout.background || 'rgba(18, 21, 45, 0.98)',
                                                borderRadius: hLayout.isCard ? `${hLayout.borderRadius || 12}px` : '0',
                                                border: `${hLayout.borderWidth || 1}px solid ${hLayout.borderColor || 'var(--glass-border)'}`,
                                                boxShadow: hLayout.isCard ? '0 8px 30px rgba(0,0,0,0.3)' : 'none',
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(12, 1fr)',
                                                gap: `${hLayout.gap ?? 4}px`,
                                                padding: `0 ${hLayout.padding || 10}px`,
                                                direction: hLayout.isRTL ? 'rtl' : 'ltr',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}>
                                                {/* GHOST GRID */}
                                                {activeGlobalElement === 'header' && (
                                                    <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px', padding: `0 ${hLayout.padding || 10}px`, pointerEvents: 'none' }}>
                                                        {Array.from({ length: 12 }).map((_, i) => (
                                                            <div key={i} style={{ background: 'rgba(123, 97, 255, 0.05)', borderLeft: '1px dashed rgba(123, 97, 255, 0.1)', borderRight: '1px dashed rgba(123, 97, 255, 0.1)' }} />
                                                        ))}
                                                    </div>
                                                )}

                                                {(course.playerConfig?.headerLayout?.cells || [
                                                    { id: 'h-cell-1', span: 3, alignment: 'left' },
                                                    { id: 'h-cell-2', span: 6, alignment: 'center' },
                                                    { id: 'h-cell-3', span: 3, alignment: 'right' }
                                                ]).map(cell => {
                                                    const cellElements = (course.header?.blocks?.flatMap(b => b.elements) || [])
                                                        .filter(el => el.cellId === cell.id);

                                                    return (
                                                        <div
                                                            key={cell.id}
                                                            onClick={() => setEditingGlobalElement('header')}
                                                            style={{
                                                                gridColumn: `span ${cell.span}`,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: cell.alignment === 'center' ? 'center' : cell.alignment === 'right' ? 'flex-end' : 'flex-start',
                                                                height: '100%',
                                                                border: activeGlobalElement === 'header' ? '1px dashed var(--noor-secondary)' : 'none',
                                                                background: activeGlobalElement === 'header' ? 'rgba(123, 97, 255, 0.03)' : 'transparent',
                                                                cursor: 'pointer',
                                                                padding: '0 10px',
                                                                position: 'relative',
                                                                zIndex: 2,
                                                                transition: 'all 0.2s',
                                                                minWidth: 0,
                                                                overflow: 'hidden',
                                                                containerType: 'inline-size'
                                                            }}
                                                            onMouseEnter={e => { if (activeGlobalElement === 'header') e.currentTarget.style.background = 'rgba(123, 97, 255, 0.08)'; }}
                                                            onMouseLeave={e => { if (activeGlobalElement === 'header') e.currentTarget.style.background = 'rgba(123, 97, 255, 0.03)'; }}
                                                        >
                                                            {cellElements.map(element => (
                                                                <div
                                                                    key={element.id}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        position: 'relative',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: cell.alignment === 'center' ? 'center' : cell.alignment === 'right' ? 'flex-end' : 'flex-start',
                                                                        // overflow: 'hidden' // Removed to fix shadow cropping
                                                                    }}
                                                                    className="global-comp-preview-item"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingGlobalElement('header');
                                                                        setActiveCellId(cell.id);
                                                                        setActiveBlockIndex(0);
                                                                        setActiveComponentIndex(course.header.blocks[0].elements.findIndex(el => el.id === element.id));
                                                                    }}
                                                                >
                                                                    <ComponentRenderer
                                                                        component={element}
                                                                        isPreview={true}
                                                                    />

                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (window.confirm('Supprimer ce composant ?')) deleteComponent(0, course.header.blocks[0].elements.findIndex(el => el.id === element.id));
                                                                        }}
                                                                        className="delete-hover-btn"
                                                                        style={{
                                                                            position: 'absolute',
                                                                            top: '-10px',
                                                                            right: '-10px',
                                                                            width: '18px',
                                                                            height: '18px',
                                                                            borderRadius: '50%',
                                                                            background: '#ff4757',
                                                                            border: 'none',
                                                                            color: 'white',
                                                                            display: 'none',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            cursor: 'pointer',
                                                                            zIndex: 10
                                                                        }}
                                                                    >
                                                                        <Trash2 size={10} />
                                                                    </button>
                                                                </div>
                                                            ))}

                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div style={{ flex: 1, position: 'relative', overflow: 'auto', padding: activeGlobalElement ? '20px' : '48px', opacity: activeGlobalElement ? 0.3 : 1 }}>
                                    {!activeGlobalElement && <SlideRenderer slide={activeSlide} isPreview={isPreviewMode} />}
                                </div>

                                {/* MINI FOOTER PREVIEW */}
                                {(() => {
                                    const fLayout = course.playerConfig?.footerLayout || {};
                                    return (
                                        <div style={{
                                            height: `${fLayout.height || 60}px`,
                                            padding: fLayout.isCard ? '8px 16px' : '0',
                                            zIndex: 10,
                                            opacity: activeGlobalElement === 'header' ? 0.3 : 1,
                                            position: 'relative'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                background: fLayout.background || 'rgba(18, 21, 45, 0.98)',
                                                borderRadius: fLayout.isCard ? `${fLayout.borderRadius || 12}px` : '0',
                                                border: `${fLayout.borderWidth || 1}px solid ${fLayout.borderColor || 'var(--glass-border)'}`,
                                                boxShadow: fLayout.isCard ? '0 -8px 30px rgba(0,0,0,0.3)' : 'none',
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(12, 1fr)',
                                                gap: `${fLayout.gap ?? 4}px`,
                                                padding: `0 ${fLayout.padding || 10}px`,
                                                direction: fLayout.isRTL ? 'rtl' : 'ltr',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}>
                                                {/* GHOST GRID */}
                                                {activeGlobalElement === 'footer' && (
                                                    <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px', padding: `0 ${fLayout.padding || 10}px`, pointerEvents: 'none' }}>
                                                        {Array.from({ length: 12 }).map((_, i) => (
                                                            <div key={i} style={{ background: 'rgba(123, 97, 255, 0.05)', borderLeft: '1px dashed rgba(123, 97, 255, 0.1)', borderRight: '1px dashed rgba(123, 97, 255, 0.1)' }} />
                                                        ))}
                                                    </div>
                                                )}

                                                {(course.playerConfig?.footerLayout?.cells || [
                                                    { id: 'f-cell-prev', span: 3, alignment: 'left' },
                                                    { id: 'f-cell-counter', span: 6, alignment: 'center' },
                                                    { id: 'f-cell-next', span: 3, alignment: 'right' }
                                                ]).map(cell => {
                                                    const cellElements = (course.footer?.blocks?.flatMap(b => b.elements) || [])
                                                        .filter(el => el.cellId === cell.id);

                                                    return (
                                                        <div
                                                            key={cell.id}
                                                            onClick={() => setEditingGlobalElement('footer')}
                                                            style={{
                                                                gridColumn: `span ${cell.span}`,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: cell.alignment === 'center' ? 'center' : cell.alignment === 'right' ? 'flex-end' : 'flex-start',
                                                                height: '100%',
                                                                border: activeGlobalElement === 'footer' ? '1px dashed var(--noor-secondary)' : 'none',
                                                                background: activeGlobalElement === 'footer' ? 'rgba(123, 97, 255, 0.03)' : 'transparent',
                                                                cursor: 'pointer',
                                                                padding: '0 10px',
                                                                gap: '8px',
                                                                position: 'relative',
                                                                zIndex: 2,
                                                                transition: 'all 0.2s',
                                                                minWidth: 0,
                                                                overflow: 'hidden'
                                                            }}
                                                            onMouseEnter={e => { if (activeGlobalElement === 'footer') e.currentTarget.style.background = 'rgba(123, 97, 255, 0.08)'; }}
                                                            onMouseLeave={e => { if (activeGlobalElement === 'footer') e.currentTarget.style.background = 'rgba(123, 97, 255, 0.03)'; }}
                                                        >

                                                            {cellElements.map(element => (
                                                                <div
                                                                    key={element.id}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        position: 'relative',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: cell.alignment === 'center' ? 'center' : cell.alignment === 'right' ? 'flex-end' : 'flex-start',
                                                                        // overflow: 'hidden' // Removed
                                                                    }}
                                                                    className="global-comp-preview-item"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingGlobalElement('footer');
                                                                        setActiveCellId(cell.id);
                                                                        setActiveBlockIndex(0);
                                                                        setActiveComponentIndex(course.footer.blocks[0].elements.findIndex(el => el.id === element.id));
                                                                    }}
                                                                >
                                                                    <ComponentRenderer
                                                                        component={element}
                                                                        isPreview={true}
                                                                    />

                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (window.confirm('Supprimer ce composant ?')) deleteComponent(0, course.footer.blocks[0].elements.findIndex(el => el.id === element.id));
                                                                        }}
                                                                        className="delete-hover-btn"
                                                                        style={{
                                                                            position: 'absolute',
                                                                            top: '-10px',
                                                                            right: '-10px',
                                                                            width: '18px',
                                                                            height: '18px',
                                                                            borderRadius: '50%',
                                                                            background: '#ff4757',
                                                                            border: 'none',
                                                                            color: 'white',
                                                                            display: 'none',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            cursor: 'pointer',
                                                                            zIndex: 10
                                                                        }}
                                                                    >
                                                                        <Trash2 size={10} />
                                                                    </button>
                                                                </div>
                                                            ))}

                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>

                {/* RIGHT SIDEBAR - INSPECTOR */}
                <aside className="inspector-sidebar" style={{ width: '340px', background: 'rgba(18, 21, 45, 0.7)', backdropFilter: 'blur(40px)', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {activeComponentIndex !== null ? <Sliders size={16} /> : activeBlockIndex !== null ? <Grid size={16} /> : <Layout size={16} />}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white', textTransform: 'uppercase' }}>
                                    {activeGlobalElement ? `${activeGlobalElement} Global` : (activeComponentIndex !== null ? 'Inspecteur : Composant' : activeBlockIndex !== null ? 'Inspecteur : Bloc' : 'Inspecteur : Page')}
                                </h3>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Propriétés et styles avancés</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* --- NEW HEADER/FOOTER LAYOUT TOOLBAR --- */}
                        {activeGlobalElement && activeComponentIndex === null && (
                            <HeaderFooterToolbar type={activeGlobalElement} />
                        )}

                        {/* --- COMPONENT TYPE HEADER --- */}
                        {getInspectorTarget() ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Shared Property: Title */}
                                <div>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Titre de l'élément</label>
                                    <input className="input-field" value={getInspectorTarget().title || ''} onChange={(e) => getInspectorUpdateFn()({ title: e.target.value })} />
                                </div>

                                {activeGlobalElement && activeCellId && (() => {
                                    const currentLayout = activeGlobalElement === 'header' ? course.playerConfig?.headerLayout : course.playerConfig?.footerLayout;
                                    const currentCell = currentLayout?.cells?.find(c => c.id === activeCellId) || { span: 3, alignment: 'left' };

                                    const updateCell = (updates) => {
                                        const newLayout = { ...(currentLayout || { cells: [] }) };
                                        newLayout.cells = (newLayout.cells || []).map(c => c.id === activeCellId ? { ...c, ...updates } : c);
                                        updateCourseMetadata({ playerConfig: { ...course.playerConfig, [activeGlobalElement === 'header' ? 'headerLayout' : 'footerLayout']: newLayout } });
                                    };

                                    return (
                                        <div style={{ padding: '20px', background: 'rgba(123, 97, 255, 0.05)', borderRadius: '16px', border: '1px solid rgba(123, 97, 255, 0.2)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Columns size={18} style={{ color: 'var(--noor-secondary)' }} />
                                                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white', margin: 0 }}>Réglages de la Colonne</h4>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Largeur (Grille de 12)</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <input
                                                        type="range" min="1" max="12" step="1"
                                                        value={currentCell.span || 3}
                                                        onChange={(e) => updateCell({ span: parseInt(e.target.value) })}
                                                        style={{ flex: 1, accentColor: 'var(--noor-secondary)' }}
                                                    />
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--noor-secondary)', minWidth: '30px', textAlign: 'right' }}>{currentCell.span || 3}</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Alignement du contenu</label>
                                                <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px' }}>
                                                    <button onClick={() => updateCell({ alignment: 'left' })} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: currentCell.alignment === 'left' ? 'var(--noor-secondary)' : 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><AlignLeft size={16} style={{ margin: '0 auto' }} /></button>
                                                    <button onClick={() => updateCell({ alignment: 'center' })} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: currentCell.alignment === 'center' ? 'var(--noor-secondary)' : 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><AlignCenter size={16} style={{ margin: '0 auto' }} /></button>
                                                    <button onClick={() => updateCell({ alignment: 'right' })} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: currentCell.alignment === 'right' ? 'var(--noor-secondary)' : 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><AlignRight size={16} style={{ margin: '0 auto' }} /></button>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setGlobalCompModal({ isOpen: true, type: activeGlobalElement, cellId: activeCellId })}
                                                className="btn-primary"
                                                style={{ width: '100%', borderRadius: '12px', padding: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}
                                            >
                                                <Plus size={16} /> Ajouter un composant
                                            </button>
                                        </div>
                                    );
                                })()}

                                {/* Restore Cell Selector for Components */}
                                {activeGlobalElement && activeComponentIndex !== null && (
                                    <div style={{ padding: '16px', background: 'rgba(123, 97, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(123, 97, 255, 0.2)' }}>
                                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Affecter à une Colonne</label>
                                        <select
                                            className="input-field"
                                            value={getInspectorTarget().cellId || ''}
                                            onChange={(e) => getInspectorUpdateFn()({ cellId: e.target.value })}
                                            style={{ fontSize: '0.8rem' }}
                                        >
                                            <option value="">(Aucune cellule)</option>
                                            {(activeGlobalElement === 'header'
                                                ? course.playerConfig?.headerLayout
                                                : course.playerConfig?.footerLayout)?.cells?.map((cell, cIdx) => (
                                                    <option key={cell.id || cIdx} value={cell.id}>Col {cell.id?.replace('h-cell-', '').replace('f-cell-', '') || (cIdx + 1)} (Span {cell.span})</option>
                                                ))}
                                        </select>
                                    </div>
                                )}

                                {/* Specific Editors */}
                                {(() => {
                                    const target = getInspectorTarget();
                                    const updateFn = getInspectorUpdateFn();
                                    if (!target) return null;
                                    switch (target.type) {
                                        case 'SPLASH':
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <textarea className="input-field" placeholder="Description" rows={3} value={target.description || ''} onChange={(e) => updateFn({ description: e.target.value })} />
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <input className="input-field" style={{ flex: 1 }} value={target.image || ''} onChange={(e) => updateFn({ image: e.target.value })} placeholder="URL Image..." />
                                                        <button className="btn-secondary" style={{ padding: '8px' }} onClick={async () => {
                                                            const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
                                                            input.onchange = async (e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    const url = await uploadAsset(file);
                                                                    if (url) updateFn({ image: url });
                                                                }
                                                            };
                                                            input.click();
                                                        }}><Upload size={14} /></button>
                                                    </div>

                                                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Styles de texte</label>
                                                        <TextStyleEditor
                                                            component={target}
                                                            onStyleChange={(newStyle) => updateFn({ style: newStyle })}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        case 'PARAGRAPH':
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <textarea className="input-field" rows={8} placeholder="Texte..." value={target.content || ''} onChange={(e) => updateFn({ content: e.target.value })} />

                                                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Styles de texte</label>
                                                        <TextStyleEditor
                                                            component={target}
                                                            onStyleChange={(newStyle) => updateFn({ style: newStyle })}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        case 'CHOICE':
                                        case 'CHOICE_MULTI':
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                    <div>
                                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Question / Instruction</label>
                                                        <input className="input-field" value={target.instruction || ''} onChange={(e) => updateFn({ instruction: e.target.value })} placeholder="Quelle est la question ?" />
                                                    </div>
                                                    <div style={{ paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'white', marginBottom: '12px', display: 'block' }}>Options de réponse</label>
                                                        {(target.options || []).map((opt, i) => (
                                                            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                                                <input type="checkbox" checked={opt.isCorrect} onChange={(e) => {
                                                                    const newOpts = [...target.options];
                                                                    if (target.type === 'CHOICE') newOpts.forEach(o => o.isCorrect = false);
                                                                    newOpts[i].isCorrect = e.target.checked;
                                                                    updateFn({ options: newOpts });
                                                                }} />
                                                                <input className="input-field" style={{ flex: 1, fontSize: '0.8rem', height: '32px' }} value={opt.text} onChange={(e) => {
                                                                    const newOpts = [...target.options];
                                                                    newOpts[i].text = e.target.value;
                                                                    updateFn({ options: newOpts });
                                                                }} />
                                                                <button onClick={() => updateFn({ options: target.options.filter((_, idx) => idx !== i) })} style={{ background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer' }}><X size={14} /></button>
                                                            </div>
                                                        ))}
                                                        <button className="btn-secondary" onClick={() => updateFn({ options: [...(target.options || []), { text: '', isCorrect: false }] })} style={{ width: '100%', marginTop: '8px' }}><Plus size={14} /> Ajouter une option</button>
                                                    </div>
                                                </div>
                                            );

                                        case 'VIDEO':
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                    <div>
                                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Source Vidéo</label>
                                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                                            <button onClick={() => updateFn({ videoType: 'youtube' })} style={{ flex: 1, padding: '8px', fontSize: '0.7rem', borderRadius: '8px', background: target.videoType === 'youtube' ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}>YouTube</button>
                                                            <button onClick={() => updateFn({ videoType: 'url' })} style={{ flex: 1, padding: '8px', fontSize: '0.7rem', borderRadius: '8px', background: target.videoType === 'url' ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}>Direct MP4</button>
                                                        </div>
                                                        <input className="input-field" value={target.url || ''} onChange={(e) => updateFn({ url: e.target.value })} placeholder="URL de la vidéo..." />
                                                    </div>
                                                </div>
                                            );

                                        case 'ANIMATED_LOGO':
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                    <div>
                                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Réglages Logo</label>
                                                        <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Taille ({target.size || 40}px)</label>
                                                        <input type="range" min="20" max="200" value={target.size || 40} onChange={(e) => updateFn({ size: parseInt(e.target.value) })} style={{ width: '100%', accentColor: 'var(--noor-secondary)' }} />
                                                    </div>
                                                </div>
                                            );

                                        case 'GAMEMEMO':
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase', display: 'block' }}>Grille du Jeu</label>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                        <div>
                                                            <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Colonnes ({target.gridColumns || 4})</label>
                                                            <input type="range" min="2" max="6" value={target.gridColumns || 4} onChange={(e) => updateFn({ gridColumns: parseInt(e.target.value) })} style={{ width: '100%' }} />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Lignes ({target.gridRows || 3})</label>
                                                            <input type="range" min="2" max="6" value={target.gridRows || 3} onChange={(e) => updateFn({ gridRows: parseInt(e.target.value) })} style={{ width: '100%' }} />
                                                        </div>
                                                    </div>
                                                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'white', marginBottom: '12px', display: 'block' }}>Paires ({target.pairs?.length || 0})</label>
                                                        {(target.pairs || []).map((pair, i) => (
                                                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 30px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                                                <input className="input-field" placeholder="Image URL" value={pair.imageUrl} onChange={(e) => {
                                                                    const newPairs = [...target.pairs]; newPairs[i].imageUrl = e.target.value; updateFn({ pairs: newPairs });
                                                                }} />
                                                                <input className="input-field" placeholder="Texte" value={pair.text} onChange={(e) => {
                                                                    const newPairs = [...target.pairs]; newPairs[i].text = e.target.value; updateFn({ pairs: newPairs });
                                                                }} />
                                                                <button onClick={() => updateFn({ pairs: target.pairs.filter((_, idx) => idx !== i) })} style={{ background: 'none', border: 'none', color: '#ff4757' }}><X size={14} /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button className="btn-secondary" onClick={() => updateFn({ pairs: [...(target.pairs || []), { imageUrl: '', text: '' }] })}>
                                                        <Plus size={14} /> Ajouter une Paire
                                                    </button>
                                                </div>
                                            );

                                        case 'PREV_BUTTON':
                                        case 'NEXT_BUTTON':
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
                                                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Contenu du Bouton</label>
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Action de navigation</label>
                                                            <select
                                                                className="input-field"
                                                                value={target.navigationAction || (target.type === 'PREV_BUTTON' ? 'PREVIOUS' : 'NEXT')}
                                                                onChange={(e) => updateFn({ navigationAction: e.target.value })}
                                                                style={{ height: '32px', fontSize: '0.8rem' }}
                                                            >
                                                                <option value="PREVIOUS">Page Précédente</option>
                                                                <option value="NEXT">Page Suivante</option>
                                                                <option value="START">Aller au Début</option>
                                                                <option value="END">Aller à la Fin</option>
                                                            </select>
                                                        </div>

                                                        <div style={{ marginBottom: '16px' }}>
                                                            <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Texte du bouton</label>
                                                            <input
                                                                className="input-field"
                                                                value={target.label || ''}
                                                                onChange={(e) => updateFn({ label: e.target.value })}
                                                                placeholder={target.navigationAction === 'START' ? 'Début' : target.navigationAction === 'END' ? 'Fin' : target.type === 'PREV_BUTTON' ? 'Précédent' : 'Suivant'}
                                                                style={{ height: '42px', fontSize: '0.9rem' }}
                                                            />
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                                            <div>
                                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Taille Police ({target.style?.fontSize || 14}px)</label>
                                                                <input type="range" min="8" max="40" value={target.style?.fontSize || 14} onChange={(e) => updateFn({ style: { ...target.style, fontSize: parseInt(e.target.value) } })} style={{ width: '100%', accentColor: 'var(--noor-secondary)' }} />
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Gras ({target.style?.fontWeight || 600})</label>
                                                                <select
                                                                    className="input-field"
                                                                    value={target.style?.fontWeight || 600}
                                                                    onChange={(e) => updateFn({ style: { ...target.style, fontWeight: parseInt(e.target.value) } })}
                                                                    style={{ height: '32px', fontSize: '0.8rem', padding: '0 8px' }}
                                                                >
                                                                    <option value="400">Normal</option>
                                                                    <option value="600">Semi-gras</option>
                                                                    <option value="800">Extra-gras</option>
                                                                    <option value="900">Black</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Apparence du Bouton</label>

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                                            <div>
                                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Fond</label>
                                                                <ColorPicker color={target.style?.backgroundColor || 'transparent'} onChange={(c) => updateFn({ style: { ...target.style, backgroundColor: c } })} />
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Icône / Texte</label>
                                                                <ColorPicker color={target.style?.color || 'white'} onChange={(c) => updateFn({ style: { ...target.style, color: c } })} />
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                                            <div>
                                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Arrondi ({target.style?.borderRadius || 0}px)</label>
                                                                <input type="range" min="0" max="30" step="2" value={parseInt(target.style?.borderRadius || 0)} onChange={(e) => updateFn({ style: { ...target.style, borderRadius: parseInt(e.target.value) } })} style={{ width: '100%', accentColor: 'var(--noor-secondary)' }} />
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Padding ({target.style?.padding || 8}px)</label>
                                                                <input type="range" min="0" max="24" step="2" value={parseInt(target.style?.padding || 8)} onChange={(e) => updateFn({ style: { ...target.style, padding: parseInt(e.target.value) } })} style={{ width: '100%', accentColor: 'var(--noor-secondary)' }} />
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                                            <div>
                                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Largeur Min ({target.style?.minWidth || 100}px)</label>
                                                                <input type="range" min="40" max="300" step="10" value={parseInt(target.style?.minWidth || 100)} onChange={(e) => updateFn({ style: { ...target.style, minWidth: parseInt(e.target.value) } })} style={{ width: '100%', accentColor: 'var(--noor-secondary)' }} />
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '15px' }}>
                                                                <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Étendre (Stretch)</span>
                                                                <input type="checkbox" checked={target.style?.flex === 1} onChange={(e) => updateFn({ style: { ...target.style, flex: e.target.checked ? 1 : 'none', width: e.target.checked ? '100%' : 'fit-content' } })} />
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                                            <div>
                                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Taille Icône ({target.style?.iconSize || 16}px)</label>
                                                                <input type="range" min="10" max="32" value={target.style?.iconSize || 16} onChange={(e) => updateFn({ style: { ...target.style, iconSize: parseInt(e.target.value) } })} style={{ width: '100%', accentColor: 'var(--noor-secondary)' }} />
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '15px' }}>
                                                                <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Masquer l'icône</span>
                                                                <input type="checkbox" checked={target.style?.hideIcon || false} onChange={(e) => updateFn({ style: { ...target.style, hideIcon: e.target.checked } })} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Bordure</label>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                                                            <div>
                                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Couleur Bordure</label>
                                                                <ColorPicker color={target.style?.borderColor || 'transparent'} onChange={(c) => updateFn({ style: { ...target.style, borderColor: c, borderWidth: target.style?.borderWidth || 1, borderStyle: 'solid' } })} />
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Épaisseur ({target.style?.borderWidth || 0}px)</label>
                                                                <input type="range" min="0" max="10" step="1" value={parseInt(target.style?.borderWidth || 0)} onChange={(e) => updateFn({ style: { ...target.style, borderWidth: parseInt(e.target.value), borderStyle: 'solid' } })} style={{ width: '100%', accentColor: 'var(--noor-secondary)' }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );

                                        case 'COURSE_TITLE':
                                        case 'PROGRESS_BAR':
                                        case 'SLIDE_COUNTER':
                                        case 'INTERACTION_SCORE':
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Afficher le composant</span>
                                                        <button
                                                            onClick={() => updateFn({ hidden: !target.hidden })}
                                                            style={{
                                                                width: '40px',
                                                                height: '22px',
                                                                borderRadius: '11px',
                                                                background: !target.hidden ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.1)',
                                                                border: 'none',
                                                                padding: '2px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.3s ease',
                                                                position: 'relative'
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: '18px',
                                                                height: '18px',
                                                                background: 'white',
                                                                borderRadius: '50%',
                                                                transform: !target.hidden ? 'translateX(18px)' : 'translateX(0)',
                                                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                                            }} />
                                                        </button>
                                                    </div>

                                                    <div style={{ paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Styles & Couleurs</label>
                                                        <TextStyleEditor
                                                            component={target}
                                                            onStyleChange={(newStyle) => updateFn({ style: newStyle })}
                                                        />
                                                    </div>
                                                </div>
                                            );

                                        default:
                                            return <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Utilisez l'explorateur pour gérer le contenu complexe.</p>;
                                    }
                                })()}

                                {/* BLOCK SPECIFIC STYLE (Columns, etc) */}
                                {activeBlock && activeBlockIndex !== null && activeComponentIndex === null && !activeGlobalElement && (
                                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <h5 style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase' }}>Mise en page & Style</h5>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Disposition</label>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button onClick={() => updateActiveBlock({ style: { ...(activeBlock?.style || {}), flexDirection: 'column' } })} style={{ flex: 1, padding: '6px', fontSize: '0.6rem', borderRadius: '8px', background: activeBlock?.style?.flexDirection !== 'row' ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}>Vertical</button>
                                                    <button onClick={() => updateActiveBlock({ style: { ...(activeBlock?.style || {}), flexDirection: 'row' } })} style={{ flex: 1, padding: '6px', fontSize: '0.6rem', borderRadius: '8px', background: activeBlock?.style?.flexDirection === 'row' ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}>Horizontal</button>
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Direction</label>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button onClick={() => updateActiveBlock({ style: { ...(activeBlock?.style || {}), direction: 'ltr' } })} style={{ flex: 1, padding: '6px', fontSize: '0.6rem', borderRadius: '8px', background: activeBlock?.style?.direction !== 'rtl' ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}>LTR</button>
                                                    <button onClick={() => updateActiveBlock({ style: { ...(activeBlock?.style || {}), direction: 'rtl' } })} style={{ flex: 1, padding: '6px', fontSize: '0.6rem', borderRadius: '8px', background: activeBlock?.style?.direction === 'rtl' ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}>RTL (Ar)</button>
                                                </div>
                                            </div>
                                        </div>

                                        {activeBlock.style?.flexDirection === 'row' && (
                                            <div>
                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Alignement Réparti</label>
                                                <select
                                                    className="input-field"
                                                    style={{ fontSize: '0.75rem', height: '36px' }}
                                                    value={activeBlock.style?.justifyContent || 'start'}
                                                    onChange={(e) => updateActiveBlock({ style: { ...(activeBlock.style || {}), justifyContent: e.target.value } })}
                                                >
                                                    <option value="start">Début</option>
                                                    <option value="center">Centre</option>
                                                    <option value="end">Fin</option>
                                                    <option value="space-between">Entre (Space-between)</option>
                                                    <option value="space-around">Autour (Space-around)</option>
                                                </select>
                                            </div>
                                        )}

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Largeur (Colonnes)</label>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    {[4, 6, 8, 12].map(col => (
                                                        <button key={col} onClick={() => updateActiveBlock({ style: { ...(activeBlock.style || {}), columns: col } })} style={{ flex: 1, padding: '6px', fontSize: '0.7rem', borderRadius: '8px', background: activeBlock.style?.columns === col ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}>{col}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Hauteur Min (px)</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    style={{ height: '32px', fontSize: '0.8rem' }}
                                                    value={activeBlock.style?.minHeight || ''}
                                                    onChange={(e) => updateActiveBlock({ style: { ...(activeBlock.style || {}), minHeight: parseInt(e.target.value) || 0 } })}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>Padding <span>{activeBlock.style?.padding || 0}px</span></label>
                                                <input type="range" min="0" max="64" step="4" value={activeBlock.style?.padding || 0} onChange={(e) => updateActiveBlock({ style: { ...(activeBlock.style || {}), padding: parseInt(e.target.value) } })} style={{ width: '100%', accentColor: 'var(--noor-secondary)' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>Marge <span>{activeBlock.style?.margin || 16}px</span></label>
                                                <input type="range" min="0" max="64" step="4" value={activeBlock.style?.margin || 16} onChange={(e) => updateActiveBlock({ style: { ...(activeBlock.style || {}), margin: parseInt(e.target.value) } })} style={{ width: '100%', accentColor: 'var(--noor-secondary)' }} />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Couleur Fond</label>
                                                <ColorPicker color={activeBlock?.style?.background || 'transparent'} onChange={(newColor) => updateActiveBlock({ style: { ...activeBlock.style, background: newColor } })} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Bordure (Carte)</label>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => updateActiveBlock({ style: { ...activeBlock.style, showBorder: !activeBlock.style?.showBorder } })}
                                                        style={{
                                                            padding: '8px 12px',
                                                            borderRadius: '8px',
                                                            fontSize: '0.65rem',
                                                            fontWeight: 800,
                                                            background: activeBlock?.style?.showBorder ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.05)',
                                                            border: '1px solid var(--glass-border)',
                                                            color: 'white',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {activeBlock?.style?.showBorder ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
                                                    </button>
                                                    <ColorPicker color={activeBlock?.style?.borderColor || '#7b61ff'} onChange={(newColor) => updateActiveBlock({ style: { ...activeBlock.style, borderColor: newColor } })} />
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>Arrondi <span>{activeBlock?.style?.borderRadius || 24}px</span></label>
                                                <input type="range" min="0" max="48" step="4" value={activeBlock?.style?.borderRadius || 24} onChange={(e) => updateActiveBlock({ style: { ...activeBlock.style, borderRadius: parseInt(e.target.value) } })} style={{ width: '100%', accentColor: 'var(--noor-secondary)' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>Gap composants <span>{activeBlock?.style?.gap || 24}px</span></label>
                                                <input type="range" min="0" max="64" step="4" value={activeBlock?.style?.gap || 24} onChange={(e) => updateActiveBlock({ style: { ...activeBlock.style, gap: parseInt(e.target.value) } })} style={{ width: '100%', accentColor: 'var(--noor-secondary)' }} />
                                            </div>
                                        </div>
                                        {activeComponentIndex !== null && (
                                            <div style={{ marginTop: '24px', borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Voulez-vous vraiment supprimer ce composant ?')) {
                                                            deleteComponent(activeBlockIndex, activeComponentIndex);
                                                        }
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        borderRadius: '12px',
                                                        background: 'rgba(255, 71, 87, 0.1)',
                                                        border: '1px solid rgba(255, 71, 87, 0.2)',
                                                        color: '#ff4757',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 800,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.15)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.1)'}
                                                >
                                                    <Trash2 size={14} />
                                                    Supprimer ce composant
                                                </button>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                                                    <button
                                                        disabled={activeComponentIndex === 0}
                                                        onClick={() => reorderComponents(activeBlockIndex, activeComponentIndex, activeComponentIndex - 1)}
                                                        className="btn-secondary"
                                                        style={{ padding: '8px', fontSize: '0.7rem', display: 'flex', justifyContent: 'center', opacity: activeComponentIndex === 0 ? 0.3 : 1 }}
                                                    >
                                                        <ChevronUp size={14} style={{ marginRight: '6px' }} /> Monter
                                                    </button>
                                                    <button
                                                        disabled={activeComponentIndex === (activeBlock?.elements?.length || 0) - 1}
                                                        onClick={() => reorderComponents(activeBlockIndex, activeComponentIndex, activeComponentIndex + 1)}
                                                        className="btn-secondary"
                                                        style={{ padding: '8px', fontSize: '0.7rem', display: 'flex', justifyContent: 'center', opacity: activeComponentIndex === (activeBlock?.elements?.length || 0) - 1 ? 0.3 : 1 }}
                                                    >
                                                        <ChevronDown size={14} style={{ marginRight: '6px' }} /> Descendre
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {activeComponentIndex === null && (
                                            <div style={{ marginTop: '24px', borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Voulez-vous vraiment supprimer ce bloc ?')) {
                                                            deleteBlock(activeBlockIndex);
                                                            setActiveBlockIndex(null);
                                                        }
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        borderRadius: '12px',
                                                        background: 'rgba(255, 71, 87, 0.1)',
                                                        border: '1px solid rgba(255, 71, 87, 0.2)',
                                                        color: '#ff4757',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 800,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                    Supprimer ce bloc
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ padding: '0 0 20px 0', borderBottom: '1px solid var(--glass-border)' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Réglages de la Page</h3>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Configurez l'apparence de cette diapositive</p>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Marge interne (Padding px)</label>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={activeSlide.style?.padding ?? 24}
                                            onChange={(e) => updateActiveSlide({ style: { ...activeSlide.style, padding: parseInt(e.target.value) } })}
                                            style={{ flex: 1 }}
                                        />
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={activeSlide.style?.padding ?? (activeGlobalElement ? 0 : 24)}
                                            onChange={(e) => updateActiveSlide({ style: { ...activeSlide.style, padding: parseInt(e.target.value) || 0 } })}
                                            style={{ width: '60px', padding: '8px', textAlign: 'center' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Espacement entre les blocs (px)</label>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={activeSlide.style?.gap ?? 24}
                                            onChange={(e) => updateActiveSlide({ style: { ...activeSlide.style, gap: parseInt(e.target.value) } })}
                                            style={{ flex: 1 }}
                                        />
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={activeSlide.style?.gap ?? 24}
                                            onChange={(e) => updateActiveSlide({ style: { ...activeSlide.style, gap: parseInt(e.target.value) || 0 } })}
                                            style={{ width: '60px', padding: '8px', textAlign: 'center' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Couleur de fond de la Page</label>
                                    <ColorPicker
                                        color={activeSlide.style?.background || 'transparent'}
                                        onChange={(newColor) => updateActiveSlide({ style: { ...activeSlide.style, background: newColor } })}
                                    />
                                </div>

                                <div style={{ marginTop: '40px', textAlign: 'center', opacity: 0.3 }}>
                                    <AlertTriangle size={32} style={{ marginBottom: '16px', margin: '0 auto' }} />
                                    <p style={{ fontSize: '0.7rem' }}>Sélectionnez un bloc pour modifier ses propriétés spécifiques.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div >

            {/* MODAL SETTINGS */}
            < AnimatePresence >
                {showCourseSettings && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCourseSettings(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ width: '100%', maxWidth: '550px', maxHeight: '90vh', background: 'var(--bg-secondary)', borderRadius: '32px', border: '1px solid var(--glass-border)', padding: '40px', position: 'relative', zIndex: 1001, boxShadow: '0 30px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '4px' }}>Configuration</h2>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Paramètres globaux du module de cours</p>
                                </div>
                                <button onClick={() => setShowCourseSettings(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}><X size={20} /></button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingRight: '8px' }} className="custom-scrollbar">
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Titre du Cours</label>
                                    <input
                                        className="input-field"
                                        value={course.title}
                                        onChange={(e) => updateCourseMetadata({ title: e.target.value })}
                                        placeholder="Nommez votre cours..."
                                        style={{ height: '54px', fontSize: '1.1rem' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Icône du Projet</label>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(6, 1fr)',
                                            gap: '8px',
                                            padding: '12px',
                                            background: 'rgba(0,0,0,0.2)',
                                            borderRadius: '16px',
                                            border: '1px solid var(--glass-border)'
                                        }}>
                                            {[
                                                { id: 'Book', icon: Book },
                                                { id: 'Calculator', icon: Calculator },
                                                { id: 'Globe', icon: Globe },
                                                { id: 'Palette', icon: Palette },
                                                { id: 'Microscope', icon: Microscope },
                                                { id: 'Languages', icon: Languages },
                                                { id: 'FlaskConical', icon: FlaskConical },
                                                { id: 'History', icon: History },
                                                { id: 'Cpu', icon: Cpu },
                                                { id: 'Music', icon: Music },
                                                { id: 'Trophy', icon: Trophy },
                                                { id: 'Gamepad2', icon: Gamepad2 },
                                            ].map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => updateCourseMetadata({ icon: item.id })}
                                                    style={{
                                                        aspectRatio: '1',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderRadius: '8px',
                                                        background: course.icon === item.id ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.05)',
                                                        border: 'none',
                                                        color: course.icon === item.id ? 'white' : 'var(--text-secondary)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    title={item.id}
                                                >
                                                    <item.icon size={18} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Format d'affichage</label>
                                        <select className="input-field" style={{ height: '54px' }} value={course.aspectRatio || '16/9'} onChange={(e) => updateCourseMetadata({ aspectRatio: e.target.value })}>
                                            <option value="16/9">16:9 - Écran Large</option>
                                            <option value="4/3">4:3 - Standard</option>
                                            <option value="1/1">1:1 - Carré</option>
                                            <option value="9/16">9:16 - Vertical</option>
                                        </select>
                                        <div style={{ marginTop: '12px' }}>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Ou Emoji Libre</label>
                                            <input
                                                className="input-field"
                                                value={!['Book', 'Calculator', 'Globe', 'Palette', 'Microscope', 'Languages', 'FlaskConical', 'History', 'Cpu', 'Music', 'Trophy', 'Gamepad2'].includes(course.icon) ? course.icon : ''}
                                                onChange={(e) => updateCourseMetadata({ icon: e.target.value })}
                                                placeholder="Emoji (💡, 🚀...)"
                                                style={{ height: '42px' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Niveau Scolaire</label>
                                        <select className="input-field" style={{ height: '54px' }} value={course.level} onChange={(e) => updateCourseMetadata({ level: e.target.value })}>
                                            {levels.length > 0 ? levels.map(l => <option key={l} value={l}>{l}</option>) : <option disabled>Chargement...</option>}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Matière</label>
                                        <select className="input-field" style={{ height: '54px' }} value={course.subject} onChange={(e) => updateCourseMetadata({ subject: e.target.value })}>
                                            {subjects.length > 0 ? subjects.map(s => <option key={s} value={s}>{s}</option>) : <option disabled>Chargement...</option>}
                                        </select>
                                    </div>
                                </div>

                                <div style={{
                                    padding: '16px',
                                    background: 'rgba(123, 97, 255, 0.05)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--glass-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Maximize2 size={18} color="white" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Plein Écran Automatique</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lancer le cours directement en plein écran</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => updateCourseMetadata({ autoFullscreen: !course.autoFullscreen })}
                                        style={{
                                            width: '50px',
                                            height: '26px',
                                            borderRadius: '13px',
                                            background: course.autoFullscreen ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.1)',
                                            border: 'none',
                                            padding: '3px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            background: 'white',
                                            borderRadius: '50%',
                                            transform: course.autoFullscreen ? 'translateX(24px)' : 'translateX(0)',
                                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                        }} />
                                    </button>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Miniature du Cours (Thumbnail)</label>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{ width: '100px', height: '60px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {course.thumbnail ? (
                                                <img src={course.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <CourseIcon name={course.icon} size={24} />
                                            )}
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                                            <input
                                                className="input-field"
                                                value={course.thumbnail || ''}
                                                onChange={(e) => updateCourseMetadata({ thumbnail: e.target.value })}
                                                placeholder="Lien de l'image..."
                                                style={{ height: '42px', fontSize: '0.8rem' }}
                                            />
                                            <button
                                                className="btn-secondary"
                                                style={{ padding: '0 12px', height: '42px' }}
                                                onClick={() => {
                                                    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
                                                    input.onchange = async (e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const toastId = toast.loading('Upload miniature...');
                                                            const url = await uploadAsset(file);
                                                            if (url) {
                                                                updateCourseMetadata({ thumbnail: url });
                                                                toast.success('Miniature mise à jour !', { id: toastId });
                                                            } else {
                                                                toast.error('Erreur upload', { id: toastId });
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

                                {/* SECTION LECTEUR (CUSTOMIZATION) */}
                                <div style={{
                                    borderTop: '1px solid var(--glass-border)',
                                    paddingTop: '24px',
                                    marginTop: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '20px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(72, 52, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--noor-secondary)' }}>
                                            <Layout size={18} />
                                        </div>
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Interface du Lecteur</h3>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hauteur Header (px)</label>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <input
                                                    type="range"
                                                    min="40"
                                                    max="200"
                                                    value={course.playerConfig?.headerHeight || 60}
                                                    onChange={(e) => updateCourseMetadata({ playerConfig: { ...course.playerConfig, headerHeight: parseInt(e.target.value) } })}
                                                    style={{ flex: 1 }}
                                                />
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    value={course.playerConfig?.headerHeight || 60}
                                                    onChange={(e) => updateCourseMetadata({ playerConfig: { ...course.playerConfig, headerHeight: parseInt(e.target.value) || 40 } })}
                                                    style={{ width: '60px', padding: '8px', textAlign: 'center' }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hauteur Footer (px)</label>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <input
                                                    type="range"
                                                    min="40"
                                                    max="200"
                                                    value={course.playerConfig?.footerHeight || 60}
                                                    onChange={(e) => updateCourseMetadata({ playerConfig: { ...course.playerConfig, footerHeight: parseInt(e.target.value) } })}
                                                    style={{ flex: 1 }}
                                                />
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    value={course.playerConfig?.footerHeight || 60}
                                                    onChange={(e) => updateCourseMetadata({ playerConfig: { ...course.playerConfig, footerHeight: parseInt(e.target.value) || 40 } })}
                                                    style={{ width: '60px', padding: '8px', textAlign: 'center' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Afficher Header</span>
                                                <input type="checkbox" checked={course.playerConfig?.showHeader ?? true} onChange={(e) => updateCourseMetadata({ playerConfig: { ...course.playerConfig, showHeader: e.target.checked } })} />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Afficher Footer</span>
                                                <input type="checkbox" checked={course.playerConfig?.showFooter ?? true} onChange={(e) => updateCourseMetadata({ playerConfig: { ...course.playerConfig, showFooter: e.target.checked } })} />
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Couleurs de barre</label>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ fontSize: '0.55rem', opacity: 0.6 }}>Header</label>
                                                        <ColorPicker color={course.playerConfig?.headerBackground || 'rgba(18, 21, 45, 0.98)'} onChange={(c) => updateCourseMetadata({ playerConfig: { ...course.playerConfig, headerBackground: c } })} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ fontSize: '0.55rem', opacity: 0.6 }}>Footer</label>
                                                        <ColorPicker color={course.playerConfig?.footerBackground || 'rgba(18, 21, 45, 0.98)'} onChange={(c) => updateCourseMetadata({ playerConfig: { ...course.playerConfig, footerBackground: c } })} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                    <button
                                        onClick={() => updateCourseMetadata({ playerConfig: { ...course.playerConfig, showProgressBar: !course.playerConfig?.showProgressBar } })}
                                        style={{ padding: '10px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, background: course.playerConfig?.showProgressBar ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        PROGRÈS
                                    </button>
                                    <button
                                        onClick={() => updateCourseMetadata({ playerConfig: { ...course.playerConfig, showInteractionScore: !course.playerConfig?.showInteractionScore } })}
                                        style={{ padding: '10px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, background: course.playerConfig?.showInteractionScore ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        SCORE
                                    </button>
                                    <button
                                        onClick={() => updateCourseMetadata({ playerConfig: { ...course.playerConfig, showSlideCounter: !course.playerConfig?.showSlideCounter } })}
                                        style={{ padding: '10px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, background: course.playerConfig?.showSlideCounter ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        COMPTEUR
                                    </button>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Logo Personnalisé (URL)</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            className="input-field"
                                            value={course.playerConfig?.logoUrl || ''}
                                            onChange={(e) => updateCourseMetadata({ playerConfig: { ...course.playerConfig, logoUrl: e.target.value } })}
                                            placeholder="Lien vers votre logo..."
                                            style={{ height: '42px', fontSize: '0.8rem' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button className="btn-primary" onClick={() => setShowCourseSettings(false)} style={{ height: '60px', borderRadius: '18px', fontSize: '1.1rem', marginTop: '12px', justifyContent: 'center' }}>
                                Enregistrer la configuration
                            </button>
                        </motion.div>
                    </div>
                )}

                <ComponentModal
                    isOpen={globalCompModal.isOpen}
                    onClose={() => setGlobalCompModal({ isOpen: false, type: null, cellId: null })}
                    onSelect={(type) => {
                        // Pass globalCompModal.type as targetType to ensure it goes to the right section
                        addComponentToBlock(0, type, globalCompModal.cellId, globalCompModal.type);
                        setGlobalCompModal({ isOpen: false, type: null, cellId: null });
                    }}
                />
            </AnimatePresence >
        </div >
    );
};

export default CourseEditor;
