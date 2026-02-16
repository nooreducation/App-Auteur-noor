import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
    Layout,
    Link as LinkIcon,
    Image as ImageIcon,
    CheckCircle2,
    Type,
    AlertTriangle,
    ListChecks,
    HelpCircle,
    ArrowDownUp,
    Layers,
    Video,
    Trophy,
    Check,
    X,
    Maximize2,
    RefreshCcw,
    Sliders,
    Volume2,
    VolumeX,
    Target,
    Activity,
    Grid,
    MousePointer2,
    PenTool,
    Share2,
    ArrowRight,
    ArrowUp,
    ArrowDown,
    Plus,
    GripVertical,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    Power
} from 'lucide-react';
import useCourseStore from '../stores/courseStore';
import GameMemo from './GameMemo';
import AnimatedLogo from './AnimatedLogo';

const COMPONENT_CATEGORIES = [
    {
        id: 'content',
        label: 'Contenu',
        icon: ImageIcon,
        components: [
            { id: 'PARAGRAPH', label: 'Texte Riche', icon: Type, description: 'Ajouter du texte formaté' },
            { id: 'VIDEO', label: 'Vidéo', icon: Video, description: 'Youtube, Vimeo ou URL' },
            { id: 'STORY', label: 'Web/Iframe', icon: LinkIcon, description: 'Contenu externe' },
            { id: 'HOTSPOTS', label: 'Image Interactive', icon: Target, description: 'Zones cliquables sur image' },
            { id: 'ANIMATED_LOGO', label: 'Logo Noor', icon: Activity, description: 'Le logo animé de Noor' },
        ]
    },
    {
        id: 'interactivity',
        label: 'Interactivité',
        icon: PenTool,
        components: [
            { id: 'GAP_FILL', label: 'Texte à trous', icon: Type, description: 'Remplir les mots manquants' },
            { id: 'DROPDOWN_TEXT', label: 'Menus déroulants', icon: Sliders, description: 'Choisir dans une liste' },
            { id: 'FREE_TEXT', label: 'Saisie libre', icon: PenTool, description: 'Réponse textuelle libre' },
            { id: 'TEXT_SELECT', label: 'Identification', icon: CheckCircle2, description: 'Cliquer sur les bons mots' },
        ]
    },
    {
        id: 'manipulation',
        label: 'Manipulation',
        icon: GripVertical,
        components: [
            { id: 'GAMEMEMO', label: 'Jeu de mémoire', icon: Grid, description: 'Paires d\'images et textes' },
            { id: 'DRAG_DROP', label: 'Triage', icon: Layers, description: 'Classer dans des catégories' },
            { id: 'ORDERING', label: 'Mise en ordre', icon: ArrowDownUp, description: 'Ordonner des éléments' },
            { id: 'MATCHING_PAIRS', label: 'Paires simples', icon: Grid, description: 'Relier des éléments' },
        ]
    },
    {
        id: 'evaluation',
        label: 'Évaluation',
        icon: ListChecks,
        components: [
            { id: 'CHOICE', label: 'QCM Unique', icon: ListChecks, description: 'Une seule bonne réponse' },
            { id: 'CHOICE_MULTI', label: 'Choix Multiples', icon: CheckCircle2, description: 'Plusieurs bonnes réponses' },
            { id: 'TRUE_FALSE', label: 'Vrai/Faux', icon: HelpCircle, description: 'Question binaire' },
        ]
    },
    {
        id: 'system',
        label: 'Global',
        icon: Layout,
        components: [
            { id: 'COURSE_TITLE', label: 'Titre du Cours', icon: Type, description: 'Affiche le titre dynamique du cours' },
            { id: 'PROGRESS_BAR', label: 'Barre de Progression', icon: Target, description: 'Suivi visuel de l\'avancement' },
            { id: 'SLIDE_COUNTER', label: 'Compteur de Pages', icon: ListChecks, description: 'Page X / Y' },
            { id: 'INTERACTION_SCORE', label: 'Score Interaction', icon: Activity, description: 'Affiche le score actuel' },
        ]
    },
    {
        id: 'navigation',
        label: 'Navigation',
        icon: ArrowRight,
        components: [
            { id: 'PREV_BUTTON', label: 'Bouton Précédent', icon: ChevronLeft, description: 'Aller à la diapositive précédente' },
            { id: 'NEXT_BUTTON', label: 'Bouton Suivant', icon: ChevronRight, description: 'Aller à la diapositive suivante' },
        ]
    }
];

