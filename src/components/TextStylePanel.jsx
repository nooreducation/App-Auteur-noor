import { useState } from 'react';
import { Type, Palette, Square } from 'lucide-react';

const FONT_FAMILIES = [
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Helvetica, sans-serif', label: 'Helvetica' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Times New Roman, serif', label: 'Times New Roman' },
    { value: 'Courier New, monospace', label: 'Courier New' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: 'Tahoma, sans-serif', label: 'Tahoma' },
    { value: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS' },
    { value: 'Comic Sans MS, cursive', label: 'Comic Sans MS' },
    { value: 'Impact, fantasy', label: 'Impact' },
    // Google Fonts
    { value: 'Inter, sans-serif', label: 'Inter' },
    { value: 'Roboto, sans-serif', label: 'Roboto' },
    { value: 'Open Sans, sans-serif', label: 'Open Sans' },
    { value: 'Montserrat, sans-serif', label: 'Montserrat' },
    { value: 'Poppins, sans-serif', label: 'Poppins' },
];

const BORDER_STYLES = [
    { value: 'solid', label: 'Solide' },
    { value: 'dashed', label: 'Tirets' },
    { value: 'dotted', label: 'Points' },
    { value: 'double', label: 'Double' },
    { value: 'none', label: 'Aucun' },
];

