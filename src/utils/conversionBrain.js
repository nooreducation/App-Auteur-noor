import { supabase } from '../lib/supabase';

/**
 * Le Cerveau de Conversion (Conversion Brain)
 * Gère l'apprentissage et l'évolution des templates dans le Cloud.
 */

export const ConversionBrain = {
    /**
     * Génère une signature unique (ADN) basée sur les clés du JSON.
     * Permet d'identifier un type de données même sans nom explicite.
     */
    generateSignature: (data) => {
        if (!data || typeof data !== 'object') return 'empty';
        const keys = Object.keys(data).sort().join('|');
        // On peut ajouter une logique plus profonde si nécessaire
        return `struct:${keys}`;
    },

    /**
     * Nettoie un document HTML complet pour n'en extraire que la substance utile.
     * Utile quand l'utilisateur colle un document complet généré par une IA.
     */
    cleanHTML: (html) => {
        if (!html) return '';

        // Si ce n'est pas un document complet, on renvoie tel quel
        if (!html.includes('<html') && !html.includes('<body')) return html.trim();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        let cleaned = '';

        // 1. Extraire les styles
        const styles = Array.from(doc.querySelectorAll('style'));
        styles.forEach(s => { cleaned += s.outerHTML + '\n'; });

        // 2. Extraire le contenu du body (sans les balises body elles-mêmes)
        cleaned += doc.body.innerHTML + '\n';

        // 3. Extraire les scripts
        const scripts = Array.from(doc.querySelectorAll('script'));
        scripts.forEach(s => { cleaned += s.outerHTML + '\n'; });

        return cleaned.trim();
    },

    /**
     * Génère une signature pour une page entière basée sur tous les addons présents.
     */
    generatePageSignature: (activities) => {
        if (!activities || activities.length === 0) return 'page:empty';
        const addons = activities
            .map(a => a.addonId || a.type)
            .filter(Boolean)
            .sort()
            .join('+');
        return `page:${addons}`;
    },

    /**
     * Recherche une règle apprise dans Supabase.
     */
    fetchRule: async (signature, addonId = null) => {
        try {
            // On cherche par signature d'abord, ou par addonId
            let query = supabase
                .from('conversion_rules')
                .select('*');

            if (addonId) {
                query = query.or(`signature.eq.${signature},addon_id.eq.${addonId}`);
            } else {
                query = query.eq('signature', signature);
            }

            const { data, error } = await query.maybeSingle(); // maybeSingle évite l'erreur si 0 lignes
            if (error) return null;
            return data;
        } catch (e) {
            console.error("Brain fetch error:", e);
            return null;
        }
    },

    /**
     * Enregistre un nouvel apprentissage dans le Cloud.
     */
    learn: async (signature, addonId, htmlTemplate) => {
        try {
            // Nettoyage automatique avant sauvegarde
            const cleanTemplate = ConversionBrain.cleanHTML(htmlTemplate);

            const { data, error } = await supabase
                .from('conversion_rules')
                .upsert({
                    signature,
                    addon_id: addonId,
                    html_template: cleanTemplate,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'signature' })
                .select();

            if (error) throw error;
            return data[0];
        } catch (e) {
            console.error("Brain learning error:", e);
            throw e;
        }
    },

    /**
     * Liste des signatures connues basées sur le Skill: noor-smart-importer
     */
    KNOWN_SIGNATURES: {
        'struct:LeftItems|RightItems|Text': 'CONNECTING',
        'struct:Items|Text': 'ORDERING',
        'struct:Pairs|Text': 'MEMORY_GAME',
        'struct:Content|Text': 'KARAOKE',
        'struct:SelectionCorrect|Text': 'IDENTIFICATION',
        'struct:URL|VideoUrl': 'VIDEO'
    },

    /**
     * Tente de deviner le type de module Noor basé sur la signature des propriétés.
     */
    guessType: (properties) => {
        const sig = ConversionBrain.generateSignature(properties);
        // Correspondance exacte
        if (ConversionBrain.KNOWN_SIGNATURES[sig]) return ConversionBrain.KNOWN_SIGNATURES[sig];

        // Correspondance partielle (si une clé importante est présente)
        const keys = Object.keys(properties || {});
        if (keys.includes('LeftItems') && keys.includes('RightItems')) return 'CONNECTING';
        if (keys.includes('Pairs')) return 'MEMORY_GAME';
        if (keys.includes('SelectionCorrect')) return 'IDENTIFICATION';

        return 'UNCATEGORIZED';
    },

    /**
     * Injecte les données dans un template appris.
     * Utilise des placeholders simples style {{variable}}.
     */
    render: (template, data) => {
        let rendered = template;

        // Remplacement sécurisé (évite l'interprétation des $ par .replace)
        Object.keys(data).forEach(key => {
            const value = data[key];
            const placeholder = new RegExp(`{{${key}}}`, 'g');

            if (typeof value === 'object' && value !== null) {
                // Pour les objets, on injecte le JSON
                const jsonStr = JSON.stringify(value);
                rendered = rendered.replace(placeholder, () => jsonStr);
            } else {
                // Pour les strings, on injecte tel quel sans interpréter les $
                rendered = rendered.replace(placeholder, () => value || '');
            }
        });

        // Injection du JSON brut global
        rendered = rendered.replace(/{{RAW_JSON}}/g, () => JSON.stringify(data));

        return rendered;
    }
};
