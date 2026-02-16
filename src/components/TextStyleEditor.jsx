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

const TextStyleEditor = ({ component, onStyleChange }) => {
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Typography Section */}
            <div>
                <button
                    onClick={() => toggleSection('typography')}
                    style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        marginBottom: '8px'
                    }}
                >
                    <Type size={16} style={{ color: 'var(--noor-secondary)' }} />
                    Typographie
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                        {expandedSection === 'typography' ? '▼' : '▶'}
                    </span>
                </button>

                {expandedSection === 'typography' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Font Family */}
                        <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                                Police
                            </label>
                            <select
                                value={fontFamily}
                                onChange={(e) => handleChange('fontFamily', e.target.value)}
                                className="input-field"
                                style={{ width: '100%', fontSize: '0.75rem', padding: '6px 10px' }}
                            >
                                {FONT_FAMILIES.map(font => (
                                    <option key={font.value} value={font.value}>
                                        {font.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Font Size */}
                        <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                                Taille: {fontSize}px
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="72"
                                value={fontSize}
                                onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                                style={{ width: '100%' }}
                            />
                        </div>

                        {/* Text Color */}
                        <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                                Couleur
                            </label>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => handleChange('color', e.target.value)}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                />
                                <input
                                    type="text"
                                    value={color}
                                    onChange={(e) => handleChange('color', e.target.value)}
                                    className="input-field"
                                    style={{ flex: 1, padding: '6px 10px', fontFamily: 'monospace', fontSize: '0.7rem' }}
                                    placeholder="#ffffff"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Background Section */}
            <div>
                <button
                    onClick={() => toggleSection('background')}
                    style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        marginBottom: '8px'
                    }}
                >
                    <Palette size={16} style={{ color: 'var(--noor-secondary)' }} />
                    Arrière-plan
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                        {expandedSection === 'background' ? '▼' : '▶'}
                    </span>
                </button>

                {expandedSection === 'background' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Background Color */}
                        <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                                Couleur de fond
                            </label>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <input
                                    type="color"
                                    value={backgroundColor === 'transparent' ? '#000000' : backgroundColor}
                                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                />
                                <input
                                    type="text"
                                    value={backgroundColor}
                                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                    className="input-field"
                                    style={{ flex: 1, padding: '6px 10px', fontFamily: 'monospace', fontSize: '0.7rem' }}
                                    placeholder="transparent"
                                />
                            </div>
                        </div>

                        {/* Padding */}
                        <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                                Espacement: {padding}px
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                value={padding}
                                onChange={(e) => handleChange('padding', parseInt(e.target.value))}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Border Section */}
            <div>
                <button
                    onClick={() => toggleSection('border')}
                    style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        marginBottom: '8px'
                    }}
                >
                    <Square size={16} style={{ color: 'var(--noor-secondary)' }} />
                    Bordure
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                        {expandedSection === 'border' ? '▼' : '▶'}
                    </span>
                </button>

                {expandedSection === 'border' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Border Width */}
                        <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                                Épaisseur: {borderWidth}px
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                value={borderWidth}
                                onChange={(e) => handleChange('borderWidth', parseInt(e.target.value))}
                                style={{ width: '100%' }}
                            />
                        </div>

                        {/* Border Style */}
                        <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                                Style
                            </label>
                            <select
                                value={borderStyle}
                                onChange={(e) => handleChange('borderStyle', e.target.value)}
                                className="input-field"
                                style={{ width: '100%', fontSize: '0.75rem', padding: '6px 10px' }}
                            >
                                {BORDER_STYLES.map(style => (
                                    <option key={style.value} value={style.value}>
                                        {style.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Border Color */}
                        <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                                Couleur
                            </label>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <input
                                    type="color"
                                    value={borderColor === 'transparent' ? '#000000' : borderColor}
                                    onChange={(e) => handleChange('borderColor', e.target.value)}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                />
                                <input
                                    type="text"
                                    value={borderColor}
                                    onChange={(e) => handleChange('borderColor', e.target.value)}
                                    className="input-field"
                                    style={{ flex: 1, padding: '6px 10px', fontFamily: 'monospace', fontSize: '0.7rem' }}
                                    placeholder="transparent"
                                />
                            </div>
                        </div>

                        {/* Border Radius */}
                        <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                                Arrondi: {borderRadius}px
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                value={borderRadius}
                                onChange={(e) => handleChange('borderRadius', parseInt(e.target.value))}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextStyleEditor;