const TextStylePanel = ({ component, onStyleChange, onClose }) => {
    const [expandedSection, setExpandedSection] = useState('typography');

    // Get current style values or defaults
    const currentStyle = component.style || {};
    const fontFamily = currentStyle.fontFamily || 'Arial, sans-serif';
    const fontSize = currentStyle.fontSize || 16;
    const color = currentStyle.color || '#ffffff';
    const backgroundColor = currentStyle.backgroundColor || 'transparent';
    const borderColor = currentStyle.borderColor || 'transparent';
    const borderWidth = currentStyle.borderWidth || 0;
    const borderStyle = currentStyle.borderStyle || 'solid';
    const borderRadius = currentStyle.borderRadius || 0;
    const padding = currentStyle.padding || 0;

    const handleChange = (property, value) => {
        onStyleChange({
            ...currentStyle,
            [property]: value
        });
    };

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    return (
        <div style={{
            position: 'fixed',
            right: '400px',
            top: '80px',
            width: '300px',
            maxHeight: 'calc(100vh - 100px)',
            background: 'rgba(20, 20, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Type size={20} style={{ color: 'var(--noor-secondary)' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Styles de texte</h3>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)'
                    }}
                >
                    ×
                </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

                {/* Typography Section */}
                <div style={{ marginBottom: '16px' }}>
                    <button
                        onClick={() => toggleSection('typography')}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            marginBottom: '8px'
                        }}
                    >
                        <Type size={18} style={{ color: 'var(--noor-secondary)' }} />
                        Typographie
                        <span style={{ marginLeft: 'auto' }}>
                            {expandedSection === 'typography' ? '▼' : '▶'}
                        </span>
                    </button>

                    {expandedSection === 'typography' && (
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                            {/* Font Family */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                    Police
                                </label>
                                <select
                                    value={fontFamily}
                                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                                    className="input-field"
                                    style={{ width: '100%', fontSize: '0.85rem', padding: '8px 12px' }}
                                >
                                    {FONT_FAMILIES.map(font => (
                                        <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                            {font.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Font Size */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                    Taille: {fontSize}px
                                </label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="range"
                                        min="10"
                                        max="72"
                                        value={fontSize}
                                        onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                                        style={{ flex: 1 }}
                                    />
                                    <input
                                        type="number"
                                        min="10"
                                        max="72"
                                        value={fontSize}
                                        onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                                        className="input-field"
                                        style={{ width: '60px', padding: '6px', textAlign: 'center' }}
                                    />
                                </div>
                            </div>

                            {/* Text Color */}
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                    Couleur du texte
                                </label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => handleChange('color', e.target.value)}
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            background: 'none'
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={color}
                                        onChange={(e) => handleChange('color', e.target.value)}
                                        className="input-field"
                                        style={{ flex: 1, padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Background Section */}
                <div style={{ marginBottom: '16px' }}>
                    <button
                        onClick={() => toggleSection('background')}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            marginBottom: '8px'
                        }}
                    >
                        <Palette size={18} style={{ color: 'var(--noor-secondary)' }} />
                        Arrière-plan
                        <span style={{ marginLeft: 'auto' }}>
                            {expandedSection === 'background' ? '▼' : '▶'}
                        </span>
                    </button>

                    {expandedSection === 'background' && (
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                            {/* Background Color */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                    Couleur de fond
                                </label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={backgroundColor === 'transparent' ? '#000000' : backgroundColor}
                                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            background: 'none'
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={backgroundColor}
                                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                        className="input-field"
                                        style={{ flex: 1, padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                                        placeholder="transparent"
                                    />
                                </div>
                            </div>

                            {/* Padding */}
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                    Espacement interne: {padding}px
                                </label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        value={padding}
                                        onChange={(e) => handleChange('padding', parseInt(e.target.value))}
                                        style={{ flex: 1 }}
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={padding}
                                        onChange={(e) => handleChange('padding', parseInt(e.target.value))}
                                        className="input-field"
                                        style={{ width: '60px', padding: '6px', textAlign: 'center' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Border Section */}
                <div style={{ marginBottom: '16px' }}>
                    <button
                        onClick={() => toggleSection('border')}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            marginBottom: '8px'
                        }}
                    >
                        <Square size={18} style={{ color: 'var(--noor-secondary)' }} />
                        Bordure
                        <span style={{ marginLeft: 'auto' }}>
                            {expandedSection === 'border' ? '▼' : '▶'}
                        </span>
                    </button>

                    {expandedSection === 'border' && (
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                            {/* Border Width */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                    Épaisseur: {borderWidth}px
                                </label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        value={borderWidth}
                                        onChange={(e) => handleChange('borderWidth', parseInt(e.target.value))}
                                        style={{ flex: 1 }}
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={borderWidth}
                                        onChange={(e) => handleChange('borderWidth', parseInt(e.target.value))}
                                        className="input-field"
                                        style={{ width: '60px', padding: '6px', textAlign: 'center' }}
                                    />
                                </div>
                            </div>

                            {/* Border Style */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                    Style de bordure
                                </label>
                                <select
                                    value={borderStyle}
                                    onChange={(e) => handleChange('borderStyle', e.target.value)}
                                    className="input-field"
                                    style={{ width: '100%', fontSize: '0.85rem', padding: '8px 12px' }}
                                >
                                    {BORDER_STYLES.map(style => (
                                        <option key={style.value} value={style.value}>
                                            {style.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Border Color */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                    Couleur de bordure
                                </label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={borderColor === 'transparent' ? '#000000' : borderColor}
                                        onChange={(e) => handleChange('borderColor', e.target.value)}
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            background: 'none'
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={borderColor}
                                        onChange={(e) => handleChange('borderColor', e.target.value)}
                                        className="input-field"
                                        style={{ flex: 1, padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                                        placeholder="transparent"
                                    />
                                </div>
                            </div>

                            {/* Border Radius */}
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                    Arrondi: {borderRadius}px
                                </label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        value={borderRadius}
                                        onChange={(e) => handleChange('borderRadius', parseInt(e.target.value))}
                                        style={{ flex: 1 }}
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={borderRadius}
                                        onChange={(e) => handleChange('borderRadius', parseInt(e.target.value))}
                                        className="input-field"
                                        style={{ width: '60px', padding: '6px', textAlign: 'center' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview */}
            <div style={{
                padding: '16px',
                borderTop: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.2)'
            }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Aperçu
                </div>
                <div style={{
                    fontFamily: fontFamily,
                    fontSize: `${fontSize}px`,
                    color: color,
                    backgroundColor: backgroundColor,
                    border: `${borderWidth}px ${borderStyle} ${borderColor}`,
                    borderRadius: `${borderRadius}px`,
                    padding: `${padding}px`,
                    textAlign: 'center'
                }}>
                    Exemple de texte
                </div>
            </div>
        </div>
    );
};

export default TextStylePanel;
