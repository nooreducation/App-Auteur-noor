import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Palette, RotateCcw } from 'lucide-react';

const ColorPicker = ({ color, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    // État local pour éviter les lags lors du drag sur le color picker
    // On initialise avec la couleur actuelle ou la couleur par défaut
    const [localColor, setLocalColor] = useState(color || '#7b61ff');

    // Mettre à jour l'état local si le prop change de l'extérieur
    useEffect(() => {
        if (color !== localColor) {
            setLocalColor(color || '#7b61ff');
        }
    }, [color]);

    const isTransparent = localColor === 'transparent';

    const PRESETS = [
        '#ffffff', '#f1f2f6', '#dfe4ea', '#a4b0be', '#747d8c', '#2f3542', '#000000',
        '#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#7b61ff', '#6c5ce7', '#4834d4',
        '#ff9ff3', '#feca57', '#ff6b6b', '#48dbfb', '#1dd1a1', '#54a0ff', '#5f27cd'
    ];

    // Gérer l'ouverture/fermeture et le scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setLocalColor(color || '#7b61ff'); // Reset local color to current when opening
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    const handleApply = () => {
        onChange(localColor);
        setIsOpen(false);
    };

    const handleColorChange = (newColor) => {
        setLocalColor(newColor);
        // On peut choisir d'envoyer le changement en temps réel ou pas.
        // Pour éviter les lags, on ne fait rien ici, on attend "handleApply"
        // Ou on utilise un debounce léger. Ici, on va rester sur "Apply" pour la performance.
    };

    // Si on veut quand même un aperçu en temps réel sans trop de lag
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onChange(localColor);
            }, 50); // Petit délai pour laisser respirer l'UI
            return () => clearTimeout(timer);
        }
    }, [localColor]);

    return (
        <>
            {/* Bouton déclencheur */}
            <div
                onClick={() => setIsOpen(true)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(123, 97, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
            >
                <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: isTransparent ? 'repeating-conic-gradient(#808080 0% 25%, #ffffff 0% 50%) 50% / 8px 8px' : localColor,
                    border: '1px solid rgba(255,255,255,0.2)'
                }} />
                <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: 'white',
                    fontFamily: 'monospace'
                }}>
                    {isTransparent ? 'TRANSPARENT' : localColor.toUpperCase()}
                </span>
                <Palette size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />
            </div>

            {/* Modal via Portal pour isolation totale */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <div style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 100000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px',
                            pointerEvents: 'auto'
                        }}>
                            {/* Arrière-plan flou */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(2, 4, 15, 0.85)',
                                    backdropFilter: 'blur(15px)'
                                }}
                            />

                            {/* Contenu du Modal */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    maxWidth: '800px',
                                    background: '#12152d',
                                    borderRadius: '40px',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
                                    padding: '48px',
                                    color: 'white',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ background: 'linear-gradient(135deg, #7b61ff 0%, #4834d4 100%)', padding: '12px', borderRadius: '16px' }}>
                                            <Palette size={24} color="white" />
                                        </div>
                                        <div>
                                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Sélecteur Expert</h2>
                                            <p style={{ fontSize: '0.9rem', color: '#a0a8c0' }}>Choisissez une couleur précise.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '12px', borderRadius: '15px', cursor: 'pointer' }}
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '50px' }}>
                                    {/* Sélecteur */}
                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <HexColorPicker
                                            color={isTransparent ? '#ffffff' : localColor}
                                            onChange={handleColorChange}
                                            style={{ width: '100%', height: '320px' }}
                                        />
                                    </div>

                                    {/* Contrôles */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#646c8c', textTransform: 'uppercase', marginBottom: '16px', display: 'block' }}>Code Hex</label>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '60px',
                                                    height: '60px',
                                                    borderRadius: '18px',
                                                    background: isTransparent ? 'repeating-conic-gradient(#808080 0% 25%, #ffffff 0% 50%) 50% / 10px 10px' : localColor,
                                                    border: '2px solid rgba(255,255,255,0.1)'
                                                }} />
                                                <HexColorInput
                                                    color={isTransparent ? '#ffffff' : localColor}
                                                    onChange={handleColorChange}
                                                    style={{
                                                        flex: 1,
                                                        background: 'rgba(0,0,0,0.2)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: '16px',
                                                        padding: '14px 20px',
                                                        color: 'white',
                                                        fontSize: '1.2rem',
                                                        fontWeight: 700,
                                                        fontFamily: 'monospace'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#646c8c', textTransform: 'uppercase', marginBottom: '16px', display: 'block' }}>Nuances</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                                                {PRESETS.map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => handleColorChange(p)}
                                                        style={{
                                                            width: '100%',
                                                            aspectRatio: '1',
                                                            background: p,
                                                            border: localColor.toLowerCase() === p.toLowerCase() ? '2px solid white' : '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            transform: localColor.toLowerCase() === p.toLowerCase() ? 'scale(1.1)' : 'scale(1)'
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                                            <button
                                                onClick={() => {
                                                    onChange('transparent');
                                                    setIsOpen(false);
                                                }}
                                                style={{
                                                    flex: 1,
                                                    padding: '16px',
                                                    borderRadius: '16px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Transparent
                                            </button>
                                            <button
                                                onClick={handleApply}
                                                style={{
                                                    flex: 1,
                                                    padding: '16px',
                                                    borderRadius: '16px',
                                                    background: 'linear-gradient(135deg, #7b61ff 0%, #4834d4 100%)',
                                                    border: 'none',
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Terminer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default ColorPicker;
