import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    X,
    Maximize2,
    Minimize2,
    Monitor,
    Smartphone,
    Tablet,
    RotateCw,
    ArrowLeft,
    Grid3x3,
    ZoomIn,
    ZoomOut,
    Menu,
    Activity,
    CheckCircle2,
    Trophy
} from 'lucide-react';
import useCourseStore from '../stores/courseStore';
import SlideRenderer, { ComponentRenderer } from '../components/SlideRenderer';

const DEVICE_PRESETS = [
    { id: 'mobile-portrait', name: 'Mobile Portrait', icon: Smartphone, width: 375, height: 667, aspectRatio: '9/16' },
    { id: 'mobile-landscape', name: 'Mobile Landscape', icon: Smartphone, width: 667, height: 375, aspectRatio: '16/9' },
    { id: 'tablet-portrait', name: 'Tablette Portrait', icon: Tablet, width: 768, height: 1024, aspectRatio: '3/4' },
    { id: 'tablet-landscape', name: 'Tablette Landscape', icon: Tablet, width: 1024, height: 768, aspectRatio: '4/3' },
    { id: 'desktop', name: 'Desktop', icon: Monitor, width: 1920, height: 1080, aspectRatio: '16/9' },
    { id: 'desktop-wide', name: 'Large Desktop', icon: Monitor, width: 2560, height: 1440, aspectRatio: '16/9' }
];

