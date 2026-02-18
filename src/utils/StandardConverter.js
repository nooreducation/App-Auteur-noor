import { ConversionBrain } from './conversionBrain';

/**
 * StandardConverter.js
 * Service centralisé et robuste pour la conversion des formats SCORM/mAuthor en JSON standardisé.
 * Centralise toute la logique d'extraction autrefois située dans SCORMImporter.jsx.
 */

export const StandardConverter = {

    /**
     * Point d'entrée unique pour la conversion.
     */
    convert: (content, type = 'mAuthor', pagePath = '') => {
        if (!content) return null;

        let metadata = null;
        if (type === 'mAuthor' || content.trim().startsWith('<?xml')) {
            metadata = StandardConverter.parseMAuthorXML(content);
        } else if (type === 'html' || content.trim().toLowerCase().includes('<html')) {
            metadata = StandardConverter.parseHTML(content, pagePath);
        }

        if (metadata && StandardConverter.validate(metadata)) {
            return metadata;
        }

        console.warn("⚠️ StandardConverter: Validation failed or no metadata produced.");
        return metadata;
    },

    // --- HELPERS TECHNIQUES (Normalisation & Nettoyage) ---

    cleanText: (text) => {
        if (!text) return "";
        return text
            .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
            .replace(/&nbsp;/g, ' ')
            .replace(/<[^>]*>?/gm, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    },

    cleanRaw: (html) => {
        if (!html) return "";
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return (doc.body.textContent || doc.body.innerText || html).replace(/&nbsp;/g, ' ').trim();
    },

    extractContent: (html) => {
        if (!html) return "";
        const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) return imgMatch[1];
        return StandardConverter.cleanText(html);
    },

    detectDirection: (text) => {
        if (!text) return 'rtl';
        const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        return arabicPattern.test(text) ? 'rtl' : 'ltr';
    },

    mapType: (mAuthorType) => {
        const mapping = {
            'text': 'PARAGRAPH',
            'image': 'SPLASH',
            'video': 'VIDEO',
            'choice': 'CHOICE',
            'text_identification': 'CHOICE',
            'truefalse': 'TRUE_FALSE',
            'connection': 'CONNECTING',
            'ordering': 'ORDERING',
            'text_selection': 'TEXT_SELECT',
            'limited_selection': 'CHOICE',
            'external_link_button': 'STORY'
        };
        const type = String(mAuthorType).toLowerCase();
        for (const [key, val] of Object.entries(mapping)) {
            if (type.includes(key)) return val;
        }
        return 'UNCATEGORIZED';
    },

    /**
     * Valide la structure du JSON de sortie.
     */
    validate: (metadata) => {
        if (!metadata || typeof metadata !== 'object') return false;
        if (!metadata.version || !Array.isArray(metadata.activities)) return false;

        // Vérification sommaire des activités
        return metadata.activities.every(act => {
            const hasBasicInfo = act.id && act.type && act.instruction;
            const hasDataOrProps = act.data || act.properties;
            return hasBasicInfo && hasDataOrProps;
        });
    },

    // --- LOGIQUE D'EXTRACTION M-AUTHOR (XML) ---

    parseMAuthorXML: (xmlContent) => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlContent, "text/xml");

        const metadata = {
            version: "3.0",
            timestamp: new Date().toISOString(),
            page: xml.querySelector('page')?.getAttribute('name') || "Sans titre",
            activities: [],
            uncategorized_modules: []
        };

        const allTextModules = Array.from(xml.querySelectorAll('textModule'));

        // 1. Détection de la consigne globale
        const instructionMod = allTextModules.find(m => {
            const id = m.getAttribute('id');
            const txt = m.querySelector('text')?.textContent || "";
            return (id?.toLowerCase().includes('consigne') || id === 'TextC' || id === 'Text2') && !txt.includes('{{');
        });
        const globalInstruction = StandardConverter.cleanText(instructionMod?.querySelector('text')?.textContent || "");

        // 2. Scan de tous les modules
        const allModules = Array.from(xml.querySelectorAll('textModule, addonModule, module, addon'));

        allModules.forEach(mod => {
            const addonId = mod.getAttribute('addonId') || mod.tagName;
            const id = mod.getAttribute('id');
            const properties = {};

            // Extraction des propriétés standard
            Array.from(mod.querySelectorAll('property')).forEach(p => {
                const name = p.getAttribute('name');
                if (name) properties[name] = p.getAttribute('value') || p.textContent;
            });

            // Extraction du texte/contenu brut
            const content = mod.querySelector('text, content')?.textContent || properties.Text || properties.Content || "";
            if (content && !properties.Text) properties.Text = content;

            // Éviter de traiter la consigne comme une activité séparée
            if (id === instructionMod?.getAttribute('id')) return;

            // Dispatcher vers les parseurs spécialisés ou fallback
            const result = StandardConverter.dispatchMAuthorParser(addonId, properties, mod, globalInstruction);

            if (result) {
                metadata.activities.push({
                    id: id || Math.random().toString(36).substr(2, 9),
                    originalType: addonId || "mAuthorModule",
                    ...result,
                    properties
                });
            } else {
                // FALLBACK INTELLIGENT (Smart Discovery)
                const guessedType = ConversionBrain.guessType(properties);
                if (guessedType !== 'UNCATEGORIZED') {
                    metadata.activities.push({
                        id: id || Math.random().toString(36).substr(2, 9),
                        originalType: addonId || "mAuthorGuessed",
                        type: guessedType,
                        instruction: globalInstruction || "تمرين جديد:",
                        data: properties,
                        properties,
                        isGuessed: true
                    });
                } else {
                    metadata.uncategorized_modules.push({
                        id: id || Math.random().toString(36).substr(2, 9),
                        addonId: addonId || mod.tagName,
                        properties
                    });
                }
            }
        });

        // 3. Post-processing (Groupement QCM, etc.)
        metadata.activities = StandardConverter.postProcessActivities(metadata.activities);

        return metadata;
    },

    dispatchMAuthorParser: (addonId, props, mod, globalInstruction) => {
        // --- TEXT EVIDENCE (Text_Selection) ---
        if (addonId === "Text_Selection") {
            let raw = props.Text || "";
            const corrections = [];
            raw = raw.replace(/\\correct\{([^\}]+)\}/g, (m, p1) => {
                corrections.push(StandardConverter.cleanRaw(p1));
                return `___CORRECT_${corrections.length - 1}___`;
            });
            raw = StandardConverter.cleanRaw(raw);
            corrections.forEach((val, i) => raw = raw.replace(`___CORRECT_${i}___`, `\\correct{${val}}`));

            const segments = [];
            const regex = /\\correct\{([^\}]+)\}/g;
            let match, lastIdx = 0;
            while ((match = regex.exec(raw)) !== null) {
                if (match.index > lastIdx) {
                    raw.substring(lastIdx, match.index).split(/(\s+)/).forEach(part => {
                        if (part.trim()) segments.push({ type: "selectable", content: part, isCorrect: false });
                        else if (part) segments.push({ type: "text", content: part });
                    });
                }
                match[1].split(/(\s+)/).forEach(part => {
                    if (part.trim()) segments.push({ type: "selectable", content: part.trim(), isCorrect: true });
                    else if (part) segments.push({ type: "text", content: part });
                });
                lastIdx = regex.lastIndex;
            }
            raw.substring(lastIdx).split(/(\s+)/).forEach(part => {
                if (part.trim()) segments.push({ type: "selectable", content: part, isCorrect: false });
                else if (part) segments.push({ type: "text", content: part });
            });
            return { type: "TEXT_EVIDENCE", instruction: globalInstruction, data: { segments } };
        }

        // --- CONNECTING ---
        if (addonId === "Connection" || addonId === "Connecting") {
            return {
                type: "CONNECTING",
                instruction: "أَرْبُطُ بِمَا يُنَاسِبُ:",
                data: {
                    left: (props.LeftItems || "").split('\n').filter(x => x.trim()),
                    right: (props.RightItems || "").split('\n').filter(x => x.trim())
                }
            };
        }

        // --- ORDERING ---
        if (addonId === "Ordering") {
            return {
                type: "ORDERING",
                instruction: "أُرَتِّبُ مَا يَلِي:",
                data: { items: (props.Items || "").split('\n').filter(x => x.trim()) }
            };
        }

        // --- KARAOKE ---
        if (addonId === "Speech_Recognition" || (mod.getAttribute('id') || "").toLowerCase().includes('karaoke')) {
            return {
                type: "KARAOKE",
                instruction: "أَسْتَمِعُ وَأُكَرِّرُ:",
                data: { text: props.Text || props.Content || "" }
            };
        }

        // --- QCM TEMP (Text Identification) ---
        if (addonId === "text_identification") {
            const top = parseInt(mod.querySelector('layouts > layout > absolute')?.getAttribute('top') || '0');
            return {
                type: "PICK_ONE_TEMP",
                question_hint: "find_near_y", // Sera résolu en post-process
                option: { label: StandardConverter.cleanRaw(props.Text || ""), isCorrect: props.SelectionCorrect === 'True' },
                posY: top,
                element: mod // Pour trouver le voisin
            };
        }

        // --- VIDEO ---
        if (addonId === "YouTube_Addon" || addonId == "Video") {
            let videoId = "";
            const url = props.URL || props.VideoUrl || "";
            if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
            else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
            return { type: "VIDEO", instruction: "أُشَاهِدُ وَأَسْتَمِعُ:", data: { url, videoId } };
        }

        // --- MEMORY_GAME ---
        const isMemory = addonId.toLowerCase().includes('memo') || addonId.toLowerCase().includes('memory');
        if (isMemory) {
            const cards = [];
            const config = {
                columns: parseInt(props.Columns || 4),
                rows: parseInt(props.Rows || 3),
                style_a_cover: props["Image for style A"] || "",
                style_b_cover: props["Image for style B"] || ""
            };

            for (let i = 1; i <= 20; i++) {
                const suffix = i === 1 ? "" : ` ${i}`;
                const aText = props[`A (text)${suffix}`] || props[`Item A${suffix}`] || props[`Pair A${suffix}`];
                const aImg = props[`A (image)${suffix}`];
                const bText = props[`B (text)${suffix}`] || props[`Item B${suffix}`] || props[`Pair B${suffix}`];
                const bImg = props[`B (image)${suffix}`];

                if (aText || aImg) {
                    cards.push({ id: i, type: aImg ? "img" : "txt", val: aImg || aText });
                }
                if (bText || bImg) {
                    cards.push({ id: i, type: bImg ? "img" : "txt", val: bImg || bText });
                }
            }

            return {
                type: "MEMORY_GAME",
                instruction: globalInstruction || "أَتَسَلَّى : أَخْتَارُ الْكَلِمَةَ وَ الصُّورَةَ الْمُنَاسِبَةَ لَهَا .",
                config,
                cards
            };
        }

        return null;
    },

    /**
     * Convertit le format interne Noor en format Gemini-Style aplati.
     */
    toGeminiJSON: (metadata, forcedActivity = null) => {
        if (!metadata) return null;

        // Si on force une activité (pour l'enseignement d'un module spécifique)
        const mainActivity = forcedActivity || metadata.activities.find(a =>
            !['PARAGRAPH', 'SPLASH', 'VIDEO'].includes(a.type)
        ) || metadata.activities[0];

        if (!mainActivity) return metadata;

        const gemini = {
            version: metadata.version || "3.0",
            page: metadata.page || "Sans titre",
            activity_type: mainActivity.type,
            instruction: mainActivity.instruction,
            config: mainActivity.config || {},
            cards: mainActivity.cards || [],
            audio: {}
        };

        // RÉPARATION : Si c'est un Memory Game "deviné" sans cards pré-remplies
        if (gemini.activity_type === 'MEMORY_GAME' && gemini.cards.length === 0) {
            const props = mainActivity.properties || mainActivity.data || {};
            const cards = [];
            const config = {
                columns: parseInt(props.Columns || 4),
                rows: parseInt(props.Rows || 3),
                style_a_cover: props["Image for style A"] || "",
                style_b_cover: props["Image for style B"] || ""
            };

            for (let i = 1; i <= 20; i++) {
                const suffix = i === 1 ? "" : ` ${i}`;
                const aText = props[`A (text)${suffix}`] || props[`Item A${suffix}`] || props[`Pair A${suffix}`];
                const aImg = props[`A (image)${suffix}`];
                const bText = props[`B (text)${suffix}`] || props[`Item B${suffix}`] || props[`Pair B${suffix}`];
                const bImg = props[`B (image)${suffix}`];

                if (aText || aImg) cards.push({ id: i, type: aImg ? "img" : "txt", val: aImg || aText });
                if (bText || bImg) cards.push({ id: i, type: bImg ? "img" : "txt", val: bImg || bText });
            }
            gemini.config = config;
            gemini.cards = cards;
        }

        // On ajoute ces champs seulement s'ils contiennent quelque chose
        // SAUF pour le MEMORY_GAME où on veut un JSON très propre
        const isCoreActivity = ['MEMORY_GAME'].includes(gemini.activity_type);

        if (Object.keys(mainActivity.data || {}).length > 0 && !isCoreActivity) gemini.data = mainActivity.data;
        if (mainActivity.text && !isCoreActivity) gemini.text = mainActivity.text;
        if (metadata.uncategorized_modules?.length > 0 && !isCoreActivity) {
            gemini.uncategorized_modules = metadata.uncategorized_modules;
        }

        // Extraction intelligente de l'audio depuis les modules orphelins (mAuthor pattern)
        if (metadata.uncategorized_modules) {
            metadata.uncategorized_modules.forEach(mod => {
                const props = mod.properties || {};
                const src = props.mp3 || props.ogg || props.URL;
                if (!src) return;

                const aid = (mod.id || "").toLowerCase();
                if (aid.includes('correct') && !aid.includes('level')) gemini.audio.correct = src;
                else if (aid.includes('wrong') || aid.includes('error')) gemini.audio.wrong = src;
                else if (aid.includes('levelcorrect') || aid.includes('victory') || aid.includes('win')) gemini.audio.victory = src;
            });
        }

        // Si c'est un QCM ou autre type qui n'est pas MEMORY_GAME, on peut aussi mapper
        if (mainActivity.type === 'MULTI_CHOICE' || mainActivity.type === 'TRUE_FALSE') {
            gemini.options = mainActivity.options;
            gemini.question = mainActivity.question;
        }

        return gemini;
    },

    postProcessActivities: (activities) => {
        const rows = {};

        // 1. Résolution des QCM par ligne
        activities.filter(a => a.type === "PICK_ONE_TEMP").forEach(q => {
            const rowKey = Math.round(q.posY / 40) * 40;
            if (!rows[rowKey]) rows[rowKey] = { options: [] };
            rows[rowKey].options.push(q.option);
            // On pourrait ici chercher la question réelle si on passait le XML complet ou les textModules
        });

        const final = activities.filter(a => a.type !== "PICK_ONE_TEMP");

        Object.values(rows).forEach(row => {
            const isTF = row.options.some(o => o.label.includes('نعم')) || row.options.some(o => o.label.includes('لا'));
            final.push({
                type: isTF ? "TRUE_FALSE" : "MULTI_CHOICE",
                instruction: isTF ? "أُجِيبُ بِـ نَعَمْ أَوْ لاَ:" : "أَخْتَارُ الْإِجَابَةَ الصَّحِيحَةَ:",
                question: "اِخْتَرِ الْإِجَابَةَ الصَّحِيحَةَ:",
                options: row.options
            });
        });

        return final;
    },

    /**
     * Analyse le HTML et produit un JSON standardisé.
     */
    parseHTML: (htmlContent, pagePath = '') => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, "text/html");

        const metadata = {
            version: "3.0",
            timestamp: new Date().toISOString(),
            page: doc.title || "Page HTML",
            activities: [],
            uncategorized_modules: []
        };

        // 1. Scraping des images (Local assets)
        const imgs = Array.from(doc.querySelectorAll('img'));
        imgs.forEach(img => {
            const src = img.getAttribute('src');
            if (src && !src.startsWith('http')) {
                metadata.activities.push({
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'SPLASH',
                    instruction: 'Image détectée',
                    imagePath: src,
                    basePath: pagePath.substring(0, pagePath.lastIndexOf('/') + 1),
                    originalType: 'html-img'
                });
            }
        });

        // 2. Scraping du texte structuré
        const elements = Array.from(doc.querySelectorAll('h1, h2, h3, p, li, b'));
        elements.forEach(el => {
            const text = el.textContent.trim();
            if (text.length > 3) {
                metadata.activities.push({
                    id: Math.random().toString(36).substr(2, 9),
                    type: el.tagName.startsWith('H') ? 'SPLASH' : 'PARAGRAPH',
                    instruction: el.tagName.startsWith('H') ? 'Titre' : 'Paragraphe',
                    text: text,
                    originalType: el.tagName.toLowerCase()
                });
            }
        });

        // 3. Option Iframe pour les pages JS complexes
        if (htmlContent.includes('<script') || htmlContent.includes('<canvas')) {
            metadata.activities.push({
                id: 'iframe-fallback',
                type: 'STORY',
                text: 'Afficher cette page comme une activité interactive',
                isIframe: true,
                direction: 'ltr',
                originalType: 'interactive-js',
                selected: false
            });
        }

        return metadata;
    }
};
