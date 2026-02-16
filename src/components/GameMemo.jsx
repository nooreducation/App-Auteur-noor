import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Grid } from 'lucide-react';

const GameMemo = ({ component, isPreview = true }) => {
    const pairs = component.pairs || [];
    const [flippedCards, setFlippedCards] = useState([]);
    const [matchedPairs, setMatchedPairs] = useState([]);
    const [canFlip, setCanFlip] = useState(true);

    // On utilise une clé basée sur le contenu des paires pour réinitialiser le jeu si l'auteur modifie les cartes.
    const pairsKey = JSON.stringify(pairs);

    const deck = useMemo(() => {
        const deckData = [];
        pairs.forEach((pair, idx) => {
            // On s'assure que les IDs sont uniques et stables pour cette configuration de paires
            deckData.push({ id: `img-${idx}`, type: 'image', content: pair.imageUrl, pairId: idx });
            deckData.push({ id: `txt-${idx}`, type: 'text', content: pair.text, pairId: idx });
        });
        // On mélange seulement à la création ou au changement des paires
        return [...deckData].sort(() => Math.random() - 0.5);
    }, [pairsKey]);

    // Réinitialiser le jeu si les paramètres changent (colonnes, paires, etc)
    useEffect(() => {
        setFlippedCards([]);
        setMatchedPairs([]);
        setCanFlip(true);
    }, [pairsKey, component.gridColumns]);

    useEffect(() => {
        if (flippedCards.length === 2) {
            setCanFlip(false);
            const [firstId, secondId] = flippedCards;

            const firstCard = deck.find(c => c.id === firstId);
            const secondCard = deck.find(c => c.id === secondId);

            if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
                // Bonne paire
                const timer = setTimeout(() => {
                    setMatchedPairs(prev => [...prev, firstCard.pairId]);
                    setFlippedCards([]);
                    setCanFlip(true);
                }, 1000);
                return () => clearTimeout(timer);
            } else {
                // Mauvaise paire
                const timer = setTimeout(() => {
                    setFlippedCards([]);
                    setCanFlip(true);
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [flippedCards, deck]);

    const handleCardClick = (cardId) => {
        // En mode édition, on autorise quand même le test pour l'auteur ? 
        // L'utilisateur dit que ça ne marche pas, donc on s'assure que l'interaction est active.

        if (!canFlip) return;
        if (flippedCards.includes(cardId)) return;

        const card = deck.find(c => c.id === cardId);
        if (matchedPairs.includes(card?.pairId)) return;
        if (flippedCards.length >= 2) return;

        setFlippedCards(prev => [...prev, cardId]);
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            boxSizing: 'border-box',
            overflow: 'auto',
            perspective: '1000px' // Important pour l'effet 3D
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexShrink: 0 }}>
                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(123, 97, 255, 0.1)' }}>
                    <Grid size={18} style={{ color: 'var(--noor-secondary)' }} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{component.text || "Jeu de Mémoire"}</h3>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${component.gridColumns || 4}, 1fr)`,
                gap: '16px',
                width: '100%',
                gridAutoRows: 'minmax(150px, 1fr)'
            }}>
                {deck.map((card) => {
                    const isFlipped = flippedCards.includes(card.id) || matchedPairs.includes(card.pairId);
                    const isMatched = matchedPairs.includes(card.pairId);

                    return (
                        <div
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            style={{
                                aspectRatio: '1',
                                position: 'relative',
                                cursor: isFlipped ? 'default' : 'pointer',
                                transformStyle: 'preserve-3d',
                                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                            }}
                        >
                            {/* Face ARRIÈRE (la face qu'on voit au début - cachant le contenu) */}
                            <div style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                backfaceVisibility: 'hidden',
                                background: 'linear-gradient(135deg, var(--noor-primary), var(--noor-secondary))',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid rgba(255,255,255,0.1)',
                                zIndex: 2
                            }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', opacity: 0.3 }}>?</div>
                            </div>

                            {/* Face AVANT (le contenu révélé) */}
                            <div style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                                background: isMatched ? 'linear-gradient(135deg, #2ed573, #7bed9f)' : 'white',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '12px',
                                border: '2px solid rgba(0,0,0,0.1)',
                                boxSizing: 'border-box',
                                zIndex: 1
                            }}>
                                {card.type === 'image' && card.content ? (
                                    <img src={card.content} alt="Carte" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{
                                        fontSize: '1.2rem',
                                        fontWeight: 800,
                                        color: isMatched ? 'white' : 'var(--noor-primary)',
                                        textAlign: 'center',
                                        wordBreak: 'break-word'
                                    }}>
                                        {card.content}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {matchedPairs.length === pairs.length && pairs.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginTop: '20px',
                        padding: '16px',
                        background: 'linear-gradient(135deg, #2ed573, #7bed9f)',
                        borderRadius: '16px',
                        textAlign: 'center',
                        fontWeight: 800,
                        color: 'white',
                        fontSize: '1.2rem'
                    }}
                >
                    🎉 Bravo ! Toutes les paires trouvées !
                </motion.div>
            )}
        </div>
    );
};

export default React.memo(GameMemo);
