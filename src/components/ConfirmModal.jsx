import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Supprimer', cancelText = 'Annuler', type = 'danger' }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay" onClick={onClose} style={{ pointerEvents: 'auto' }}>
                    <motion.div
                        className="modal-content"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: '24px',
                                right: '24px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={20} />
                        </button>

                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '14px',
                            background: type === 'danger' ? 'rgba(255, 71, 87, 0.1)' : 'rgba(72, 52, 212, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '24px',
                            color: type === 'danger' ? 'var(--noor-accent)' : 'var(--noor-primary)'
                        }}>
                            <AlertTriangle size={24} />
                        </div>

                        <h3 className="modal-title">{title}</h3>
                        <p className="modal-description">{message}</p>

                        <div className="modal-actions">
                            <button
                                className="btn-secondary"
                                onClick={onClose}
                                style={{ padding: '12px 24px' }}
                            >
                                {cancelText}
                            </button>
                            <button
                                className={type === 'danger' ? 'btn-primary' : 'btn-primary'}
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                style={{
                                    padding: '12px 24px',
                                    background: type === 'danger' ? 'var(--noor-accent)' : 'var(--noor-primary)',
                                    borderColor: type === 'danger' ? 'var(--noor-accent)' : 'var(--noor-primary)'
                                }}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