export const ComponentModal = ({ isOpen, onClose, onSelect }) => {
    const [activeTab, setActiveTab] = useState('content');

    if (!isOpen) return null;

    const currentTab = COMPONENT_CATEGORIES.find(cat => cat.id === activeTab);

    return (
        <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={onClose}>
            <motion.div
                className="modal-content"
                style={{ maxWidth: '900px', width: '90%', padding: 0, height: '600px', display: 'flex', flexDirection: 'column' }}
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
            >
                {/* Header */}
                <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Ajouter un composant</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Choisissez le type d'élément à insérer dans ce bloc</p>
                    </div>
                    <button onClick={onClose} className="btn-icon" style={{ borderRadius: '50%', width: '40px', height: '40px' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '0 12px', borderBottom: '1px solid var(--glass-border)', overflowX: 'auto', scrollbarWidth: 'none' }}>
                    {COMPONENT_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            style={{
                                padding: '16px 10px',
                                background: 'transparent',
                                border: 'none',
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                                borderBottom: activeTab === cat.id ? '3px solid var(--noor-secondary)' : '3px solid transparent',
                                color: activeTab === cat.id ? 'white' : 'var(--text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.9rem',
                                fontWeight: activeTab === cat.id ? 800 : 600,
                                transition: 'all 0.2s'
                            }}
                        >
                            <cat.icon size={18} />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', alignContent: 'start' }}>
                    {currentTab.components.map(comp => (
                        <button
                            key={comp.id}
                            onClick={() => onSelect(comp.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '16px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(123, 97, 255, 0.08)';
                                e.currentTarget.style.borderColor = 'var(--noor-secondary)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                e.currentTarget.style.borderColor = 'var(--glass-border)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                                <comp.icon size={24} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'white' }}>{comp.label}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{comp.description}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export const ComponentRenderer = ({ component, isPreview, columns, onNavigate }) => {
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [userAnswers, setUserAnswers] = useState({});
    const [interactionState, setInteractionState] = useState({});
    const containerRef = useRef(null);
    const { course, activeSlideIndex, setActiveSlideIndex, setDraggedItem, activeDraggedItem } = useCourseStore();

    if (!component) return null;

    const handleTrueFalseClick = (val) => {
        if (!isPreview || isAnswered) return;
        setSelectedOption(val);
    }

    const handleValidate = () => {
        setIsAnswered(true);
    }

    const handleReset = () => {
        setSelectedOption(null);
        setIsAnswered(false);
        setUserAnswers({});
        setInteractionState({});
    }

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Erreur plein écran: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const renderAddons = (addons) => {
        if (!addons) return null;
        return (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {addons.audio && (
                    <button
                        onClick={() => {
                            const audio = new Audio(addons.audio);
                            audio.play().catch(e => console.error("Audio error:", e));
                        }}
                        style={{
                            background: 'rgba(123, 97, 255, 0.2)',
                            border: '1px solid var(--noor-secondary)',
                            color: 'white',
                            padding: '8px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700
                        }}
                    >
                        <Volume2 size={14} /> Écouter la consigne
                    </button>
                )}
                {addons.hint && (
                    <div
                        title={addons.hint}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--text-secondary)',
                            padding: '8px 12px',
                            borderRadius: '12px',
                            cursor: 'help',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.75rem'
                        }}
                    >
                        <HelpCircle size={14} style={{ color: 'var(--noor-secondary)' }} />
                        <span>Indice disponible</span>
                    </div>
                )}
            </div>
        );
    };

    const renderActionButtons = () => {
        if (!isPreview) return null;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: '24px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '16px' }}
            >
                {!isAnswered ? (
                    <button
                        className="btn-primary"
                        onClick={handleValidate}
                        disabled={selectedOption === null && ['CHOICE', 'TRUE_FALSE', 'DROPDOWN_QUESTION'].includes(component.type)}
                        style={{ padding: '8px 24px', borderRadius: '30px', fontSize: '0.9rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '10px' }}
                    >
                        <CheckCircle2 size={16} /> Valider
                    </button>
                ) : (
                    <button
                        className="btn-secondary"
                        onClick={handleReset}
                        style={{ padding: '8px 20px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--noor-secondary)' }}
                    >
                        <RefreshCcw size={14} /> Réessayer
                    </button>
                )}
            </motion.div>
        );
    };

    const renderContent = () => {
        switch (component.type) {
            case 'ANIMATED_LOGO':
                return (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: component.style?.justifyContent || 'center', padding: '0 5px', overflow: 'hidden' }}>
                        <AnimatedLogo
                            size={component.size || 40}
                            style={{ maxHeight: '100%', maxWidth: '100%', width: 'auto', objectFit: 'contain' }}
                        />
                    </div>
                );

            case 'COURSE_TITLE': {
                const style = component.style || {};
                return (
                    <div style={{
                        padding: style.padding ? `${style.padding}px` : '0 8px',
                        fontSize: style.fontSize ? `${style.fontSize}px` : 'clamp(12px, 2.5cqw, 20px)',
                        fontWeight: style.fontWeight || 800,
                        color: style.color || 'white',
                        fontFamily: style.fontFamily || 'inherit',
                        maxWidth: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: style.textAlign === 'center' ? 'center' : style.textAlign === 'right' ? 'flex-end' : 'flex-start',
                        lineHeight: '1.2',
                        wordBreak: 'break-word',
                        backgroundColor: style.backgroundColor || 'transparent',
                        border: style.borderWidth ? `${style.borderWidth}px ${style.borderStyle || 'solid'} ${style.borderColor || 'transparent'}` : 'none',
                        borderRadius: style.borderRadius ? `${style.borderRadius}px` : '0',
                    }}>
                        {course.title || 'Sans titre'}
                    </div>
                );
            }

            case 'PROGRESS_BAR': {
                const style = component.style || {};
                const total = course.slides?.length || 1;
                const current = (activeSlideIndex || 0) + 1;
                const progression = Math.round((current / total) * 100);
                return (
                    <div style={{
                        minWidth: '80px',
                        maxWidth: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center', // Center vertically
                        flexDirection: 'row', // Keep it row to center vertically
                        gap: '4px',
                        padding: style.padding ? `${style.padding}px` : '0',
                        backgroundColor: style.backgroundColor || 'transparent',
                        border: style.borderWidth ? `${style.borderWidth}px ${style.borderStyle || 'solid'} ${style.borderColor || 'transparent'}` : 'none',
                        borderRadius: style.borderRadius ? `${style.borderRadius}px` : '0',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progression}%` }}
                                    style={{ height: '100%', background: style.color || 'var(--gradient-primary)', borderRadius: '3px' }}
                                />
                            </div>
                            <span style={{ fontSize: style.fontSize ? `${Math.max(10, style.fontSize * 0.7)}px` : '0.65rem', fontWeight: 900, color: style.color || 'var(--noor-secondary)', marginLeft: '10px', fontFamily: style.fontFamily }}>{progression}%</span>
                        </div>
                    </div>
                );
            }

            case 'SLIDE_COUNTER': {
                const style = component.style || {};
                const total = course.slides?.length || 1;
                const current = (activeSlideIndex || 0) + 1;
                return (
                    <div style={{
                        fontSize: style.fontSize ? `${style.fontSize}px` : 'clamp(12px, 2.5cqw, 18px)', // More responsive default
                        fontWeight: style.fontWeight || 800,
                        color: style.color || 'var(--text-muted)',
                        fontFamily: style.fontFamily || 'inherit',
                        maxWidth: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center', // Center vertically
                        width: 'fit-content',
                        lineHeight: '1.2',
                        padding: style.padding ? `${style.padding}px` : '0',
                        backgroundColor: style.backgroundColor || 'transparent',
                        border: style.borderWidth ? `${style.borderWidth}px ${style.borderStyle || 'solid'} ${style.borderColor || 'transparent'}` : 'none',
                        borderRadius: style.borderRadius ? `${style.borderRadius}px` : '0',
                    }}>
                        <span style={{ color: style.secondaryColor || 'var(--noor-secondary)' }}>{current}</span> / {total}
                    </div>
                );
            }

            case 'INTERACTION_SCORE': {
                const style = component.style || {};
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(72, 232, 167, 0.08)', padding: '4px 10px', borderRadius: '10px', border: '1px solid rgba(72, 232, 167, 0.2)' }}>
                        <Activity size={14} color={style.color || "#48e8a7"} />
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: style.color || '#48e8a7' }}>0%</div>
                    </div>
                );
            }

            case 'SPLASH': {
                const style = component.style || {};
                const hasCustomStyle = style.fontFamily || style.color;
                return (
                    <div style={{ textAlign: style.textAlign || 'center', padding: '10px', width: '100%', boxSizing: 'border-box' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%' }}>
                            {component.image && (
                                <img src={component.image} style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '20px', marginBottom: '24px' }} alt="" />
                            )}
                            <h2
                                data-custom-text-style={hasCustomStyle ? "true" : undefined}
                                style={{
                                    fontSize: style.fontSize ? `${style.fontSize}px` : '1.8rem',
                                    fontWeight: 900,
                                    marginBottom: '12px',
                                    background: style.color ? 'none' : 'var(--gradient-primary)',
                                    WebkitBackgroundClip: style.color ? 'unset' : 'text',
                                    WebkitTextFillColor: style.color ? style.color : 'transparent',
                                    color: style.color || 'transparent',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                    fontFamily: style.fontFamily || 'inherit',
                                    backgroundColor: style.backgroundColor || 'transparent',
                                    border: style.borderWidth ? `${style.borderWidth}px ${style.borderStyle || 'solid'} ${style.borderColor || 'transparent'}` : 'none',
                                    borderRadius: style.borderRadius ? `${style.borderRadius}px` : '0',
                                    padding: style.padding ? `${style.padding}px` : '0'
                                }}>{component.title}</h2>
                            <p
                                data-custom-text-style={hasCustomStyle ? "true" : undefined}
                                style={{
                                    color: style.color || 'var(--text-secondary)',
                                    fontSize: style.fontSize ? `${Math.round(style.fontSize * 0.6)}px` : '1.1rem',
                                    maxWidth: '100%',
                                    margin: '0 auto',
                                    lineHeight: '1.5',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                    fontFamily: style.fontFamily || 'inherit'
                                }}>{component.description}</p>
                        </motion.div>
                    </div>
                );
            }

            case 'PREV_BUTTON':
            case 'NEXT_BUTTON': {
                const style = component.style || {};
                const action = component.navigationAction || (component.type === 'PREV_BUTTON' ? 'PREVIOUS' : 'NEXT');
                const totalSlides = course.slides?.length || 1;

                let isDisabled = false;
                let defaultLabel = '';
                let Icon = null;
                let finalAction = () => { };

                if (isPreview) {
                    if (action === 'PREVIOUS') {
                        isDisabled = activeSlideIndex === 0;
                        defaultLabel = 'Précédent';
                        Icon = ChevronLeft;
                        finalAction = () => {
                            if (activeSlideIndex > 0) {
                                if (onNavigate) onNavigate(activeSlideIndex - 1);
                                else setActiveSlideIndex(activeSlideIndex - 1);
                            }
                        };
                    } else if (action === 'NEXT') {
                        isDisabled = activeSlideIndex === totalSlides - 1;
                        defaultLabel = 'Suivant';
                        Icon = ChevronRight;
                        finalAction = () => {
                            if (activeSlideIndex < totalSlides - 1) {
                                if (onNavigate) onNavigate(activeSlideIndex + 1);
                                else setActiveSlideIndex(activeSlideIndex + 1);
                            }
                        };
                    } else if (action === 'START') {
                        isDisabled = activeSlideIndex === 0;
                        defaultLabel = 'Début';
                        Icon = ArrowLeft;
                        finalAction = () => {
                            if (onNavigate) onNavigate(0);
                            else setActiveSlideIndex(0);
                        };
                    } else if (action === 'END') {
                        isDisabled = activeSlideIndex === totalSlides - 1;
                        defaultLabel = 'Fin';
                        Icon = ArrowRight;
                        finalAction = () => {
                            if (onNavigate) onNavigate(totalSlides - 1);
                            else setActiveSlideIndex(totalSlides - 1);
                        };
                    }
                }

                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isPreview || isDisabled) return;
                            finalAction();
                        }}
                        disabled={isDisabled && isPreview}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            background: style.backgroundColor || (action === 'NEXT' ? 'var(--noor-secondary)' : 'rgba(255, 255, 255, 0.1)'),
                            border: style.borderWidth ? `${style.borderWidth}px ${style.borderStyle || 'solid'} ${style.borderColor || 'transparent'}` : `1px solid ${style.borderColor || 'rgba(255, 255, 255, 0.2)'}`,
                            color: style.color || 'white',
                            padding: style.padding ? `${style.padding}px` : '8px 16px',
                            borderRadius: style.borderRadius ? `${style.borderRadius}px` : '8px',
                            cursor: (isDisabled && isPreview) ? 'not-allowed' : 'pointer',
                            opacity: (isDisabled && isPreview) ? 0.3 : 1,
                            fontSize: style.fontSize ? `${style.fontSize}px` : '0.9rem',
                            fontWeight: style.fontWeight || 600,
                            fontFamily: style.fontFamily || 'inherit',
                            transition: 'all 0.2s ease',
                            width: style.width ? (typeof style.width === 'number' ? `${style.width}px` : style.width) : 'fit-content',
                            flex: style.flex || 'none',
                            height: 'fit-content',
                            whiteSpace: 'nowrap',
                            minWidth: style.minWidth ? (typeof style.minWidth === 'number' ? `${style.minWidth}px` : style.minWidth) : '100px'
                        }}
                    >
                        {(action === 'PREVIOUS' || action === 'START') && !style.hideIcon && Icon && <Icon size={style.iconSize || 16} />}
                        {component.label || defaultLabel}
                        {(action === 'NEXT' || action === 'END') && !style.hideIcon && Icon && <Icon size={style.iconSize || 16} />}
                    </button>
                );
            }

            case 'PARAGRAPH': {
                const style = component.style || {};
                const hasCustomStyle = style.fontFamily || style.color;
                return (
                    <div
                        data-custom-text-style={hasCustomStyle ? "true" : undefined}
                        style={{
                            fontSize: style.fontSize ? `${style.fontSize}px` : '1.1rem',
                            lineHeight: '1.7',
                            color: style.color || 'rgba(255,255,255,0.9)',
                            textAlign: style.textAlign || 'left',
                            width: '100%',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                            fontFamily: style.fontFamily || 'inherit',
                            backgroundColor: style.backgroundColor || 'transparent',
                            border: style.borderWidth ? `${style.borderWidth}px ${style.borderStyle || 'solid'} ${style.borderColor || 'transparent'}` : 'none',
                            borderRadius: style.borderRadius ? `${style.borderRadius}px` : '0',
                            padding: style.padding ? `${style.padding}px` : '0'
                        }}
                        dangerouslySetInnerHTML={{ __html: component.content?.replace(/\n/g, '<br/>') }}
                    />
                );
            }

            case 'VIDEO': {
                const isYouTube = component.videoType === 'youtube' || (component.url?.includes('youtube.com') || component.url?.includes('youtu.be'));
                const getEmbedUrl = (url) => {
                    if (!url) return '';
                    if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
                    if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
                    return url;
                };
                return (
                    <div style={{ width: '100%', borderRadius: '20px', overflow: 'hidden', background: '#000', border: '1px solid var(--glass-border)' }}>
                        {isYouTube ? (
                            <iframe
                                src={getEmbedUrl(component.url)}
                                style={{ width: '100%', aspectRatio: '16/9', border: 'none' }}
                                allowFullScreen
                            />
                        ) : (
                            <video src={component.url} controls style={{ width: '100%', aspectRatio: '16/9' }} />
                        )}
                    </div>
                );
            }

            case 'CHOICE_MULTI':
            case 'CHOICE': {
                const isMulti = component.type === 'CHOICE_MULTI';
                return (
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(123, 97, 255, 0.1)' }}>
                                    {isMulti ? <CheckCircle2 size={18} style={{ color: 'var(--noor-secondary)' }} /> : <ListChecks size={18} style={{ color: 'var(--noor-secondary)' }} />}
                                </div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{component.instruction || (isMulti ? "Sélectionnez les bonnes réponses" : "Choisissez la bonne réponse")}</h3>
                            </div>
                            {component.title && <p style={{ color: 'var(--text-secondary)', marginLeft: '34px', fontSize: '0.9rem' }}>{component.title}</p>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: (columns || 12) > 6 ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr', gap: '10px' }}>
                            {(component.options || []).map((opt, i) => {
                                const isSelected = isMulti ? !!userAnswers[i] : selectedOption === i;
                                const showCorrect = isAnswered && opt.isCorrect;
                                const showWrong = isAnswered && isSelected && !opt.isCorrect;
                                return (
                                    <motion.div
                                        key={i}
                                        whileHover={!isAnswered ? { scale: 1.01, background: 'rgba(255,255,255,0.04)' } : {}}
                                        onClick={() => {
                                            if (isAnswered) return;
                                            if (isMulti) {
                                                setUserAnswers({ ...userAnswers, [i]: !userAnswers[i] });
                                            } else {
                                                setSelectedOption(i);
                                            }
                                        }}
                                        style={{
                                            padding: '14px 18px', borderRadius: '14px', fontSize: '0.95rem', fontWeight: 600, cursor: isAnswered ? 'default' : 'pointer', transition: 'all 0.2s',
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            background: showCorrect ? 'rgba(46, 213, 115, 0.1)' : showWrong ? 'rgba(255, 71, 87, 0.1)' : isSelected ? 'rgba(123, 97, 255, 0.15)' : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${showCorrect ? '#2ed573' : showWrong ? '#ff4757' : isSelected ? 'var(--noor-secondary)' : 'var(--glass-border)'}`,
                                            color: showCorrect ? '#2ed573' : showWrong ? '#ff4757' : 'white'
                                        }}
                                    >
                                        <div style={{ width: '18px', height: '18px', borderRadius: isMulti ? '4px' : '50%', border: '2px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {isSelected && (isMulti ? <Check size={12} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />)}
                                        </div>
                                        {opt.text}
                                    </motion.div>
                                );
                            })}
                        </div>
                        {renderActionButtons()}
                    </div>
                );
            }

            case 'TRUE_FALSE':
                return (
                    <div style={{ width: '100%', textAlign: 'center' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '10px' }}>{component.instruction || "Vrai ou Faux ?"}</h3>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                                <p style={{ fontSize: '1.1rem', color: 'white', fontWeight: 500 }}>{component.question}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                            {['VRAI', 'FAUX'].map((val) => {
                                const isSelected = selectedOption === val;
                                const showCorrect = isAnswered && component.correctAnswer === val;
                                const showWrong = isAnswered && isSelected && component.correctAnswer !== val;
                                return (
                                    <motion.button
                                        key={val}
                                        whileHover={!isAnswered ? { scale: 1.05 } : {}}
                                        onClick={() => handleTrueFalseClick(val)}
                                        style={{
                                            width: '100px', aspectRatio: '1/1', borderRadius: '20px', fontSize: '1rem', fontWeight: 900, cursor: isAnswered ? 'default' : 'pointer',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            padding: '12px',
                                            background: showCorrect ? 'rgba(46, 213, 115, 0.1)' : showWrong ? 'rgba(255, 71, 87, 0.1)' : isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                                            border: `2px solid ${showCorrect ? '#2ed573' : showWrong ? '#ff4757' : isSelected ? 'white' : 'var(--glass-border)'}`,
                                            color: showCorrect ? '#2ed573' : showWrong ? '#ff4757' : val === 'VRAI' ? '#2ed573' : '#ff4757'
                                        }}
                                    >
                                        {val === 'VRAI' ? <Check size={32} /> : <X size={32} />}
                                        <span style={{ fontSize: '0.8rem' }}>{val}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                        {renderActionButtons()}
                    </div>
                );

            case 'GAMEMEMO':
                return <GameMemo component={component} />;

            case 'GAP_FILL': {
                const gapParts = (component.content || "").split(/(\[[^\]]+\])/g);
                return (
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(123, 97, 255, 0.1)' }}>
                                <Type size={18} style={{ color: 'var(--noor-secondary)' }} />
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{component.instruction || "Complétez le texte"}</h3>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.01)', padding: '24px', borderRadius: '18px', border: '1px solid var(--glass-border)', fontSize: '1.1rem', lineHeight: '2' }}>
                            {gapParts.map((part, i) => {
                                if (part.startsWith('[') && part.endsWith(']')) {
                                    const answer = part.slice(1, -1);
                                    const userVal = userAnswers[i] || '';
                                    const isCorrect = userVal.toLowerCase().trim() === answer.toLowerCase().trim();
                                    return (
                                        <input
                                            key={i}
                                            disabled={isAnswered}
                                            value={userVal}
                                            onChange={(e) => setUserAnswers({ ...userAnswers, [i]: e.target.value })}
                                            style={{
                                                width: `${Math.max(answer.length * 12, 60)}px`,
                                                margin: '0 6px',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                borderBottom: `2px solid ${isAnswered ? (isCorrect ? '#2ed573' : '#ff4757') : 'var(--noor-secondary)'}`,
                                                background: 'rgba(255,255,255,0.05)',
                                                border: 'none',
                                                color: isAnswered ? (isCorrect ? '#2ed573' : '#ff4757') : 'white',
                                                outline: 'none',
                                                fontWeight: 700,
                                                textAlign: 'center'
                                            }}
                                            placeholder="..."
                                        />
                                    );
                                }
                                return <span key={i}>{part}</span>;
                            })}
                        </div>
                        {renderActionButtons()}
                    </div>
                );
            }

            case 'DROPDOWN_TEXT': {
                const ddParts = (component.content || "").split(/(\[[^\]]+\])/g);
                return (
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(123, 97, 255, 0.1)' }}>
                                <Sliders size={18} style={{ color: 'var(--noor-secondary)' }} />
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{component.instruction || "Choisissez la bonne option"}</h3>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.01)', padding: '24px', borderRadius: '18px', border: '1px solid var(--glass-border)', fontSize: '1.1rem', lineHeight: '2.4' }}>
                            {ddParts.map((part, i) => {
                                if (part.startsWith('[') && part.endsWith(']')) {
                                    const options = part.slice(1, -1).split('|');
                                    const correctAnswer = options[0];
                                    const shuffled = interactionState[i] || options.sort(() => Math.random() - 0.5);
                                    if (!interactionState[i]) setInteractionState(prev => ({ ...prev, [i]: shuffled }));

                                    const userVal = userAnswers[i] || '';
                                    const isCorrect = userVal === correctAnswer;

                                    return (
                                        <select
                                            key={i}
                                            disabled={isAnswered}
                                            value={userVal}
                                            onChange={(e) => setUserAnswers({ ...userAnswers, [i]: e.target.value })}
                                            style={{
                                                margin: '0 6px',
                                                padding: '4px 12px',
                                                borderRadius: '10px',
                                                background: 'rgba(255,255,255,0.06)',
                                                border: `1px solid ${isAnswered ? (isCorrect ? '#2ed573' : '#ff4757') : 'var(--glass-border)'}`,
                                                color: isAnswered ? (isCorrect ? '#2ed573' : '#ff4757') : 'white',
                                                fontWeight: 700,
                                                outline: 'none',
                                                cursor: 'pointer',
                                                fontSize: '1rem'
                                            }}
                                        >
                                            <option value="">...</option>
                                            {shuffled.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    );
                                }
                                return <span key={i}>{part}</span>;
                            })}
                        </div>
                        {renderActionButtons()}
                    </div>
                );
            }


            case 'DRAG_DROP': {
                const ddItems = component.items || [];
                const ddCats = component.categories || [];
                return (
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(123, 97, 255, 0.1)' }}>
                                <Layers size={18} style={{ color: 'var(--noor-secondary)' }} />
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{component.instruction || "Triez les éléments par catégorie"}</h3>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '16px' }}>
                            {ddItems.map((item) => (
                                <div
                                    key={item.id}
                                    style={{
                                        padding: '6px 14px', borderRadius: '10px', background: 'var(--noor-secondary)', color: 'white', fontWeight: 700, fontSize: '0.85rem',
                                        opacity: userAnswers[item.id] ? 0.3 : 1
                                    }}
                                >
                                    {item.text}
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(ddCats.length, 3)}, 1fr)`, gap: '12px' }}>
                            {ddCats.map(cat => (
                                <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ padding: '8px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--noor-secondary)', border: '1px solid var(--glass-border)' }}>
                                        {cat.title}
                                    </div>
                                    <div style={{ minHeight: '100px', padding: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px dashed var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {ddItems.filter(item => userAnswers[item.id] === cat.id).map(item => (
                                            <div key={item.id} style={{
                                                padding: '6px 10px', borderRadius: '6px', background: 'rgba(123, 97, 255, 0.15)', border: '1px solid var(--noor-secondary)', fontSize: '0.75rem', textAlign: 'center',
                                                borderColor: isAnswered ? (item.categoryId === cat.id ? '#2ed573' : '#ff4757') : 'var(--noor-secondary)'
                                            }}>
                                                {item.text}
                                            </div>
                                        ))}
                                        {!isAnswered && (
                                            <select
                                                className="input-field"
                                                style={{ fontSize: '0.7rem', padding: '4px' }}
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        setUserAnswers({ ...userAnswers, [e.target.value]: cat.id });
                                                    }
                                                }}
                                                value=""
                                            >
                                                <option value="">+</option>
                                                {ddItems.filter(item => !userAnswers[item.id]).map(item => (
                                                    <option key={item.id} value={item.id}>{item.text}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {renderActionButtons()}
                    </div>
                );
            }

            case 'DROPDOWN_TEXT': {
                const sentences = component.sentences || [];
                const currentAnswers = userAnswers.answers || {};

                return (
                    <div style={{ width: '100%', direction: 'rtl', textAlign: 'right', padding: '20px' }}>
                        {/* Header with blue underline */}
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', marginBottom: '16px', fontFamily: 'Outfit, sans-serif' }}>
                                {component.instruction || "أَخْتارُ الْكَلِمَةَ الْمُنَاسِبَةَ لِكُلِّ جُمْلَةٍ :"}
                            </h3>
                            <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', background: 'rgba(123, 97, 255, 0.3)' }} />
                                <div style={{ position: 'absolute', top: 0, right: 0, width: '15%', height: '100%', background: 'var(--noor-secondary)' }} />
                            </div>
                        </div>

                        {/* Sentences as cards (Clear style like Image 0) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                            {sentences.map((sentence, sIdx) => (
                                <motion.div
                                    key={sIdx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: sIdx * 0.1 }}
                                    style={{
                                        padding: '28px 40px',
                                        background: 'rgba(255,255,255,0.03)', // Léger pour le mode sombre mais structure card
                                        borderRadius: '24px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '12px',
                                        fontSize: '1.4rem',
                                        lineHeight: '2.2',
                                        color: '#ecf0f1',
                                        fontFamily: 'Outfit, sans-serif'
                                    }}
                                >
                                    {(sentence.segments || []).map((segment, segIdx) => {
                                        const globalIdx = `${sIdx}-${segIdx}`;
                                        if (segment.type === 'text') {
                                            return <span key={segIdx}>{segment.content}</span>;
                                        } else {
                                            const selected = currentAnswers[globalIdx];
                                            const isCorrect = isAnswered && selected === segment.correctAnswer;
                                            const isWrong = isAnswered && selected !== segment.correctAnswer;

                                            return (
                                                <div key={segIdx} style={{ position: 'relative', display: 'inline-block', margin: '0 4px' }}>
                                                    <select
                                                        disabled={isAnswered}
                                                        value={selected || ''}
                                                        onChange={(e) => setUserAnswers({
                                                            answers: { ...currentAnswers, [globalIdx]: e.target.value }
                                                        })}
                                                        style={{
                                                            minWidth: '150px',
                                                            padding: '8px 24px',
                                                            borderRadius: '12px',
                                                            background: isAnswered ? (isCorrect ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 71, 87, 0.15)') : 'rgba(255,255,255,0.05)',
                                                            border: `2px solid ${isAnswered ? (isCorrect ? '#2ed573' : '#ff4757') : 'rgba(255,255,255,0.1)'}`,
                                                            color: 'white',
                                                            fontWeight: 700,
                                                            fontSize: '1.1rem',
                                                            cursor: isAnswered ? 'default' : 'pointer',
                                                            outline: 'none',
                                                            appearance: 'none',
                                                            textAlign: 'center',
                                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                        }}
                                                    >
                                                        <option value="">---</option>
                                                        {(segment.options || []).map((opt, i) => (
                                                            <option key={i} value={opt} style={{ background: '#1a1a2e', color: 'white' }}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            );
                                        }
                                    })}
                                </motion.div>
                            ))}
                        </div>

                        {/* Action Box with Green Button */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    if (isAnswered) {
                                        setUserAnswers({});
                                        setIsAnswered(false);
                                    } else {
                                        setIsAnswered(true);
                                    }
                                }}
                                style={{
                                    background: isAnswered ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #44bd32, #2ecc71)',
                                    color: 'white',
                                    padding: '18px 80px',
                                    borderRadius: '50px',
                                    border: 'none',
                                    fontSize: '1.2rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    boxShadow: isAnswered ? 'none' : '0 10px 30px rgba(68, 189, 50, 0.4)',
                                    fontFamily: 'Outfit, sans-serif'
                                }}
                            >
                                {isAnswered ? <RefreshCcw size={22} /> : <CheckCircle2 size={22} />}
                                {isAnswered ? "إعادة المحاولة" : "تحقق من الإجابة"}
                            </motion.button>
                        </div>
                    </div>
                );
            }

            case 'DROPDOWN_QUESTION': {
                return (
                    <div style={{ width: '100%' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px' }}>{component.question}</h3>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <select
                                    disabled={isAnswered}
                                    className="input-field"
                                    style={{ flex: 1, fontSize: '1rem', height: '50px', padding: '0 20px' }}
                                    value={selectedOption || ''}
                                    onChange={(e) => setSelectedOption(e.target.value)}
                                >
                                    <option value="">Sélectionnez...</option>
                                    {(component.options || []).map((o, idx) => <option key={idx} value={o}>{o}</option>)}
                                </select>
                                {isAnswered && (
                                    <div style={{ color: selectedOption === component.correctAnswer ? '#2ed573' : '#ff4757' }}>
                                        {selectedOption === component.correctAnswer ? <CheckCircle2 size={24} /> : <X size={24} />}
                                    </div>
                                )}
                            </div>
                        </div>
                        {renderActionButtons()}
                    </div>
                );
            }

            case 'STORY': {
                return (
                    <div ref={containerRef} style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: '20px', position: 'relative', background: 'black' }}>
                        {component.url ? (
                            <>
                                <iframe
                                    src={component.url}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                    title={component.title || 'Contenu'}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                                <button
                                    onClick={toggleFullscreen}
                                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '8px', borderRadius: '10px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem' }}
                                >
                                    <Maximize2 size={14} /> Plein écran
                                </button>
                            </>
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                <LinkIcon size={40} style={{ opacity: 0.2, marginBottom: '15px' }} />
                                <h3>Aucune URL</h3>
                            </div>
                        )}
                    </div>
                );
            }


            case 'SOURCE_LIST': {
                return (
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(123, 97, 255, 0.1)' }}>
                                <Layout size={18} style={{ color: 'var(--noor-secondary)' }} />
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{component.instruction || "Liste source"}</h3>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                            {(component.items || []).map((it, i) => (
                                <motion.div
                                    key={i}
                                    drag={isPreview}
                                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                    dragElastic={0.1}
                                    onDragStart={() => setDraggedItem(it)}
                                    onDragEnd={() => setDraggedItem(null)}
                                    whileHover={isPreview ? { y: -2, scale: 1.05 } : {}}
                                    whileDrag={{ scale: 1.1, zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.4)' }}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, var(--noor-secondary), #5a4ad1)',
                                        color: 'white',
                                        fontWeight: 800,
                                        fontSize: '0.85rem',
                                        cursor: isPreview ? 'grab' : 'default',
                                        boxShadow: '0 4px 15px rgba(123, 97, 255, 0.3)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    {it}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );
            }

            case 'DROP_ZONE': {
                const droppedValue = userAnswers.dropped || null;
                const isCorrectZone = isAnswered && droppedValue === component.expected;
                const isWrongZone = isAnswered && droppedValue !== null && droppedValue !== component.expected;

                return (
                    <div
                        onMouseUp={() => {
                            if (isPreview && activeDraggedItem && !isAnswered) {
                                setUserAnswers({ dropped: activeDraggedItem });
                            }
                        }}
                        style={{ width: '100%', minHeight: '60px' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{component.instruction || "Zone de dépôt"}</h4>
                        </div>
                        <div style={{
                            width: '100%',
                            minHeight: '64px',
                            borderRadius: '16px',
                            background: droppedValue ? 'rgba(123, 97, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                            border: `2px dashed ${isCorrectZone ? '#2ed573' : isWrongZone ? '#ff4757' : (droppedValue ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.1)')}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {droppedValue ? (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    style={{
                                        padding: '8px 20px',
                                        borderRadius: '10px',
                                        background: 'var(--noor-secondary)',
                                        color: 'white',
                                        fontWeight: 800,
                                        fontSize: '0.9rem',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    {droppedValue}
                                    {!isAnswered && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setUserAnswers({}); }}
                                            style={{ marginLeft: '10px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.7 }}
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </motion.div>
                            ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{component.label || "Déposer ici"}</span>
                            )}

                            {isAnswered && (
                                <div style={{ position: 'absolute', right: '12px', color: isCorrectZone ? '#2ed573' : '#ff4757' }}>
                                    {isCorrectZone ? <CheckCircle2 size={20} /> : <X size={20} />}
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            case 'HOTSPOTS':
                return (
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(123, 97, 255, 0.1)' }}>
                                <Target size={18} style={{ color: 'var(--noor-secondary)' }} />
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{component.instruction || "Image Interactive"}</h3>
                        </div>
                        <div style={{ position: 'relative', width: '100%', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--glass-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                            {component.image ? (
                                <>
                                    <img src={component.image} style={{ width: '100%', display: 'block' }} alt="Background" />
                                    {(component.spots || []).map((spot, i) => (
                                        <div key={i} style={{ position: 'absolute', left: `${spot.x}%`, top: `${spot.y}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                                            <motion.div
                                                animate={{ scale: [1, 1.3, 1] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                                onClick={() => setInteractionState(prev => ({ ...prev, activeSpot: prev.activeSpot === i ? null : i }))}
                                                style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--noor-secondary)', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px var(--noor-secondary)' }}
                                            >
                                                <Plus size={14} color="white" />
                                            </motion.div>

                                            <AnimatePresence>
                                                {interactionState.activeSpot === i && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: '35px',
                                                            left: '50%',
                                                            transform: 'translateX(-50%)',
                                                            width: '240px',
                                                            padding: '20px',
                                                            background: 'rgba(20, 20, 30, 0.95)',
                                                            backdropFilter: 'blur(15px)',
                                                            borderRadius: '16px',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            zIndex: 100,
                                                            boxShadow: '0 15px 35px rgba(0,0,0,0.5)'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                                            <h4 style={{ color: 'var(--noor-secondary)', fontWeight: 800, fontSize: '0.9rem' }}>{spot.title}</h4>
                                                            <button onClick={() => setInteractionState(prev => ({ ...prev, activeSpot: null }))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
                                                        </div>
                                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5 }}>{spot.content}</p>
                                                        <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: '16px', height: '16px', background: 'rgba(20, 20, 30, 0.95)', borderRight: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }} />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                    <ImageIcon size={48} style={{ opacity: 0.1, marginBottom: '15px' }} />
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aucune image sélectionnée</p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'TIMELINE':
                return (
                    <div style={{ width: '100%', padding: '20px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
                            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(123, 97, 255, 0.1)' }}>
                                <Activity size={18} style={{ color: 'var(--noor-secondary)' }} />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{component.instruction || "Frise Chronologique"}</h3>
                        </div>

                        <div style={{ position: 'relative', paddingLeft: '40px' }}>
                            {/* Vertical Line */}
                            <div style={{ position: 'absolute', left: '19px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom, var(--noor-secondary), rgba(123, 97, 255, 0.1))', borderRadius: '1px' }} />

                            {(component.events || []).map((ev, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{ position: 'relative', marginBottom: '30px' }}
                                >
                                    {/* Dot */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '-26px',
                                        top: '4px',
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        background: 'var(--noor-secondary)',
                                        border: '3px solid #1a1a2e',
                                        zIndex: 2,
                                        boxShadow: '0 0 10px var(--noor-secondary)'
                                    }} />

                                    <div style={{
                                        padding: '16px 20px',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '16px',
                                        border: '1px solid var(--glass-border)',
                                        backdropFilter: 'blur(10px)',
                                        boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                                    }}>
                                        <span style={{
                                            display: 'inline-block',
                                            background: 'rgba(123, 97, 255, 0.15)',
                                            color: 'var(--noor-secondary)',
                                            padding: '2px 10px',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            marginBottom: '8px'
                                        }}>
                                            {ev.date}
                                        </span>
                                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', marginBottom: '6px' }}>{ev.title}</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ev.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );

            case 'TEXT_SELECT': {
                const words = (component.content || "").split(' ');
                return (
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(123, 97, 255, 0.1)' }}>
                                <CheckCircle2 size={18} style={{ color: 'var(--noor-secondary)' }} />
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{component.instruction || "Cliquez sur les mots correspondants"}</h3>
                        </div>
                        <div style={{
                            padding: '24px',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '16px',
                            border: '1px solid var(--glass-border)',
                            lineHeight: 2,
                            fontSize: '1.1rem'
                        }}>
                            {words.map((word, i) => {
                                const cleanWord = word.replace(/[.,!?;:]/g, '');
                                const isTarget = (component.selections || []).includes(cleanWord);
                                const isSelected = !!userAnswers[i];
                                const isCorrect = isAnswered && isSelected && isTarget;
                                const isWrong = isAnswered && isSelected && !isTarget;
                                const isMissing = isAnswered && !isSelected && isTarget;

                                return (
                                    <span key={i} style={{ display: 'inline-block', marginRight: '6px' }}>
                                        <motion.button
                                            whileHover={!isAnswered ? { scale: 1.05, background: 'rgba(255,255,255,0.05)' } : {}}
                                            onClick={() => {
                                                if (isAnswered) return;
                                                setUserAnswers({ ...userAnswers, [i]: !userAnswers[i] });
                                            }}
                                            style={{
                                                background: isCorrect ? 'rgba(46, 213, 115, 0.2)' : isWrong ? 'rgba(255, 71, 87, 0.2)' : isMissing ? 'rgba(255, 159, 67, 0.2)' : isSelected ? 'rgba(123, 97, 255, 0.2)' : 'transparent',
                                                border: `1px solid ${isCorrect ? '#2ed573' : isWrong ? '#ff4757' : isMissing ? '#ff9f43' : isSelected ? 'var(--noor-secondary)' : 'transparent'}`,
                                                borderRadius: '6px',
                                                padding: '0 4px',
                                                color: isCorrect ? '#2ed573' : isWrong ? '#ff4757' : isMissing ? '#ff9f43' : 'inherit',
                                                cursor: isAnswered ? 'default' : 'pointer',
                                                fontWeight: isSelected || isMissing ? 700 : 400,
                                                fontSize: 'inherit',
                                                fontFamily: 'inherit',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {word}
                                        </motion.button>
                                    </span>
                                );
                            })}
                        </div>
                        {renderActionButtons()}
                    </div>
                );
            }

            case 'FREE_TEXT': {
                const learnerInput = userAnswers.feedback || "";
                const isCorrectFree = isAnswered && learnerInput.toLowerCase().trim() === (component.expected || "").toLowerCase().trim();
                return (
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(123, 97, 255, 0.1)' }}>
                                <PenTool size={18} style={{ color: 'var(--noor-secondary)' }} />
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{component.instruction || "Saisissez votre réponse"}</h3>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="input-field"
                                disabled={isAnswered}
                                placeholder="Tapez ici..."
                                style={{
                                    width: '100%',
                                    height: '60px',
                                    fontSize: '1.1rem',
                                    padding: '0 20px',
                                    border: isAnswered ? `2px solid ${isCorrectFree ? '#2ed573' : '#ff4757'}` : '1px solid var(--glass-border)',
                                    background: isAnswered ? (isCorrectFree ? 'rgba(46, 213, 115, 0.05)' : 'rgba(255, 71, 87, 0.05)') : ''
                                }}
                                value={learnerInput}
                                onChange={(e) => setUserAnswers({ feedback: e.target.value })}
                            />
                            {isAnswered && (
                                <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: isCorrectFree ? '#2ed573' : '#ff4757' }}>
                                    {isCorrectFree ? <CheckCircle2 size={24} /> : <X size={24} />}
                                </div>
                            )}
                        </div>
                        {isAnswered && !isCorrectFree && component.expected && (
                            <p style={{ marginTop: '10px', fontSize: '0.85rem', color: '#2ed573', fontWeight: 600 }}>
                                Réponse attendue : {component.expected}
                            </p>
                        )}
                        {renderActionButtons()}
                    </div>
                );
            }

            case 'MATCHING_PAIRS': {
                const pairs = component.pairs || [];
                const leftSide = pairs.map(p => p.left);
                // Persist the shuffle in interactionState
                const rightSide = interactionState.shuffledRight || Array.from(new Set(pairs.map(p => p.right))).sort(() => Math.random() - 0.5);
                if (!interactionState.shuffledRight) setInteractionState(prev => ({ ...prev, shuffledRight: rightSide }));

                const selectedLeft = userAnswers.leftIdx !== undefined ? userAnswers.leftIdx : null;
                const matches = userAnswers.matches || [];

                return (
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(123, 97, 255, 0.1)' }}>
                                <Grid size={18} style={{ color: 'var(--noor-secondary)' }} />
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{component.instruction || "Reliez les bonnes paires"}</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {leftSide.map((text, i) => {
                                    const isMatched = matches.some(m => m.leftIdx === i);
                                    return (
                                        <motion.div
                                            key={i}
                                            onClick={() => !isAnswered && !isMatched && setUserAnswers({ ...userAnswers, leftIdx: i })}
                                            style={{
                                                padding: '12px 16px', borderRadius: '12px', background: selectedLeft === i ? 'rgba(123, 97, 255, 0.2)' : isMatched ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${selectedLeft === i ? 'var(--noor-secondary)' : 'var(--glass-border)'}`,
                                                cursor: isAnswered || isMatched ? 'default' : 'pointer',
                                                opacity: isMatched ? 0.5 : 1,
                                                fontSize: '0.9rem', fontWeight: 600
                                            }}
                                        >
                                            {text}
                                        </motion.div>
                                    );
                                })}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {rightSide.map((text, i) => {
                                    const isMatched = matches.some(m => m.rightText === text);
                                    return (
                                        <motion.div
                                            key={i}
                                            onClick={() => {
                                                if (isAnswered || isMatched || selectedLeft === null) return;
                                                setUserAnswers({
                                                    ...userAnswers,
                                                    leftIdx: undefined,
                                                    matches: [...matches, { leftIdx: selectedLeft, leftText: leftSide[selectedLeft], rightText: text }]
                                                });
                                            }}
                                            style={{
                                                padding: '12px 16px', borderRadius: '12px', background: isMatched ? 'rgba(123, 97, 255, 0.1)' : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${isMatched ? 'var(--noor-secondary)' : 'var(--glass-border)'}`,
                                                cursor: isAnswered || isMatched || selectedLeft === null ? 'default' : 'pointer',
                                                opacity: isMatched ? 0.5 : 1,
                                                fontSize: '0.9rem', fontWeight: 600
                                            }}
                                        >
                                            {text}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                        {matches.length > 0 && (
                            <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {matches.map((m, i) => {
                                    const isCorrect = isAnswered && component.pairs.find(p => p.left === m.leftText)?.right === m.rightText;
                                    return (
                                        <div key={i} style={{
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', background: isCorrect ? 'rgba(46, 213, 115, 0.1)' : isAnswered ? 'rgba(255, 71, 87, 0.1)' : 'rgba(123, 97, 255, 0.1)',
                                            border: `1px solid ${isCorrect ? '#2ed573' : isAnswered ? '#ff4757' : 'var(--noor-secondary)'}`, display: 'flex', alignItems: 'center', gap: '6px'
                                        }}>
                                            {m.leftText} <ArrowRight size={10} /> {m.rightText}
                                            {!isAnswered && <X size={12} style={{ cursor: 'pointer' }} onClick={() => setUserAnswers({ ...userAnswers, matches: matches.filter((_, idx) => idx !== i) })} />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {renderActionButtons()}
                    </div>
                );
            }

            case 'ORDERING': {
                const orderedItems = userAnswers.orderedItems || component.items.map((it, idx) => ({ id: it.id || idx, text: it.text || it }));
                return (
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(123, 97, 255, 0.1)' }}>
                                <ArrowDownUp size={18} style={{ color: 'var(--noor-secondary)' }} />
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{component.instruction || "Mettez les éléments dans le bon ordre"}</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {orderedItems.map((item, i) => {
                                const isCorrect = isAnswered && (component.items[i].text || component.items[i]) === item.text;
                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        style={{
                                            padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${isAnswered ? (isCorrect ? '#2ed573' : '#ff4757') : 'var(--glass-border)'}`,
                                            display: 'flex', alignItems: 'center', gap: '12px'
                                        }}
                                    >
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>{i + 1}</div>
                                        <div style={{ flex: 1, fontSize: '0.9rem' }}>{item.text}</div>
                                        {!isAnswered && (
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button disabled={i === 0} onClick={() => {
                                                    const newItems = [...orderedItems];[newItems[i - 1], newItems[i]] = [newItems[i], newItems[i - 1]];
                                                    setUserAnswers({ orderedItems: newItems });
                                                }} style={{ background: 'none', border: 'none', color: 'white', opacity: i === 0 ? 0.2 : 0.6 }}><ArrowUp size={14} /></button>
                                                <button disabled={i === orderedItems.length - 1} onClick={() => {
                                                    const newItems = [...orderedItems];[newItems[i + 1], newItems[i]] = [newItems[i], newItems[i + 1]];
                                                    setUserAnswers({ orderedItems: newItems });
                                                }} style={{ background: 'none', border: 'none', color: 'white', opacity: i === orderedItems.length - 1 ? 0.2 : 0.6 }}><ArrowDown size={14} /></button>
                                            </div>
                                        )}
                                        {isAnswered && (isCorrect ? <CheckCircle2 size={16} color="#2ed573" /> : <X size={16} color="#ff4757" />)}
                                    </motion.div>
                                );
                            })}
                        </div>
                        {renderActionButtons()}
                    </div>
                );
            }

            case 'CONNECTING': {
                const leftItems = component.left || [];
                const rightItems = component.right || [];
                const activeLeft = userAnswers.activeLeft !== undefined ? userAnswers.activeLeft : null;
                const connections = userAnswers.connections || [];

                return (
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(123, 97, 255, 0.1)' }}>
                                <Share2 size={18} style={{ color: 'var(--noor-secondary)' }} />
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{component.instruction || "Reliez les éléments correspondants"}</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', position: 'relative' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {leftItems.map((txt, i) => {
                                    const connected = connections.some(c => c.leftIdx === i);
                                    return (
                                        <div key={i} style={{ position: 'relative' }}>
                                            <motion.button
                                                onClick={() => !isAnswered && setUserAnswers({ ...userAnswers, activeLeft: i })}
                                                style={{
                                                    width: '100%', padding: '12px', borderRadius: '12px', background: activeLeft === i ? 'rgba(123, 97, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                                                    border: `2px solid ${activeLeft === i ? 'var(--noor-secondary)' : 'var(--glass-border)'}`,
                                                    textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'white', cursor: isAnswered ? 'default' : 'pointer'
                                                }}
                                            >
                                                {txt}
                                            </motion.button>
                                            {connected && <div style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--noor-secondary)' }} />}
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {rightItems.map((txt, i) => {
                                    const connected = connections.some(c => c.rightIdx === i);
                                    return (
                                        <div key={i} style={{ position: 'relative' }}>
                                            <motion.button
                                                onClick={() => {
                                                    if (isAnswered || activeLeft === null) return;
                                                    const existing = connections.findIndex(c => c.leftIdx === activeLeft);
                                                    let newConnections = [...connections];
                                                    if (existing !== -1) newConnections[existing] = { leftIdx: activeLeft, rightIdx: i };
                                                    else newConnections.push({ leftIdx: activeLeft, rightIdx: i });
                                                    setUserAnswers({ ...userAnswers, activeLeft: undefined, connections: newConnections });
                                                }}
                                                style={{
                                                    width: '100%', padding: '12px', borderRadius: '12px', background: connected ? 'rgba(123, 97, 255, 0.1)' : 'rgba(255,255,255,0.05)',
                                                    border: `2px solid ${connected ? 'var(--noor-secondary)' : 'var(--glass-border)'}`,
                                                    textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'white', cursor: isAnswered || activeLeft === null ? 'default' : 'pointer'
                                                }}
                                            >
                                                {txt}
                                            </motion.button>
                                            {connected && <div style={{ position: 'absolute', left: '-12px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--noor-secondary)' }} />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {isAnswered && (
                            <div style={{ marginTop: '20px', padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '10px', color: 'var(--noor-secondary)' }}>Résultats :</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {connections.map((c, i) => (
                                        <div key={i} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span>{leftItems[c.leftIdx]}</span>
                                            <ArrowRight size={12} />
                                            <span>{rightItems[c.rightIdx]}</span>
                                            <CheckCircle2 size={14} color="#2ed573" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {renderActionButtons()}
                    </div>
                );
            }

            case 'IMAGE_CLICK': {
                const clickedTargets = userAnswers.clickedTargets || [];
                return (
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(123, 97, 255, 0.1)' }}>
                                <MousePointer2 size={18} style={{ color: 'var(--noor-secondary)' }} />
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{component.instruction || "Cliquez sur les zones demandées"}</h3>
                        </div>
                        <div style={{ position: 'relative', width: '100%', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                            {component.image ? (
                                <div
                                    onClick={(e) => {
                                        if (isAnswered) return;
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                                        const y = ((e.clientY - rect.top) / rect.height) * 100;

                                        // Find if we clicked a target
                                        const hit = (component.targetAreas || []).find(t => {
                                            const dist = Math.sqrt(Math.pow(t.x - x, 2) + Math.pow(t.y - y, 2));
                                            return dist < 8; // 8% radius threshold
                                        });

                                        if (hit && !clickedTargets.includes(hit.label)) {
                                            setUserAnswers({ clickedTargets: [...clickedTargets, hit.label] });
                                        }
                                    }}
                                    style={{ cursor: isAnswered ? 'default' : 'crosshair' }}
                                >
                                    <img src={component.image} style={{ width: '100%', display: 'block' }} alt="Interactive" />
                                    {(component.targetAreas || []).map((t, i) => {
                                        const isClicked = clickedTargets.includes(t.label);
                                        return (
                                            <div
                                                key={i}
                                                style={{
                                                    position: 'absolute', left: `${t.x}%`, top: `${t.y}%`,
                                                    width: '30px', height: '30px', transform: 'translate(-50%, -50%)',
                                                    borderRadius: '50%', border: isAnswered || isClicked ? '2px solid' : 'none',
                                                    borderColor: isAnswered ? '#2ed573' : 'var(--noor-secondary)',
                                                    background: isClicked ? 'rgba(123, 97, 255, 0.3)' : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.2s', zIndex: 5
                                                }}
                                            >
                                                {(isAnswered || isClicked) && <CheckCircle2 size={16} color={isAnswered ? '#2ed573' : 'white'} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                    <ImageIcon size={32} style={{ opacity: 0.1, marginBottom: '10px' }} />
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Aucune image</p>
                                </div>
                            )}
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {(component.targetAreas || []).map((t, i) => (
                                <div key={i} style={{
                                    padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem',
                                    background: clickedTargets.includes(t.label) ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.05)',
                                    color: clickedTargets.includes(t.label) ? 'white' : 'var(--text-muted)',
                                    border: '1px solid var(--glass-border)', transition: 'all 0.3s'
                                }}>
                                    {t.label}
                                </div>
                            ))}
                        </div>
                        {renderActionButtons()}
                    </div>
                );
            }

            case 'DRAG_DROP_IMAGE': {
                const labels = component.draggableLabels || [];
                const zones = component.dropZones || [];
                const dropped = userAnswers.dropped || {}; // Map of zoneIndex -> label

                return (
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(123, 97, 255, 0.1)' }}>
                                <Layers size={18} style={{ color: 'var(--noor-secondary)' }} />
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{component.instruction || "Associez les étiquettes aux images"}</h3>
                        </div>

                        {/* Réservoir d'étiquettes */}
                        {!isAnswered && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
                                {labels.filter(label => !Object.values(dropped).includes(label)).map((label, idx) => (
                                    <motion.div
                                        key={idx}
                                        drag={isPreview}
                                        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                        dragElastic={0.1}
                                        onDragStart={() => setDraggedItem(label)}
                                        onDragEnd={() => setDraggedItem(null)}
                                        whileHover={{ y: -2, scale: 1.05 }}
                                        style={{
                                            padding: '8px 16px', background: 'var(--noor-secondary)', color: 'white',
                                            borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'grab',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        {label}
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Zones de dépôt */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px' }}>
                            {zones.map((zone, idx) => {
                                const currentLabel = dropped[idx];
                                const isCorrect = isAnswered && currentLabel === zone.answer;
                                const isWrong = isAnswered && currentLabel && currentLabel !== zone.answer;

                                return (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: '100%', aspectRatio: '1/1', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                                            <img src={zone.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                        </div>
                                        <div
                                            onMouseUp={() => { if (isPreview && activeDraggedItem && !isAnswered) setUserAnswers({ ...userAnswers, dropped: { ...dropped, [idx]: activeDraggedItem } }); }}
                                            style={{
                                                width: '100%', minHeight: '44px', borderRadius: '12px',
                                                background: currentLabel ? (isCorrect ? 'rgba(46, 213, 115, 0.1)' : isWrong ? 'rgba(255, 71, 87, 0.1)' : 'rgba(123, 97, 255, 0.1)') : 'rgba(255,255,255,0.03)',
                                                border: `2px dashed ${isCorrect ? '#2ed573' : isWrong ? '#ff4757' : (currentLabel ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.1)')}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', textAlign: 'center'
                                            }}
                                        >
                                            {currentLabel ? (
                                                <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isCorrect ? '#2ed573' : isWrong ? '#ff4757' : 'white' }}>{currentLabel}</span>
                                                    {!isAnswered && (
                                                        <X size={12} style={{ position: 'absolute', right: '0', cursor: 'pointer', opacity: 0.5 }} onClick={() => {
                                                            const newDropped = { ...dropped };
                                                            delete newDropped[idx];
                                                            setUserAnswers({ ...userAnswers, dropped: newDropped });
                                                        }} />
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>...</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {renderActionButtons()}
                    </div>
                );
            }

            case 'GAMEMEMO':
                return <GameMemo component={component} isPreview={isPreview} />;

            default:
                return null;
        }
    };

    return (
        <div ref={containerRef} style={{
            width: '100%',
            position: 'relative',
            boxSizing: 'border-box',
            maxWidth: '100%',
            overflowWrap: 'break-word',
            wordBreak: 'break-word'
        }}>
            {renderAddons(component.addons)}
            {renderContent()}
        </div>
    );
};

const BlockItem = ({ block, isPreview, blockIndex, isGlobal = false, onNavigate }) => {
    const {
        activeBlockIndex,
        setActiveBlockIndex,
        activeComponentIndex,
        setActiveComponentIndex
    } = useCourseStore();

    if (!block) return null;
    const columns = block.style?.columns || 12;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showStylePanel, setShowStylePanel] = useState(false);
    const addComponentToBlock = useCourseStore((state) => state.addComponentToBlock);
    const setBlockElements = useCourseStore((state) => state.setBlockElements);
    const moveComponentBetweenBlocks = useCourseStore((state) => state.moveComponentBetweenBlocks);
    const updateComponent = useCourseStore((state) => state.updateComponent);

    const isBlockSelected = !isPreview && activeBlockIndex === blockIndex && activeComponentIndex === null;

    const bStyle = block.style || {};
    const blockStyle = {
        minHeight: bStyle.minHeight === '100%' ? '100%' : (bStyle.minHeight || 'auto'),
        height: bStyle.minHeight && bStyle.minHeight !== 'auto' ? bStyle.minHeight : 'auto',
        background: bStyle.background || 'rgba(255,255,255,0.01)',
        border: bStyle.showBorder ? `1px solid ${bStyle.borderColor || 'rgba(123, 97, 255, 0.3)'}` : 'none',
        borderRadius: bStyle.borderRadius || '24px',
        padding: typeof bStyle.padding === 'number' ? `${bStyle.padding}px` : (bStyle.padding || (isGlobal ? '0' : '24px')),
        marginTop: typeof bStyle.margin === 'number' ? `${bStyle.margin}px` : (isGlobal ? '0' : '16px'),
        overflow: 'visible',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: block.style?.flexDirection || 'column',
        alignItems: block.style?.flexDirection === 'row' ? 'center' : 'stretch',
        justifyContent: block.style?.justifyContent || 'start',
        direction: block.style?.direction || 'ltr',
        gap: typeof block.style?.gap === 'number' ? `${block.style.gap}px` : '24px',
        alignSelf: block.style?.minHeight && block.style.minHeight !== 'auto' ? 'start' : 'stretch',
        outline: isBlockSelected ? '3px solid var(--noor-secondary)' : 'none',
        outlineOffset: '4px',
        boxShadow: isBlockSelected ? '0 0 0 8px rgba(123, 97, 255, 0.1), var(--shadow-lg)' : block.style?.showBorder ? '0 10px 30px -10px rgba(0,0,0,0.5)' : 'none',
        cursor: !isPreview ? 'pointer' : 'default',
        '--block-columns': columns
    };

    if (!block) {
        console.warn("BlockItem: block is null");
        return null;
    }
    // Support legacy blocks and new multi-component blocks
    const elements = (block.elements || (block.type ? [block] : [])).filter(Boolean);

    return (
        <div
            style={{ ...blockStyle, position: 'relative' }}
            data-block-index={blockIndex}
            className={`editor-block-item block-grid-item`}
            onClick={(e) => {
                if (isPreview) return;
                e.stopPropagation();
                setActiveBlockIndex(blockIndex);
                setActiveComponentIndex(null);
            }}
        >
            {isPreview ? (
                elements.map((element, idx) => (
                    <ComponentRenderer
                        key={element.id || idx}
                        component={element}
                        isPreview={isPreview}
                        columns={columns}
                        onNavigate={onNavigate}
                    />
                ))
            ) : (
                <Reorder.Group
                    as="div"
                    axis="y"
                    values={elements}
                    onReorder={(newElements) => setBlockElements(blockIndex, newElements)}
                    style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        display: 'flex',
                        flexDirection: block.style?.flexDirection || 'column',
                        alignItems: block.style?.flexDirection === 'row' ? 'center' : 'stretch',
                        justifyContent: block.style?.justifyContent || 'start',
                        gap: typeof block.style?.gap === 'number' ? `${block.style.gap}px` : '24px',
                        paddingLeft: '30px'
                    }}
                >
                    {elements.map((element, idx) => {
                        if (isPreview && element.hidden) return null;
                        const isSelected = activeBlockIndex === blockIndex && activeComponentIndex === idx;
                        return (
                            <Reorder.Item
                                as="div"
                                key={element.id || `${blockIndex}-${idx}-${element.type}`}
                                value={element}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveBlockIndex(blockIndex);
                                    setActiveComponentIndex(idx);
                                }}
                                style={{
                                    position: 'relative',
                                    outline: isSelected ? '3px solid var(--noor-secondary)' : 'none',
                                    outlineOffset: '4px',
                                    borderRadius: '12px',
                                    boxShadow: isSelected ? '0 0 20px rgba(123, 97, 255, 0.2)' : 'none',
                                    transition: 'all 0.2s ease',
                                    background: isSelected ? 'rgba(123, 97, 255, 0.05)' : 'transparent',
                                    cursor: 'pointer'
                                }}
                                onDragEnd={(event, info) => {
                                    // Logic to detect if we dropped over another block
                                    const elementAtPoint = document.elementFromPoint(info.point.x, info.point.y);
                                    const targetBlock = elementAtPoint?.closest('.editor-block-item');
                                    if (targetBlock) {
                                        const targetBlockIndex = parseInt(targetBlock.getAttribute('data-block-index'));
                                        if (!isNaN(targetBlockIndex) && targetBlockIndex !== blockIndex) {
                                            moveComponentBetweenBlocks(blockIndex, idx, targetBlockIndex);
                                        }
                                    }
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: '-30px',
                                        top: '0',
                                        bottom: '0',
                                        width: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: 0.3,
                                        cursor: 'grab'
                                    }}
                                >
                                    <GripVertical size={18} />
                                </div>
                                <ComponentRenderer
                                    component={element}
                                    isPreview={isPreview}
                                    columns={columns}
                                    onNavigate={onNavigate}
                                />
                            </Reorder.Item>
                        );
                    })}
                </Reorder.Group>
            )}

            {!isPreview && blockIndex !== undefined && (
                <div style={{ position: 'relative', marginTop: '12px' }}>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: 'rgba(123, 97, 255, 0.08)',
                            border: '2px dashed rgba(123, 97, 255, 0.3)',
                            borderRadius: '16px',
                            color: 'var(--noor-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            fontSize: '1rem',
                            fontWeight: 800,
                            transition: 'all 0.2s'
                        }}
                    >
                        <Plus size={20} />
                        Ajouter un composant
                    </button>

                    <ComponentModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSelect={(type) => {
                            addComponentToBlock(blockIndex, type);
                            setIsModalOpen(false);
                        }}
                    />
                </div>
            )}
        </div>
    );
};


const SlideRenderer = ({ slide, isPreview = false, style: customStyle = {}, isGlobal = false, onNavigate }) => {
    const {
        setActiveBlockIndex,
        setActiveComponentIndex,
        activeBlockIndex,
        activeComponentIndex
    } = useCourseStore();

    if (!slide) return null;

    // Backward compatibility: build blocks from slide props if blocks is missing
    const blocks = slide.blocks || [
        {
            id: 'legacy-block',
            type: slide.type,
            title: slide.title,
            description: slide.description,
            image: slide.image,
            url: slide.url,
            options: slide.options,
            instruction: slide.instruction,
            question: slide.question,
            correctAnswer: slide.correctAnswer,
            content: slide.content,
            pairs: slide.pairs,
            items: slide.items,
            categories: slide.categories,
            mainImage: slide.mainImage,
            labels: slide.labels,
            style: { columns: 12, background: 'transparent' }
        }
    ];

    return (
        <div
            className="slide-content-canvas"
            onClick={() => {
                if (isPreview) return;
                setActiveBlockIndex(null);
                setActiveComponentIndex(null);
            }}
            style={{
                width: '100%',
                height: '100%',
                overflowY: 'auto',
                padding: typeof slide.style?.padding === 'number' ? `${slide.style.padding + 12}px` : (isGlobal ? '0' : '36px'), // Extra padding for outline visibility
                background: slide.style?.background || 'transparent',
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: typeof slide.style?.gap === 'number' ? `${slide.style.gap}px` : (isGlobal ? '0' : '24px'),
                alignContent: 'start',
                cursor: !isPreview ? 'pointer' : 'default',
                border: !isPreview && activeBlockIndex === null ? '2px dashed rgba(123, 97, 255, 0.2)' : 'none',
                borderRadius: '12px',
                ...customStyle
            }}
        >
            {blocks.map((block, index) => (
                <BlockItem key={block.id || index} block={block} isPreview={isPreview} blockIndex={index} isGlobal={isGlobal} onNavigate={onNavigate} />
            ))}

            {slide.type === 'REPORT' && (
                <div style={{ gridColumn: 'span 12', textAlign: 'center', padding: '60px' }}>
                    <div style={{ width: '120px', height: '120px', background: 'var(--gradient-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px' }}>
                        <Trophy size={60} color="white" />
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>Félicitations !</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Vous avez terminé ce module.</p>
                </div>
            )}
        </div>
    );
};

export default SlideRenderer;
