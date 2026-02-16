import { Sliders, Columns, AlignLeft, AlignCenter, AlignRight, Globe, Plus, Trash2, ArrowLeftRight } from 'lucide-react';
import useCourseStore from '../stores/courseStore';

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
        const totalSpan = layout.cells.reduce((sum, c) => sum + c.span, 0);
        const remaining = 12 - totalSpan;
        const newSpan = remaining > 0 ? Math.min(2, remaining) : 2;

        // If no space, we might need to reduce others, but for now let's just add if space
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
            background: 'rgba(18, 21, 45, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Columns size={18} color="white" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Structure de {type === 'header' ? "l'en-tête" : "du pied de page"}</h3>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => updateLayout({ isRTL: !layout.isRTL })}
                        className={`btn-icon ${layout.isRTL ? 'active' : ''}`}
                        title="Mode RTL (Droite à gauche)"
                        style={{
                            background: layout.isRTL ? 'var(--noor-secondary)' : 'rgba(255,255,255,0.05)',
                            color: layout.isRTL ? 'white' : 'var(--text-muted)'
                        }}
                    >
                        <ArrowLeftRight size={18} />
                    </button>
                    <button onClick={addCell} disabled={layout.cells.length >= 6} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}>
                        <Plus size={14} /> Ajouter une cellule
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${layout.cells.length}, 1fr)`, gap: '12px' }}>
                {layout.cells.map((cell, index) => (
                    <div key={cell.id} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--noor-secondary)' }}>CELLULE {index + 1}</span>
                            <button onClick={() => removeCell(cell.id)} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#ff4757', cursor: 'pointer', opacity: 0.6 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Largeur (sur 12)</label>
                            <input
                                type="number"
                                min="1"
                                max="12"
                                value={cell.span}
                                onChange={(e) => updateCell(cell.id, { span: parseInt(e.target.value) || 1 })}
                                style={{
                                    width: '100%',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '6px',
                                    color: 'white',
                                    padding: '4px 8px',
                                    fontSize: '0.85rem'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Alignement</label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                    onClick={() => updateCell(cell.id, { alignment: 'left' })}
                                    className={`btn-icon-sm ${cell.alignment === 'left' ? 'active' : ''}`}
                                    style={{ flex: 1, background: cell.alignment === 'left' ? 'rgba(123, 97, 255, 0.2)' : 'transparent', borderColor: cell.alignment === 'left' ? 'var(--noor-secondary)' : 'var(--glass-border)' }}
                                >
                                    <AlignLeft size={14} />
                                </button>
                                <button
                                    onClick={() => updateCell(cell.id, { alignment: 'center' })}
                                    className={`btn-icon-sm ${cell.alignment === 'center' ? 'active' : ''}`}
                                    style={{ flex: 1, background: cell.alignment === 'center' ? 'rgba(123, 97, 255, 0.2)' : 'transparent', borderColor: cell.alignment === 'center' ? 'var(--noor-secondary)' : 'var(--glass-border)' }}
                                >
                                    <AlignCenter size={14} />
                                </button>
                                <button
                                    onClick={() => updateCell(cell.id, { alignment: 'right' })}
                                    className={`btn-icon-sm ${cell.alignment === 'right' ? 'active' : ''}`}
                                    style={{ flex: 1, background: cell.alignment === 'right' ? 'rgba(123, 97, 255, 0.2)' : 'transparent', borderColor: cell.alignment === 'right' ? 'var(--noor-secondary)' : 'var(--glass-border)' }}
                                >
                                    <AlignRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                Total: {layout.cells.reduce((sum, c) => sum + (parseInt(c.span) || 0), 0)} / 12 unités
                {layout.cells.reduce((sum, c) => sum + (parseInt(c.span) || 0), 0) !== 12 &&
                    <span style={{ color: '#ff4757', marginLeft: '8px' }}>Attention: Le total devrait idéalement faire 12.</span>
                }
            </div>
        </div>
    );
};

export default HeaderFooterToolbar;
