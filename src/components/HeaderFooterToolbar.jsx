import { Sliders, Columns, AlignLeft, AlignCenter, AlignRight, Plus, Trash2, ArrowLeftRight, Frame } from 'lucide-react';
import useCourseStore from '../stores/courseStore';
import ColorPicker from './ColorPicker';

const HeaderFooterToolbar = ({ type }) => {
    const { course, updateCourseMetadata } = useCourseStore();
    const playerConfig = course?.playerConfig || {};
    const layout = type === 'header' ? playerConfig.headerLayout : playerConfig.footerLayout;

    if (!layout || !layout.cells) return null;

    const updateLayout = (newFields) => {
        const configKey = type === 'header' ? 'headerLayout' : 'footerLayout';
        updateCourseMetadata({
            playerConfig: {
                ...course.playerConfig,
                [configKey]: { ...layout, ...newFields }
            }
        });
    };

    const addCell = () => {
        if (layout.cells.length >= 6) return;
        const totalSpan = layout.cells.reduce((sum, c) => sum + (parseInt(c.span) || 0), 0);
        const remaining = 12 - totalSpan;
        const newSpan = remaining > 0 ? Math.min(2, remaining) : 2;

        const newCell = {
            id: `${type === 'header' ? 'h' : 'f'}-cell-${Date.now()}`,
            span: newSpan,
            alignment: 'center'
        };
        updateLayout({ cells: [...layout.cells, newCell] });
    };

    const removeCell = (id) => {
        if (layout.cells.length <= 1) return;
        updateLayout({ cells: layout.cells.filter(c => c.id !== id) });
    };

    const updateCell = (id, fields) => {
        updateLayout({
            cells: layout.cells.map(c => c.id === id ? { ...c, ...fields } : c)
        });
    };

    return (
        <div className="layout-toolbar" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
        }}>
            {/* SECTION 1: PROPRIÉTÉS GLOBALES */}
            <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <Sliders size={16} color="var(--noor-secondary)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Propriétés Globales</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Hauteur */}
                    <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Hauteur (px)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="range"
                                min="40"
                                max="150"
                                value={layout.height || 60}
                                onChange={(e) => updateLayout({ height: parseInt(e.target.value) })}
                                style={{ flex: 1, accentColor: 'var(--noor-secondary)' }}
                            />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '35px' }}>{layout.height}px</span>
                        </div>
                    </div>

                    {/* Padding */}
                    <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Marge Interne (Padding)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="range"
                                min="0"
                                max="60"
                                value={layout.padding ?? 10}
                                onChange={(e) => updateLayout({ padding: parseInt(e.target.value) })}
                                style={{ flex: 1, accentColor: 'var(--noor-secondary)' }}
                            />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '35px' }}>{layout.padding ?? 10}px</span>
                        </div>
                    </div>

                    {/* Gap */}
                    <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Espacement (Gap)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="range"
                                min="0"
                                max="40"
                                value={layout.gap ?? 4}
                                onChange={(e) => updateLayout({ gap: parseInt(e.target.value) })}
                                style={{ flex: 1, accentColor: 'var(--noor-secondary)' }}
                            />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '35px' }}>{layout.gap ?? 4}px</span>
                        </div>
                    </div>
                </div>

                <div style={{ height: '1px', background: 'var(--glass-border)' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Background */}
                    <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Arrière-plan</label>
                        <ColorPicker
                            color={layout.background}
                            onChange={(color) => updateLayout({ background: color })}
                        />
                    </div>

                    {/* Bordure */}
                    <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Couleur Bordure</label>
                        <ColorPicker
                            color={layout.borderColor}
                            onChange={(color) => updateLayout({ borderColor: color })}
                        />
                    </div>
                </div>

                <div style={{ height: '1px', background: 'var(--glass-border)' }} />

                {/* Toggles */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                        onClick={() => updateLayout({ isCard: !layout.isCard })}
                        style={{
                            padding: '10px',
                            background: layout.isCard ? 'rgba(123, 97, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                            border: '1px solid',
                            borderColor: layout.isCard ? 'var(--noor-secondary)' : 'var(--glass-border)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            color: layout.isCard ? 'white' : 'var(--text-muted)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            transition: 'all 0.2s'
                        }}
                    >
                        <Frame size={14} color={layout.isCard ? 'var(--noor-secondary)' : 'currentColor'} />
                        Mode Floating Card
                    </button>

                    <button
                        onClick={() => updateLayout({ isRTL: !layout.isRTL })}
                        style={{
                            padding: '10px',
                            background: layout.isRTL ? 'rgba(72, 232, 167, 0.15)' : 'rgba(255,255,255,0.03)',
                            border: '1px solid',
                            borderColor: layout.isRTL ? '#48e8a7' : 'var(--glass-border)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            color: layout.isRTL ? 'white' : 'var(--text-muted)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            transition: 'all 0.2s'
                        }}
                    >
                        <ArrowLeftRight size={14} color={layout.isRTL ? '#48e8a7' : 'currentColor'} />
                        Mode RTL (Droit)
                    </button>
                </div>
            </div>

            {/* SECTION 2: GRILLE & COLONNES */}
            <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Columns size={16} color="var(--noor-secondary)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Colonnes de la Grille</span>
                    </div>
                    <button onClick={addCell} disabled={layout.cells.length >= 6} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}>
                        <Plus size={14} /> Ajouter
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {layout.cells.map((cell, index) => (
                        <div key={cell.id} style={{
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '12px',
                            padding: '12px',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900 }}>
                                {index + 1}
                            </div>

                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Largeur (Span)</label>
                                <select
                                    value={cell.span}
                                    onChange={(e) => updateCell(cell.id, { span: parseInt(e.target.value) })}
                                    style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(s => (
                                        <option key={s} value={s} style={{ background: '#12152d' }}>{s} / 12 unités</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px' }}>
                                <button onClick={() => updateCell(cell.id, { alignment: 'left' })} className={`btn-icon-sm ${cell.alignment === 'left' ? 'active' : ''}`} style={{ background: cell.alignment === 'left' ? 'var(--noor-secondary)' : 'transparent', border: 'none' }}><AlignLeft size={12} /></button>
                                <button onClick={() => updateCell(cell.id, { alignment: 'center' })} className={`btn-icon-sm ${cell.alignment === 'center' ? 'active' : ''}`} style={{ background: cell.alignment === 'center' ? 'var(--noor-secondary)' : 'transparent', border: 'none' }}><AlignCenter size={12} /></button>
                                <button onClick={() => updateCell(cell.id, { alignment: 'right' })} className={`btn-icon-sm ${cell.alignment === 'right' ? 'active' : ''}`} style={{ background: cell.alignment === 'right' ? 'var(--noor-secondary)' : 'transparent', border: 'none' }}><AlignRight size={12} /></button>
                            </div>

                            <button onClick={() => removeCell(cell.id)} style={{ padding: '8px', background: 'transparent', border: 'none', color: '#ff4757', cursor: 'pointer' }}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                    Total: {layout.cells.reduce((sum, c) => sum + (parseInt(c.span) || 0), 0)} / 12
                </div>
            </div>
        </div>
    );
};

export default HeaderFooterToolbar;