const PreviewPage = ({ isPlayer = false }) => {
    const { courseId, slideIndex } = useParams();
    const navigate = useNavigate();
    const { course, loadCourseById, setActiveSlideIndex } = useCourseStore();

    const [currentSlideIndex, setCurrentSlideIndex] = useState(parseInt(slideIndex) || 0);
    const [selectedDevice, setSelectedDevice] = useState('desktop');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showGrid, setShowGrid] = useState(false);
    const [zoom, setZoom] = useState(100);
    const [customWidth, setCustomWidth] = useState(1920);
    const [customHeight, setCustomHeight] = useState(1080);

    // Load course if not already loaded
    useEffect(() => {
        if (courseId && (!course || course.id !== courseId)) {
            loadCourseById(courseId);
        }
    }, [courseId]);

    const handleAutoLaunch = () => {
        toggleFullscreen();
    };

    useEffect(() => {
        if (slideIndex !== undefined) {
            const idx = parseInt(slideIndex) || 0;
            setCurrentSlideIndex(idx);
            setActiveSlideIndex(idx);
        }
    }, [slideIndex]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'ArrowLeft' && currentSlideIndex > 0) {
                goToSlide(currentSlideIndex - 1);
            } else if (e.key === 'ArrowRight' && currentSlideIndex < (course?.slides?.length || 0) - 1) {
                goToSlide(currentSlideIndex + 1);
            } else if (e.key === 'Escape' && isFullscreen) {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            } else if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                toggleFullscreen();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentSlideIndex, course, isFullscreen]);

    const goToSlide = (index) => {
        setCurrentSlideIndex(index);
        setActiveSlideIndex(index);
        navigate(`/preview/${courseId}/${index}`, { replace: true });
    };

    const getDeviceDimensions = () => {
        if (selectedDevice === 'custom') {
            return { width: customWidth, height: customHeight };
        }
        const device = DEVICE_PRESETS.find(d => d.id === selectedDevice);
        return device ? { width: device.width, height: device.height } : { width: 1920, height: 1080 };
    };

    const rotateDevice = () => {
        const dims = getDeviceDimensions();
        setCustomWidth(dims.height);
        setCustomHeight(dims.width);
        if (selectedDevice !== 'custom') {
            setSelectedDevice('custom');
        }
    };

    // Handle fullscreen with browser API
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Auto-adjust zoom for large screens
    useEffect(() => {
        const dims = getDeviceDimensions();
        const previewArea = document.querySelector('.preview-area');
        if (previewArea) {
            const availableWidth = previewArea.clientWidth - 80; // padding
            const availableHeight = previewArea.clientHeight - 80;

            const scaleX = availableWidth / dims.width;
            const scaleY = availableHeight / dims.height;
            const optimalScale = Math.min(scaleX, scaleY, 1) * 100;

            if (optimalScale < 100) {
                setZoom(Math.floor(optimalScale / 10) * 10); // Round to nearest 10
            }
        }
    }, [selectedDevice, customWidth, customHeight]);

    if (!course) {
        return (
            <div style={{
                width: '100%',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                    <p style={{ color: 'var(--text-muted)' }}>Chargement du cours...</p>
                </div>
            </div>
        );
    }

    const currentSlide = course.slides?.[currentSlideIndex];
    const dimensions = isPlayer ? { width: '100%', height: '100%' } : getDeviceDimensions();
    const scale = isPlayer ? 1 : zoom / 100;

    // --- UX Metrics Calculation ---
    const totalSlides = course.slides?.length || 0;
    const progression = ((currentSlideIndex + 1) / totalSlides) * 100;

    // Simple count of interactive components
    const getInteractiveCount = () => {
        let count = 0;
        course.slides?.forEach(slide => {
            slide.blocks?.forEach(block => {
                block.components?.forEach(comp => {
                    if (['CHOICE', 'CHOICE_MULTI', 'INPUT_TEXT', 'SORTING'].includes(comp.type)) {
                        count++;
                    }
                });
            });
        });
        return count;
    };
    const totalQuestions = getInteractiveCount();
    const completedQuestions = 0; // Mock for now
    const interactionScore = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : null;

    const playerConfig = course.playerConfig || {
        showHeader: true,
        showFooter: true,
        showProgressBar: true,
        showInteractionScore: true,
        showSlideCounter: true,
        headerBackground: 'rgba(18, 21, 45, 0.98)',
        footerBackground: 'rgba(18, 21, 45, 0.98)',
        logoUrl: null
    };

    const PlayerHeader = ({ isEmbedded = false }) => {
        if (!playerConfig.showHeader && !isEmbedded) return null;

        const layout = playerConfig.headerLayout || {
            cells: [
                { id: 'h-cell-1', span: 3, alignment: 'left' },
                { id: 'h-cell-2', span: 6, alignment: 'center' },
                { id: 'h-cell-3', span: 3, alignment: 'right' }
            ],
            isRTL: false,
            height: 60,
            background: 'rgba(18, 21, 45, 0.98)',
            isCard: false,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            borderRadius: 12,
            padding: 10
        };

        const allHeaderElements = course.header?.blocks?.flatMap(b => b.elements) || [];

        return (
            <div
                className="responsive-player-header-container"
                style={{
                    height: `${layout.height}px`,
                    padding: layout.isCard ? '8px 16px' : '0',
                    zIndex: 1100,
                    flexShrink: 0,
                    position: 'relative'
                }}>
                <header
                    style={{
                        height: '100%',
                        background: layout.background,
                        borderRadius: layout.isCard ? `${layout.borderRadius}px` : '0',
                        border: `${layout.borderWidth}px solid ${layout.borderColor}`,
                        boxShadow: layout.isCard ? '0 8px 30px rgba(0,0,0,0.3)' : 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderTop: 'none',
                        borderBottom: !layout.isCard ? `${layout.borderWidth}px solid ${layout.borderColor}` : 'none',
                        backdropFilter: 'blur(20px)',
                        display: 'grid',
                        gridTemplateColumns: `repeat(12, 1fr)`,
                        gap: `${layout.gap ?? 4}px`,
                        direction: layout.isRTL ? 'rtl' : 'ltr',
                        padding: `0 ${layout.padding}px`,
                        overflow: 'hidden'
                    }}>
                    {layout.cells.map(cell => (
                        <div
                            key={cell.id}
                            className="header-cell"
                            style={{
                                gridColumn: `span ${cell.span}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: cell.alignment === 'center' ? 'center' : cell.alignment === 'right' ? 'flex-end' : 'flex-start',
                                height: '100%',
                                overflow: 'hidden',
                                minWidth: 0,
                                containerType: 'inline-size'
                            }}
                        >
                            {allHeaderElements
                                .filter(el => el.cellId === cell.id)
                                .map(element => (
                                    <ComponentRenderer
                                        key={element.id}
                                        component={element}
                                        isPreview={true}
                                        onNavigate={goToSlide}
                                    />
                                ))
                            }
                        </div>
                    ))}
                </header>
            </div>
        );
    };

    const PlayerFooter = ({ isEmbedded = false }) => {
        if (!playerConfig.showFooter && !isEmbedded) return null;
        const totalSlides = course.slides?.length || 0;

        const layout = playerConfig.footerLayout || {
            cells: [
                { id: 'f-cell-prev', span: 3, alignment: 'left' },
                { id: 'f-cell-counter', span: 6, alignment: 'center' },
                { id: 'f-cell-next', span: 3, alignment: 'right' }
            ],
            isRTL: false,
            height: 72,
            background: 'rgba(18, 21, 45, 0.98)',
            isCard: false,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            borderRadius: 12,
            padding: 10
        };

        const allFooterElements = course.footer?.blocks?.flatMap(b => b.elements) || [];

        return (
            <div
                className="responsive-player-footer-container"
                style={{
                    height: `${layout.height}px`,
                    padding: layout.isCard ? '8px 16px' : '0',
                    zIndex: 1100,
                    flexShrink: 0,
                    position: 'relative'
                }}>
                <footer
                    style={{
                        height: '100%',
                        background: layout.background,
                        borderRadius: layout.isCard ? `${layout.borderRadius}px` : '0',
                        border: `${layout.borderWidth}px solid ${layout.borderColor}`,
                        boxShadow: layout.isCard ? '0 -8px 30px rgba(0,0,0,0.3)' : 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderBottom: 'none',
                        borderTop: !layout.isCard ? `${layout.borderWidth}px solid ${layout.borderColor}` : 'none',
                        backdropFilter: 'blur(20px)',
                        display: 'grid',
                        gridTemplateColumns: `repeat(12, 1fr)`,
                        gap: `${layout.gap ?? 4}px`,
                        direction: layout.isRTL ? 'rtl' : 'ltr',
                        padding: `0 ${layout.padding}px`,
                        overflow: 'hidden'
                    }}>

                    {layout.cells.map(cell => (
                        <div
                            key={cell.id}
                            className="footer-cell"
                            style={{
                                gridColumn: `span ${cell.span}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: cell.alignment === 'center' ? 'center' : cell.alignment === 'right' ? 'flex-end' : 'flex-start',
                                height: '100%',
                                overflow: 'hidden',
                                gap: '8px',
                                minWidth: 0,
                                containerType: 'inline-size'
                            }}
                        >
                            {/* Render navigation buttons only in specific zones or if not handled by elements */}
                            {/* For simplicity we keep the original nav buttons but we could also make them components */}

                            {allFooterElements
                                .filter(el => el.cellId === cell.id)
                                .map(element => (
                                    <ComponentRenderer
                                        key={element.id}
                                        component={element}
                                        isPreview={true}
                                        onNavigate={goToSlide}
                                    />
                                ))
                            }
                        </div>
                    ))}
                </footer>
            </div>
        );
    };

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            background: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {isPlayer ? (
                /* --- MODE ÉLÈVE (UX EXPERT) --- */
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                    <PlayerHeader />

                    {/* Zone de Contenu */}
                    <main className="responsive-player-main" style={{ flex: 1, overflow: 'auto', background: 'var(--bg-tertiary)', position: 'relative' }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSlideIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                style={{ width: '100%', minHeight: '100%' }}
                            >
                                <div className="player-card-container">
                                    {currentSlide && <SlideRenderer slide={currentSlide} isPreview={true} onNavigate={goToSlide} />}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </main>

                    <PlayerFooter />
                </div>
            ) : (
                /* --- MODE CRÉATEUR (SIMULATEUR) --- */
                <>
                    {/* Header Créateur */}
                    <AnimatePresence>
                        {(!isFullscreen || showControls) && (
                            <motion.div
                                initial={{ y: -100 }}
                                animate={{ y: 0 }}
                                exit={{ y: -100 }}
                                style={{
                                    background: 'rgba(18, 21, 45, 0.95)',
                                    backdropFilter: 'blur(20px)',
                                    borderBottom: '1px solid var(--glass-border)',
                                    padding: '16px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    zIndex: 100,
                                    flexShrink: 0
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <button onClick={() => navigate('/editor')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <ArrowLeft size={18} /> Retour à l'éditeur
                                    </button>
                                    <button onClick={() => window.open(`/course/${courseId}/${currentSlideIndex}`, '_blank')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(123, 97, 255, 0.1)' }}>
                                        Voir comme un élève 🎓
                                    </button>
                                    <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }}></div>
                                    <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>{course.title}</h2>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button onClick={toggleFullscreen} className="btn-icon">
                                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                                    </button>
                                    <button onClick={() => window.close()} className="btn-icon" style={{ color: 'var(--noor-accent)' }}>
                                        <X size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Zone Main avec Sidebar */}
                    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                        <AnimatePresence>
                            {(!isFullscreen || showControls) && (
                                <motion.aside
                                    initial={{ x: -300 }}
                                    animate={{ x: 0 }}
                                    exit={{ x: -300 }}
                                    style={{
                                        width: '280px',
                                        background: 'rgba(18, 21, 45, 0.7)',
                                        backdropFilter: 'blur(40px)',
                                        borderRight: '1px solid var(--glass-border)',
                                        padding: '24px',
                                        overflowY: 'auto',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '24px',
                                        flexShrink: 0
                                    }}
                                >
                                    {/* Presets */}
                                    <div>
                                        <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase', marginBottom: '16px' }}>
                                            Appareils
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                            {DEVICE_PRESETS.map((device) => (
                                                <button
                                                    key={device.id}
                                                    onClick={() => {
                                                        setSelectedDevice(device.id);
                                                        setCustomWidth(device.width);
                                                        setCustomHeight(device.height);
                                                    }}
                                                    style={{
                                                        padding: '12px',
                                                        borderRadius: '12px',
                                                        background: selectedDevice === device.id ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.03)',
                                                        border: '1px solid',
                                                        borderColor: selectedDevice === device.id ? 'var(--noor-secondary)' : 'var(--glass-border)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <device.icon size={18} color={selectedDevice === device.id ? 'white' : 'var(--text-muted)'} />
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap', color: selectedDevice === device.id ? 'white' : 'var(--text-muted)' }}>
                                                        {device.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Custom Size */}
                                    <div>
                                        <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
                                            Taille Personnalisée
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Largeur</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    value={customWidth}
                                                    onChange={(e) => {
                                                        setCustomWidth(parseInt(e.target.value) || 0);
                                                        setSelectedDevice('custom');
                                                    }}
                                                    style={{ padding: '8px', fontSize: '0.75rem' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Hauteur</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    value={customHeight}
                                                    onChange={(e) => {
                                                        setCustomHeight(parseInt(e.target.value) || 0);
                                                        setSelectedDevice('custom');
                                                    }}
                                                    style={{ padding: '8px', fontSize: '0.75rem' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tools */}
                                    <div>
                                        <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
                                            Outils
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <button
                                                onClick={rotateDevice}
                                                className="btn-secondary"
                                                style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                                            >
                                                <RotateCw size={16} />
                                                Rotation
                                            </button>
                                            <button
                                                onClick={() => setShowGrid(!showGrid)}
                                                className="btn-secondary"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    justifyContent: 'center',
                                                    background: showGrid ? 'var(--noor-secondary)' : undefined
                                                }}
                                            >
                                                <Grid3x3 size={16} />
                                                Grille
                                            </button>
                                        </div>
                                    </div>

                                    {/* Zoom */}
                                    <div>
                                        <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
                                            Zoom: {zoom}%
                                        </h3>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <button
                                                onClick={() => setZoom(Math.max(50, zoom - 10))}
                                                className="btn-icon"
                                                disabled={zoom <= 50}
                                            >
                                                <ZoomOut size={16} />
                                            </button>
                                            <input
                                                type="range"
                                                min="50"
                                                max="200"
                                                step="10"
                                                value={zoom}
                                                onChange={(e) => setZoom(parseInt(e.target.value))}
                                                style={{ flex: 1, accentColor: 'var(--noor-secondary)' }}
                                            />
                                            <button
                                                onClick={() => setZoom(Math.min(200, zoom + 10))}
                                                className="btn-icon"
                                                disabled={zoom >= 200}
                                            >
                                                <ZoomIn size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.aside>
                            )}
                        </AnimatePresence>

                        {/* Preview Area avec Simulator Frame */}
                        <div className="preview-area" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: 'var(--bg-secondary)', position: 'relative', overflow: 'auto' }}>
                            <div style={{
                                width: `${dimensions.width}px`,
                                height: `${dimensions.height}px`,
                                transform: `scale(${scale})`,
                                transformOrigin: 'center',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                position: 'relative',
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--glass-border)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {/* INTEGRATED PLAYER UI INSIDE SIMULATOR */}
                                <PlayerHeader isEmbedded={true} />

                                <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                                    <AnimatePresence mode="wait">
                                        <motion.div key={currentSlideIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', minHeight: '100%', position: 'relative' }}>
                                            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', minHeight: '100%' }}>
                                                {currentSlide && <SlideRenderer slide={currentSlide} isPreview={true} onNavigate={goToSlide} />}
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                <PlayerFooter isEmbedded={true} />
                            </div>
                        </div>
                    </div>

                </>
            )}
        </div>
    );
};

export default PreviewPage;
