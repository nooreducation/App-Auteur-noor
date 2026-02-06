import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Maximize2
} from 'lucide-react';

const SlideRenderer = ({ slide, isPreview = false, onUpdate }) => {
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const containerRef = useRef(null);

    // Reset state when slide changes
    useEffect(() => {
        setSelectedOption(null);
        setIsAnswered(false);
    }, [slide?.id]);

    if (!slide) return null;

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

    const handleChoiceClick = (index) => {
        if (!isPreview || isAnswered) return;
        setSelectedOption(index);
    };

    const handleTrueFalseClick = (val) => {
        if (!isPreview || isAnswered) return;
        setSelectedOption(val);
    };

    const handleValidate = () => {
        if (selectedOption !== null) {
            setIsAnswered(true);
        }
    };

    const renderEditor = () => {
        switch (slide.type) {
            case 'REPORT':
                return (
                    <div className="render-container" style={{ width: '100%', height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{ maxWidth: '600px', margin: '0 auto', background: 'rgba(255,255,255,0.03)', padding: '60px', borderRadius: '40px', border: '1px solid var(--glass-border)' }}
                        >
                            <div style={{ width: '120px', height: '120px', background: 'var(--gradient-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                                <Trophy size={60} color="white" />
                            </div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '10px' }}>Félicitations !</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '40px' }}>Vous avez terminé le cours avec succès.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '20px' }}>
                                    <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 900, color: 'var(--noor-secondary)' }}>85%</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score Total</span>
                                </div>
                                <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '20px' }}>
                                    <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 900, color: 'var(--noor-secondary)' }}>04:20</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Temps Passé</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                );
            case 'SPLASH':
                return (
                    <div className="render-container" style={{ textAlign: 'center' }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                            <ImageIcon size={64} style={{ opacity: 0.2, marginBottom: '24px' }} />
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px' }}>{slide.title}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{slide.description}</p>
                        </motion.div>
                    </div>
                );

            case 'STORY':
                return (
                    <div ref={containerRef} className="render-container" style={{ width: '100%', height: '100%', padding: 0, overflow: 'hidden', borderRadius: '32px', position: 'relative', background: 'black' }}>
                        {slide.url ? (
                            <>
                                <iframe
                                    src={slide.url}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none',
                                        borderRadius: '32px',
                                        display: 'block'
                                    }}
                                    title={slide.title || 'Contenu externe'}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                                <button
                                    onClick={toggleFullscreen}
                                    style={{
                                        position: 'absolute',
                                        top: '20px',
                                        right: '20px',
                                        background: 'rgba(18, 21, 45, 0.8)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                        padding: '10px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        backdropFilter: 'blur(10px)',
                                        zIndex: 100,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600
                                    }}
                                >
                                    <Maximize2 size={16} /> Plein écran
                                </button>
                            </>
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                <LinkIcon size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                                <h3 style={{ fontSize: '1.2rem' }}>Aucune URL configurée</h3>
                            </div>
                        )}
                    </div>
                );

            case 'CHOICE':
                return (
                    <div className="render-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <CheckCircle2 size={24} style={{ color: 'var(--noor-secondary)' }} />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{slide.instruction || "Choisissez la bonne réponse"}</h3>
                            </div>
                            {slide.question && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginLeft: '36px', lineHeight: 1.5 }}>
                                    {slide.question}
                                </p>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1, alignItems: 'center' }}>
                            {(slide.options || [{ text: 'Option 1' }, { text: 'Option 2' }]).map((opt, i) => {
                                const isSelected = selectedOption === i;
                                const showCorrect = isAnswered && opt.isCorrect;
                                const showWrong = isAnswered && isSelected && !opt.isCorrect;

                                return (
                                    <motion.div
                                        key={i}
                                        whileHover={!isAnswered ? { scale: 1.02, background: 'rgba(255,255,255,0.05)' } : {}}
                                        whileTap={!isAnswered ? { scale: 0.98 } : {}}
                                        onClick={() => handleChoiceClick(i)}
                                        style={{
                                            padding: '24px',
                                            borderRadius: '20px',
                                            background: showCorrect ? 'rgba(46, 213, 115, 0.15)' :
                                                showWrong ? 'rgba(255, 71, 87, 0.15)' :
                                                    isSelected ? 'rgba(123, 97, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                                            border: `2px solid ${showCorrect ? '#2ed573' :
                                                showWrong ? '#ff4757' :
                                                    isSelected ? 'var(--noor-secondary)' : 'var(--glass-border)'}`,
                                            textAlign: 'center',
                                            fontSize: '1.1rem',
                                            fontWeight: 600,
                                            cursor: isAnswered ? 'default' : 'pointer',
                                            position: 'relative',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {opt.text}
                                        <AnimatePresence>
                                            {showCorrect && (
                                                <motion.div
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#2ed573', borderRadius: '50%', padding: '4px', display: 'flex' }}
                                                >
                                                    <Check size={16} color="white" />
                                                </motion.div>
                                            )}
                                            {showWrong && (
                                                <motion.div
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ff4757', borderRadius: '50%', padding: '4px', display: 'flex' }}
                                                >
                                                    <X size={16} color="white" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {isPreview && !isAnswered && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ marginTop: '40px', textAlign: 'center' }}
                            >
                                <button
                                    className="btn-primary"
                                    onClick={handleValidate}
                                    disabled={selectedOption === null}
                                    style={{ padding: '12px 40px', borderRadius: '30px', fontSize: '1.1rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '10px' }}
                                >
                                    <CheckCircle2 size={20} /> Valider ma réponse
                                </button>
                            </motion.div>
                        )}
                    </div>
                );

            case 'TRUE_FALSE':
                return (
                    <div className="render-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '48px', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <HelpCircle size={24} style={{ color: 'var(--noor-secondary)' }} />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{slide.instruction || "Vrai ou Faux ?"}</h3>
                            </div>
                            {slide.question && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: 600, maxWidth: '800px', lineHeight: 1.5 }}>
                                    {slide.question}
                                </p>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '32px' }}>
                            {['VRAI', 'FAUX'].map((val) => {
                                const isCorrect = slide.correctAnswer === val;
                                const isSelected = selectedOption === val;
                                const showCorrect = isAnswered && isCorrect;
                                const showWrong = isAnswered && isSelected && !isCorrect;

                                return (
                                    <motion.button
                                        key={val}
                                        whileHover={!isAnswered ? { scale: 1.05 } : {}}
                                        whileTap={!isAnswered ? { scale: 0.95 } : {}}
                                        onClick={() => handleTrueFalseClick(val)}
                                        style={{
                                            width: '180px',
                                            height: '180px',
                                            borderRadius: '30px',
                                            background: showCorrect ? 'rgba(46, 213, 115, 0.2)' :
                                                showWrong ? 'rgba(255, 71, 87, 0.2)' :
                                                    val === 'VRAI' ? 'rgba(46, 213, 115, 0.05)' : 'rgba(255, 71, 87, 0.05)',
                                            border: `3px solid ${showCorrect ? '#2ed573' :
                                                showWrong ? '#ff4757' :
                                                    isSelected ? 'white' :
                                                        val === 'VRAI' ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 71, 87, 0.2)'}`,
                                            color: val === 'VRAI' ? '#2ed573' : '#ff4757',
                                            fontSize: '1.5rem',
                                            fontWeight: 900,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '12px',
                                            cursor: isAnswered ? 'default' : 'pointer',
                                            opacity: isAnswered && !isSelected && !isCorrect ? 0.5 : 1,
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {val === 'VRAI' ? <CheckCircle2 size={48} /> : <AlertTriangle size={48} />}
                                        {val}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {isPreview && !isAnswered && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ marginTop: '40px', textAlign: 'center' }}
                            >
                                <button
                                    className="btn-primary"
                                    onClick={handleValidate}
                                    disabled={selectedOption === null}
                                    style={{ padding: '12px 40px', borderRadius: '30px', fontSize: '1.1rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '10px' }}
                                >
                                    <CheckCircle2 size={20} /> Valider ma réponse
                                </button>
                            </motion.div>
                        )}
                    </div>
                );

            case 'MATCHING_PAIRS':
                return (
                    <div className="render-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Layout size={24} style={{ color: 'var(--noor-secondary)' }} />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{slide.instruction || "Associez les éléments"}</h3>
                            </div>
                            {slide.question && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginLeft: '36px', lineHeight: 1.5 }}>
                                    {slide.question}
                                </p>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', flex: 1, alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {(slide.pairs || [{ en: 'Élément A' }, { en: 'Élément B' }]).map((pair, i) => (
                                    <motion.div
                                        key={'a' + i}
                                        whileHover={{ x: 5 }}
                                        style={{ padding: '16px', borderRadius: '12px', background: 'rgba(72, 52, 212, 0.1)', border: '1px solid rgba(72, 52, 212, 0.2)', textAlign: 'center', fontWeight: 700, position: 'relative' }}
                                    >
                                        {pair.en}
                                        <div style={{ position: 'absolute', right: '-6px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '12px', background: 'var(--noor-secondary)', borderRadius: '50%', border: '2px solid var(--bg-tertiary)' }}></div>
                                    </motion.div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {(slide.pairs || [{ fr: 'Cible 1' }, { fr: 'Cible 2' }]).map((pair, i) => (
                                    <motion.div
                                        key={'b' + i}
                                        whileHover={{ x: -5 }}
                                        style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', textAlign: 'center', fontWeight: 700, position: 'relative' }}
                                    >
                                        <div style={{ position: 'absolute', left: '-6px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '12px', background: 'var(--text-muted)', borderRadius: '50%', border: '2px solid var(--bg-tertiary)' }}></div>
                                        {pair.fr}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        {isPreview && !isAnswered && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ marginTop: '40px', textAlign: 'center' }}
                            >
                                <button
                                    className="btn-primary"
                                    onClick={handleValidate}
                                    style={{ padding: '12px 40px', borderRadius: '30px', fontSize: '1.1rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '10px' }}
                                >
                                    <CheckCircle2 size={20} /> Valider ma réponse
                                </button>
                            </motion.div>
                        )}
                        {!isPreview && (
                            <p style={{ marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                                [Mode Éditeur : Configurez les paires dans le panneau latéral]
                            </p>
                        )}
                    </div>
                );

            case 'ORDERING':
                return (
                    <div className="render-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <ArrowDownUp size={24} style={{ color: 'var(--noor-secondary)' }} />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{slide.instruction || "Remettez les éléments dans l'ordre"}</h3>
                            </div>
                            {slide.question && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginLeft: '36px', lineHeight: 1.5 }}>
                                    {slide.question}
                                </p>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                            {(slide.items || [{ text: 'Élément A' }, { text: 'Élément B' }, { text: 'Élément C' }]).map((item, i) => (
                                <motion.div
                                    key={i}
                                    style={{
                                        padding: '16px 24px',
                                        borderRadius: '16px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid var(--glass-border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px'
                                    }}
                                >
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--noor-secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>{i + 1}</div>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{item.text}</span>
                                    <ArrowDownUp size={16} style={{ marginLeft: 'auto', opacity: 0.2 }} />
                                </motion.div>
                            ))}
                        </div>

                        {isPreview && !isAnswered && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ marginTop: '40px', textAlign: 'center' }}
                            >
                                <button
                                    className="btn-primary"
                                    onClick={handleValidate}
                                    style={{ padding: '12px 40px', borderRadius: '30px', fontSize: '1.1rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '10px' }}
                                >
                                    <CheckCircle2 size={20} /> Valider ma réponse
                                </button>
                            </motion.div>
                        )}
                    </div>
                );

            case 'SORTING':
                return (
                    <div className="render-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Layers size={24} style={{ color: 'var(--noor-secondary)' }} />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{slide.instruction || "Classez les éléments dans les bonnes colonnes"}</h3>
                            </div>
                            {slide.question && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginLeft: '36px', lineHeight: 1.5 }}>
                                    {slide.question}
                                </p>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${(slide.categories || ['Cat A', 'Cat B']).length}, 1fr)`, gap: '24px', flex: 1 }}>
                            {(slide.categories || ['Catégorie A', 'Catégorie B']).map((cat, i) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid var(--glass-border)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ textAlign: 'center', padding: '10px', borderRadius: '12px', background: 'var(--gradient-primary)', color: 'white', fontWeight: 800, fontSize: '0.9rem', marginBottom: '10px' }}>{cat}</div>
                                    <div style={{ flex: 1, border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                        Déposez ici
                                    </div>
                                </div>
                            ))}
                        </div>

                        {isPreview && !isAnswered && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ marginTop: '40px', textAlign: 'center' }}
                            >
                                <button
                                    className="btn-primary"
                                    onClick={handleValidate}
                                    style={{ padding: '12px 40px', borderRadius: '30px', fontSize: '1.1rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '10px' }}
                                >
                                    <CheckCircle2 size={20} /> Valider ma réponse
                                </button>
                            </motion.div>
                        )}
                    </div>
                );

            case 'VIDEO':
                return (
                    <div className="render-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, background: 'black', borderRadius: '24px', border: '1px solid var(--glass-border)', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Video size={64} style={{ color: 'var(--noor-secondary)', opacity: 0.3 }} />
                            <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}>
                                <div style={{ width: '30%', height: '100%', background: 'var(--noor-secondary)', borderRadius: '2px' }}></div>
                            </div>
                            <p style={{ position: 'absolute', top: '50%', transform: 'translateY(40px)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Lecteur Vidéo Interactif</p>
                        </div>
                        <h3 style={{ marginTop: '20px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 700 }}>{slide.title || "Titre de la vidéo"}</h3>
                    </div>
                );

            case 'GAP_FILL':
                const parts = (slide.content || "Texte avec [trous]").split(/(\[[^\]]+\])/g);
                return (
                    <div className="render-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Type size={24} style={{ color: 'var(--noor-secondary)' }} />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{slide.instruction || "Complétez le texte"}</h3>
                            </div>
                            {slide.question && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginLeft: '36px', lineHeight: 1.5 }}>
                                    {slide.question}
                                </p>
                            )}
                        </div>

                        <div style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '24px',
                            padding: '40px',
                            border: '1px solid var(--glass-border)',
                            fontSize: '1.4rem',
                            lineHeight: '2',
                            color: 'var(--text-primary)',
                            textAlign: 'center'
                        }}>
                            {parts.map((part, i) => {
                                if (part.startsWith('[') && part.endsWith(']')) {
                                    return (
                                        <input
                                            key={i}
                                            disabled
                                            style={{
                                                width: '120px',
                                                height: '40px',
                                                border: 'none',
                                                borderBottom: '3px solid var(--noor-secondary)',
                                                background: 'rgba(72, 52, 212, 0.1)',
                                                borderRadius: '8px 8px 0 0',
                                                margin: '0 8px',
                                                textAlign: 'center',
                                                color: 'var(--noor-secondary)',
                                                fontWeight: 800,
                                                fontSize: '1.1rem'
                                            }}
                                            value={isPreview ? "" : part.slice(1, -1)}
                                            placeholder="..."
                                        />
                                    );
                                }
                                return <span key={i}>{part}</span>;
                            })}
                        </div>

                        {isPreview && !isAnswered && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ marginTop: '40px', textAlign: 'center' }}
                            >
                                <button
                                    className="btn-primary"
                                    onClick={handleValidate}
                                    style={{ padding: '12px 40px', borderRadius: '30px', fontSize: '1.1rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '10px' }}
                                >
                                    <CheckCircle2 size={20} /> Valider ma réponse
                                </button>
                            </motion.div>
                        )}
                    </div>
                );

            case 'LABEL_IMAGE':
                return (
                    <div className="render-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <ImageIcon size={24} style={{ color: 'var(--noor-secondary)' }} />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{slide.instruction || "Placez les étiquettes correctement"}</h3>
                            </div>
                            {slide.question && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginLeft: '36px', lineHeight: 1.5 }}>
                                    {slide.question}
                                </p>
                            )}
                        </div>

                        <div style={{ flex: 1, position: 'relative', background: 'rgba(0,0,0,0.2)', borderRadius: '24px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                            {slide.mainImage ? (
                                <img src={slide.mainImage} alt="Background" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: '12px' }} />
                                    <p>Image non configurée</p>
                                </div>
                            )}

                            {/* Floating Labels */}
                            {(slide.labels || []).map((label, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{
                                        position: 'absolute',
                                        left: label.x || '50%',
                                        top: label.y || '50%',
                                        transform: 'translate(-50%, -50%)',
                                        padding: '10px 18px',
                                        background: 'var(--gradient-primary)',
                                        borderRadius: '30px',
                                        boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        fontWeight: 800,
                                        border: '2px solid rgba(255,255,255,0.2)',
                                        whiteSpace: 'nowrap',
                                        zIndex: 10
                                    }}
                                >
                                    {label.text || `Étiquette ${i + 1}`}
                                    {/* Line connecting to point if needed, or simple pointer */}
                                    <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '0', height: '0', borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid var(--noor-secondary)' }}></div>
                                </motion.div>
                            ))}
                        </div>

                        {isPreview && !isAnswered && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ marginTop: '40px', textAlign: 'center' }}
                            >
                                <button
                                    className="btn-primary"
                                    onClick={handleValidate}
                                    style={{ padding: '12px 40px', borderRadius: '30px', fontSize: '1.1rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '10px' }}
                                >
                                    <CheckCircle2 size={20} /> Valider ma réponse
                                </button>
                            </motion.div>
                        )}
                    </div>
                );

            case 'DRAG_IMAGE':
                return (
                    <div className="render-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <CheckCircle2 size={24} style={{ color: 'var(--noor-secondary)' }} />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{slide.instruction || "Identifiez les éléments sur l'image"}</h3>
                            </div>
                            {slide.question && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginLeft: '36px', lineHeight: 1.5 }}>
                                    {slide.question}
                                </p>
                            )}
                        </div>

                        <div style={{ flex: 1, display: 'flex', gap: '30px', alignItems: 'center' }}>
                            <div style={{ flex: 1.5, height: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', border: '2px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                                {slide.mainImage ? (
                                    <img src={slide.mainImage} alt="Main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <ImageIcon size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                        <p style={{ fontSize: '0.8rem' }}>Aucune image de fond configurée</p>
                                    </div>
                                )}

                                {/* Draggable Targets Simulation */}
                                {(slide.items || []).map((item, i) => (
                                    <div key={i} style={{
                                        position: 'absolute',
                                        left: item.x || '50%',
                                        top: item.y || '50%',
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '12px',
                                        background: 'rgba(72, 52, 212, 0.2)',
                                        border: '2px solid var(--noor-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        color: 'white',
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        Cible {i + 1}
                                    </div>
                                ))}
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Éléments à déplacer</span>
                                {(slide.items || []).map((item, i) => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ scale: 1.05 }}
                                        style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'grab' }}
                                    >
                                        <div style={{ width: '32px', height: '32px', background: 'var(--gradient-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>📦</div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.label || `Élément ${i + 1}`}</span>
                                    </motion.div>
                                ))}
                                {(!slide.items || slide.items.length === 0) && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Aucun élément configuré</p>
                                )}
                            </div>
                        </div>

                        {isPreview && !isAnswered && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ marginTop: '40px', textAlign: 'center' }}
                            >
                                <button
                                    className="btn-primary"
                                    onClick={handleValidate}
                                    style={{ padding: '12px 40px', borderRadius: '30px', fontSize: '1.1rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '10px' }}
                                >
                                    <CheckCircle2 size={20} /> Valider ma réponse
                                </button>
                            </motion.div>
                        )}
                    </div>
                );

            default:
                return (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        <AlertTriangle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>Le module de type <b>{slide.type}</b> est en attente d'implémentation graphique.</p>
                    </div>
                );
        }
    };

    const renderPreview = () => {
        return (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                {renderEditor()}
            </div>
        );
    };

    return isPreview ? renderPreview() : renderEditor();
};

export default SlideRenderer;
