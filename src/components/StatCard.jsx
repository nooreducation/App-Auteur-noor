import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, color, trend }) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="stat-card"
            style={{
                background: 'rgba(18, 21, 45, 0.4)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '80px',
                height: '80px',
                background: color,
                filter: 'blur(40px)',
                opacity: 0.1,
                zIndex: 0
            }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: `rgba(${color === 'var(--noor-primary)' ? '72, 52, 212' : (color === 'var(--noor-secondary)' ? '123, 97, 255' : '255, 71, 87')}, 0.1)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color
                }}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: trend.startsWith('+') ? 'var(--noor-success)' : 'var(--noor-accent)',
                        background: trend.startsWith('+') ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '6px'
                    }}>
                        {trend}
                    </span>
                )}
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>{title}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>{value}</div>
            </div>
        </motion.div>
    );
};

export default StatCard;
