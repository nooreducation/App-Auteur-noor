import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Upload,
    FileCode,
    Type,
    Image as ImageIcon,
    CheckCircle2,
    ArrowRight,
    Layers,
    FileSearch,
    Brain,
    Save,
    Trash2,
    Plus,
    Activity,
    Search,
    Code,
    Eye,
    AlertCircle
} from 'lucide-react';
import JSZip from 'jszip';
import toast from 'react-hot-toast';
import useCourseStore from '../stores/courseStore';
import SlideRenderer from '../components/SlideRenderer';


const SCORMImporter = () => {
    const navigate = useNavigate();
    const { uploadAsset, setCourse } = useCourseStore();
    const fileInputRef = useRef(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [zipContent, setZipContent] = useState(null);
    const [detectedPages, setDetectedPages] = useState([]);
    const [selectedPage, setSelectedPage] = useState(null);
    const [conversionList, setConversionList] = useState([]);
    const [showRaw, setShowRaw] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [previewSlide, setPreviewSlide] = useState(null);


    // --- LOGIQUE D'ANALYSE ---

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsProcessing(true);
        const toastId = toast.loading('Analyse de la structure (Manifeste SCORM)...');
        console.log("Lecture du package:", file.name);

        try {
            const zip = new JSZip();
            const loadedZip = await zip.loadAsync(file);
            setZipContent(loadedZip);

            const parser = new DOMParser();
            let detected = [];

            // 1. TENTATIVE : Lecture du Manifeste imsmanifest.xml
            // On cherche le fichier manifest peu importe sa casse ou son emplacement
            const manifestFile = loadedZip.file('imsmanifest.xml') ||
                Object.values(loadedZip.files).find(f => f.name.toLowerCase().endsWith('imsmanifest.xml'));

            if (manifestFile) {
                console.log("Manifeste détecté, analyse de la structure officielle...");
                const manifestContent = await manifestFile.async("text");
                const xml = parser.parseFromString(manifestContent, "text/xml");

                // On mappe les ressources (fichiers) par leur identifiant unique
                const resources = {};
                Array.from(xml.querySelectorAll('resource')).forEach(res => {
                    const id = res.getAttribute('identifier');
                    const href = res.getAttribute('href');
                    if (id && href) resources[id] = href;
                });

                // On suit l'organisation déclarée dans le manifeste pour l'ordre et les noms
                const items = Array.from(xml.querySelectorAll('item'));
                for (const item of items) {
                    const refId = item.getAttribute('identifierref');
                    const titleElement = item.querySelector('title');
                    const title = titleElement ? titleElement.textContent : null;
                    const path = resources[refId];

                    if (path) {
                        // Nettoyage du chemin (espace encodés, slashs inversés)
                        const cleanPath = decodeURIComponent(path).replace(/\\/g, '/').replace(/^\//, '');
                        // On cherche le fichier exact dans le ZIP
                        let zFile = loadedZip.file(cleanPath);

                        // Si pas trouvé direct, on fait un scan flou sur le nom de fichier
                        if (!zFile) {
                            const fileName = cleanPath.split('/').pop();
                            zFile = Object.values(loadedZip.files).find(f => f.name.endsWith(fileName));
                        }

                        if (zFile && (zFile.name.endsWith('.html') || zFile.name.endsWith('.xml'))) {
                            const content = await zFile.async("text");
                            detected.push({
                                id: Math.random().toString(36).substr(2, 9),
                                path: zFile.name,
                                content,
                                type: zFile.name.endsWith('.html') ? 'html' : 'xml',
                                name: title || zFile.name.split('/').pop().replace(/\.(html|xml)$/, '')
                            });
                        }
                    }
                }
            }

            // 2. TENTATIVE : Spécifique mAuthor (pages/main.xml)
            if (detected.length === 0) {
                const mainFile = loadedZip.file('pages/main.xml') ||
                    Object.values(loadedZip.files).find(f => f.name.toLowerCase().endsWith('pages/main.xml'));

                if (mainFile) {
                    console.log("Structure mAuthor détectée (main.xml)...");
                    const mainContent = await mainFile.async("text");
                    const xml = parser.parseFromString(mainContent, "text/xml");

                    const pages = Array.from(xml.querySelectorAll('page[href]'));
                    for (const pg of pages) {
                        const href = pg.getAttribute('href');
                        const name = pg.getAttribute('name');
                        const id = pg.getAttribute('id');

                        // On cherche le fichier de la page dans le ZIP
                        let zFile = loadedZip.file('pages/' + href);
                        if (!zFile) {
                            zFile = Object.values(loadedZip.files).find(f => f.name.endsWith(href));
                        }

                        if (zFile) {
                            const content = await zFile.async("text");
                            detected.push({
                                id: id || Math.random().toString(36).substr(2, 9),
                                path: zFile.name,
                                content,
                                type: 'xml',
                                name: name || zFile.name.split('/').pop().replace(/\.xml$/, '')
                            });
                        }
                    }
                }
            }

            // 3. FALLBACK : Scan global si rien n'a été trouvé
            if (detected.length === 0) {
                console.warn("Pas de structure formelle, passage au scan global...");
                const files = Object.keys(loadedZip.files);
                for (const path of files) {
                    if ((path.endsWith('.html') || path.endsWith('.xml')) && !path.toLowerCase().includes('imsmanifest.xml')) {
                        const content = await loadedZip.file(path).async("text");

                        let humanName = path.split('/').pop().replace(/\.(html|xml)$/, '');
                        let fileType = path.endsWith('.html') ? 'html' : 'xml';

                        if (fileType === 'html') {
                            const doc = parser.parseFromString(content, "text/html");
                            const internalTitle = doc.querySelector('title')?.textContent || doc.querySelector('h1')?.textContent;
                            if (internalTitle) humanName = internalTitle;
                        } else if (content.includes('<page')) {
                            const xml = parser.parseFromString(content, "text/xml");
                            const pageNode = xml.querySelector('page');
                            humanName = pageNode?.getAttribute('name') || humanName;
                        } else continue;

                        detected.push({
                            id: Math.random().toString(36).substr(2, 9),
                            path,
                            content,
                            type: fileType,
                            name: humanName
                        });
                    }
                }
                detected.sort((a, b) => a.path.localeCompare(b.path));
            }

            setDetectedPages(detected);
            toast.success(`${detected.length} pages identifiées !`, { id: toastId });
        } catch (error) {
            console.error("Erreur Analyse Manifeste:", error);
            toast.error("Impossible d'analyser la structure du ZIP", { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const analyzePage = (page) => {
        setSelectedPage(page);
        console.log("Scraping page:", page.path);
        const parser = new DOMParser();
        const detected = [];

        if (page.type === 'html') {
            const doc = parser.parseFromString(page.content, "text/html");

            // 1. Scraping des images (Local assets)
            const imgs = Array.from(doc.querySelectorAll('img'));
            imgs.forEach(img => {
                const src = img.getAttribute('src');
                if (src && !src.startsWith('http')) {
                    detected.push({
                        id: Math.random().toString(36).substr(2, 9),
                        originalType: 'html-img',
                        text: 'Image: ' + src.split('/').pop(),
                        imagePath: src,
                        mappedType: 'SPLASH',
                        selected: true,
                        basePath: page.path.substring(0, page.path.lastIndexOf('/') + 1)
                    });
                }
            });

            // 2. Scraping du texte structuré
            const elements = Array.from(doc.querySelectorAll('h1, h2, h3, p, li, b'));
            elements.forEach(el => {
                const text = el.textContent.trim();
                if (text.length > 3) {
                    detected.push({
                        id: Math.random().toString(36).substr(2, 9),
                        originalType: el.tagName.toLowerCase(),
                        text: text,
                        mappedType: el.tagName.startsWith('H') ? 'SPLASH' : 'PARAGRAPH',
                        selected: true
                    });
                }
            });

            // 3. Option Iframe pour les pages JS complexes
            if (page.content.includes('<script') || page.content.includes('<canvas')) {
                detected.push({
                    id: 'iframe-fallback',
                    originalType: 'interactive-js',
                    text: 'Afficher cette page comme une activité interactive',
                    mappedType: 'STORY',
                    selected: false,
                    isIframe: true
                });
            }
        } else {
            // Logic Spécialisée mAuthor (XML)
            console.log("🔍 Analyse XML de la page:", page.name);
            console.log("📄 Longueur du contenu:", page.content?.length);

            const parser = new DOMParser();
            const xml = parser.parseFromString(page.content, "text/xml");

            console.log("✅ XML parsé avec succès");
            console.log("📋 Nombre total de modules:", xml.querySelectorAll('*').length);

            // DÉTECTION DE JEU DE MÉMOIRE (GAMEMEMO) → Conversion en composant natif
            const gamememoAddon = xml.querySelector('addonModule[addonId="gamememo"]');

            console.log("🎯 Recherche gamememo... Trouvé:", !!gamememoAddon);

            if (gamememoAddon) {
                console.log("🎮 Module GAMEMEMO détecté !");

                // Extraction des paires image/texte
                const pairs = [];
                const items = gamememoAddon.querySelectorAll('property[name="Pairs"] items item');

                console.log(`📦 Nombre d'items trouvés: ${items.length}`);

                items.forEach((item, idx) => {
                    const imageA = item.querySelector('property[name="A (image)"]')?.getAttribute('value');
                    const textA = item.querySelector('property[name="A (text)"]')?.getAttribute('value');
                    const imageB = item.querySelector('property[name="B (image)"]')?.getAttribute('value');
                    const textB = item.querySelector('property[name="B (text)"]')?.getAttribute('value');

                    console.log(`Item ${idx}:`, { imageA, textA, imageB, textB });

                    pairs.push({
                        imageUrl: imageA || imageB,
                        text: textB || textA || ''
                    });
                });

                console.log(`✅ ${pairs.length} paires extraites:`);
                pairs.forEach((pair, idx) => {
                    console.log(`  Paire ${idx}:`, { imageUrl: pair.imageUrl, text: pair.text });
                });

                // Configuration de la grille
                const columns = gamememoAddon.querySelector('property[name="Columns"]')?.getAttribute('value') || '4';
                const rows = gamememoAddon.querySelector('property[name="Rows"]')?.getAttribute('value') || '3';

                console.log(`📐 Grille: ${columns}x${rows}`);

                // Extraction de la consigne
                const instructionModule = xml.querySelector('textModule');
                const instructionText = instructionModule?.querySelector('text')?.textContent || '';
                const cleanInstruction = instructionText
                    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
                    .replace(/<[^>]*>?/gm, ' ')
                    .replace(/&nbsp;/g, ' ')
                    .trim();

                console.log(`📝 Consigne: ${cleanInstruction}`);

                detected.push({
                    id: 'gamememo-' + Date.now(),
                    originalType: 'gamememo',
                    text: cleanInstruction,
                    mappedType: 'GAMEMEMO',
                    selected: true,
                    pairs: pairs,
                    gridColumns: parseInt(columns),
                    gridRows: parseInt(rows)
                });

                console.log("🎯 Composant GAMEMEMO créé et ajouté à la liste");

                setConversionList(detected);
                generatePreview(detected);
                return;
            }

            // DÉTECTION D'AUTRES EXERCICES INTERACTIFS COMPLEXES
            const complexAddons = ['advanced_connector', 'draganddrop', 'connection', 'sorting', 'truefalse'];
            const hasComplexInteractivity = Array.from(xml.querySelectorAll('addonModule')).some(addon => {
                const addonId = addon.getAttribute('addonId')?.toLowerCase() || '';
                return complexAddons.some(complex => addonId.includes(complex));
            });

            if (hasComplexInteractivity) {
                const pageName = xml.querySelector('page')?.getAttribute('name') || 'Exercice Interactif';

                detected.push({
                    id: 'interactive-full-' + Date.now(),
                    originalType: 'mAuthor-Interactive-Exercise',
                    text: `Activité Interactive: ${pageName}`,
                    mappedType: 'STORY',
                    selected: true,
                    isComplexInteractive: true,
                    pageReference: page.path
                });

                setConversionList(detected);
                generatePreview(detected);
                return;
            }


            // On cherche tous les types de modules mAuthor pour les pages simples
            const modules = Array.from(xml.querySelectorAll('textModule, imageModule, addonModule, module, addon'));

            let introTexts = [];
            let mainImage = null;

            modules.forEach(mod => {
                const tagName = mod.tagName.toLowerCase();
                const type = mod.getAttribute('type')?.toLowerCase() ||
                    mod.getAttribute('addonId')?.toLowerCase() ||
                    tagName;

                const props = {};
                Array.from(mod.querySelectorAll('property')).forEach(p => {
                    const name = p.getAttribute('name')?.toLowerCase();
                    if (name) props[name] = p.getAttribute('value') || p.textContent;
                });

                // Extraction du texte pur (nettoyage HTML)
                const textTag = mod.querySelector('text, content');
                let rawText = textTag ? textTag.textContent : (props.text || props.content || mod.textContent);

                const cleanText = (rawText || '')
                    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') // Enlever CDATA si présent
                    .replace(/<[^>]*>?/gm, ' ') // Enlever balises HTML
                    .replace(/&nbsp;/g, ' ')
                    .replace(/\s+/g, ' ') // Normaliser espaces
                    .trim();

                const image = mod.querySelector('image')?.getAttribute('src') || props.image || props.src || null;
                const videoUrl = props.url || props.videoid || null;

                // Stratégie pour l'agrégation (Page d'intro)
                if (tagName === 'textmodule' && cleanText.length > 0) {
                    introTexts.push(cleanText);
                    return; // On ne le push pas encore, on va les fusionner
                }

                if (tagName === 'imagemodule' && image) {
                    mainImage = image;
                    return; // On garde pour le bloc Splash
                }

                if (cleanText.length > 2 || image || videoUrl || type.includes('choice')) {
                    detected.push({
                        id: Math.random().toString(36).substr(2, 9),
                        originalType: type,
                        text: cleanText,
                        imagePath: image,
                        videoUrl: videoUrl,
                        mappedType: mapType(type),
                        selected: true,
                        allProps: props
                    });
                }
            });

            // Si on a des textes d'intro et une image, on crée un bloc SPLASH unique (Page 1)
            if (introTexts.length > 0) {
                detected.unshift({
                    id: 'splash-aggregate-' + Date.now(),
                    originalType: 'mAuthor-Intro',
                    text: introTexts.join(' : '), // Fusion des titres (ex: Leçon 7 : Titre)
                    imagePath: mainImage,
                    mappedType: 'SPLASH',
                    selected: true
                });
            }
        }

        setConversionList(detected);
        generatePreview(detected);
    };

    const generatePreview = async (modules) => {
        const blocks = [];
        for (const mod of modules) {
            if (!mod.selected) continue;

            // Traitement spécial pour GAMEMEMO
            if (mod.mappedType === 'GAMEMEMO' && mod.pairs && zipContent) {
                const previewPairs = [];
                for (const pair of mod.pairs) {
                    let imageUrl = '';
                    if (pair.imageUrl) {
                        const cleanPath = pair.imageUrl.replace(/^(\.\/|\.\.\/|\/)+/, '');
                        let imgFile = zipContent.file(cleanPath) ||
                            zipContent.file('resources/' + cleanPath.split('/').pop());

                        if (imgFile) {
                            const blob = await imgFile.async("blob");
                            imageUrl = URL.createObjectURL(blob);
                        }
                    }
                    previewPairs.push({
                        imageUrl: imageUrl,
                        text: pair.text
                    });
                }

                blocks.push({
                    id: mod.id,
                    type: 'GAMEMEMO',
                    text: mod.text,
                    pairs: previewPairs,
                    gridColumns: mod.gridColumns,
                    gridRows: mod.gridRows,
                    style: { columns: 12, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20 }
                });
                continue;
            }

            // Traitement standard pour les autres types
            let previewImageUrl = '';
            if (mod.imagePath && zipContent) {
                const cleanPath = mod.imagePath.replace(/^(\.\/|\.\.\/|\/)+/, '');
                let imgFile = zipContent.file(cleanPath) ||
                    zipContent.file('resources/' + cleanPath.split('/').pop());

                if (imgFile) {
                    const blob = await imgFile.async("blob");
                    previewImageUrl = URL.createObjectURL(blob);
                }
            }

            blocks.push({
                id: mod.id,
                type: mod.mappedType === 'SPLASH_IMAGE' ? 'SPLASH' : mod.mappedType,
                title: mod.text?.substring(0, 30) || 'Composant',
                content: mod.text || '',
                image: previewImageUrl,
                url: mod.videoUrl || '',
                style: { columns: 12, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20 }
            });
        }

        setPreviewSlide({
            id: 'preview-' + Date.now(),
            title: selectedPage?.name || 'Aperçu',
            blocks: blocks
        });
    };

    useEffect(() => {
        if (conversionList.length > 0) {
            generatePreview(conversionList);
        }
    }, [conversionList]);


    const mapType = (type) => {
        const t = type.toLowerCase();
        if (t.includes('text') || t.includes('content') || t.includes('parag')) return 'PARAGRAPH';
        if (t.includes('heading') || t.includes('header') || t.includes('title')) return 'SPLASH';
        if (t.includes('image') || t.includes('picture') || t.includes('photo')) return 'SPLASH_IMAGE';
        if (t.includes('choice') || t.includes('selection') || t.includes('quiz')) return 'CHOICE';
        if (t.includes('video') || t.includes('youtube')) return 'VIDEO';
        return 'PARAGRAPH';
        return 'PARAGRAPH';
    };

    const toggleModuleSelection = (id) => {
        setConversionList(prev => prev.map(m => m.id === id ? { ...m, selected: !m.selected } : m));
    };

    const finalizeImport = async () => {
        setIsProcessing(true);
        const toastId = toast.loading('Transfert vers Noor Studio...');

        try {
            console.log("Démarrage de l'importation finale...");
            const currentCourse = useCourseStore.getState().course;
            console.log("Cours actuel détecté:", currentCourse?.title);
            const blocks = [];
            const selectedMods = conversionList.filter(m => m.selected);

            for (const mod of selectedMods) {
                let imageUrl = '';
                let videoUrl = mod.videoUrl || '';

                if (mod.imagePath && zipContent) {
                    // Calcul du chemin relatif intelligent
                    let fullPath = mod.imagePath;
                    if (mod.basePath && !mod.imagePath.startsWith('/') && !mod.imagePath.startsWith('.')) {
                        fullPath = mod.basePath + mod.imagePath;
                    }

                    const cleanPath = fullPath.replace(/^(\.\/|\.\.\/|\/)+/, '');
                    let imgFile = zipContent.file(cleanPath);

                    if (!imgFile) {
                        const fileName = cleanPath.split('/').pop();
                        const foundFiles = Object.keys(zipContent.files).filter(path => path.endsWith(fileName));
                        if (foundFiles.length > 0) imgFile = zipContent.file(foundFiles[0]);
                    }

                    if (imgFile) {
                        try {
                            const blob = await imgFile.async("blob");
                            const fileObj = new File([blob], fullPath.split('/').pop(), { type: "image/png" });
                            imageUrl = await uploadAsset(fileObj);
                        } catch (e) { console.warn("Upload asset failed", e); }
                    }
                }

                // Cas spécial : Iframe / Story (pour les contenus interactifs complexes)
                if (mod.isIframe) {
                    blocks.push({
                        id: 'imp-' + Math.random().toString(36).substr(2, 9),
                        type: 'STORY',
                        title: 'Activité Interactive',
                        url: '',
                        content: 'Importez le lien de cette activité ici',
                        style: { columns: 12, margin: 16, background: 'rgba(0,0,0,0.5)', borderRadius: '16px', padding: 0 }
                    });
                    continue;
                }

                const blockType = mod.mappedType === 'SPLASH_IMAGE' ? 'SPLASH' : mod.mappedType;

                const block = {
                    id: 'imp-' + Math.random().toString(36).substr(2, 9),
                    type: blockType,
                    title: mod.modId || 'Composant',
                    content: mod.text || '',
                    image: imageUrl,
                    url: videoUrl,
                    style: { columns: 12, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20 }
                };

                // Init spécifique pour les questions QCM
                if (blockType === 'CHOICE') {
                    block.instruction = mod.text || "Répondez à la question";
                    block.options = [
                        { id: 'opt1', text: 'Option 1', isCorrect: true },
                        { id: 'opt2', text: 'Option 2', isCorrect: false }
                    ];
                }

                blocks.push(block);
            }

            const newSlide = {
                id: 'slide-' + Date.now(),
                title: selectedPage.name,
                blocks: blocks
            };

            const defaultCourse = {
                id: currentCourse?.id || 'new-' + Date.now(),
                title: currentCourse?.title || 'Cours Importé',
                level: currentCourse?.level || 'Primaire 1',
                subject: currentCourse?.subject || 'Général',
                aspectRatio: currentCourse?.aspectRatio || '16/9',
                icon: currentCourse?.icon || 'Book',
                theme: currentCourse?.theme || { primary: '#4834d4', secondary: '#7b61ff', accent: '#ff4757' },
                slides: currentCourse?.slides || []
            };

            const updatedSlides = [...defaultCourse.slides, newSlide];
            setCourse({
                ...defaultCourse,
                slides: updatedSlides
            });

            const newIndex = updatedSlides.length - 1;
            useCourseStore.getState().setActiveSlideIndex(newIndex);

            toast.success("Importation terminée !", { id: toastId });

            setTimeout(() => {
                console.log("Navigation vers l'éditeur...");
                navigate('/editor');
            }, 200);
        } catch (error) {
            console.error("CRASH IMPORTATION:", error);
            toast.error("Erreur critique lors de l'importation: " + error.message, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ height: '100vh', background: 'var(--bg-primary)', color: 'white', display: 'flex', flexDirection: 'column' }}>
            <div className="aurora"></div>

            <header style={{
                padding: '24px 40px',
                background: 'rgba(18, 21, 45, 0.6)',
                backdropFilter: 'blur(40px)',
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button className="btn-secondary" onClick={() => navigate('/')} style={{ padding: '10px' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--noor-secondary)', marginBottom: '4px' }}>
                            <Brain size={20} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>Assistant Expert</span>
                        </div>
                        <h1 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Importateur Universel ZIP / HTML5</h1>
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {selectedPage && (
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>{selectedPage.name}</h2>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Vérifiez les composants extraits</p>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={18} /> Changer de Package
                    </button>
                    <input type="file" ref={fileInputRef} hidden accept=".zip" onChange={handleFileUpload} />

                    {selectedPage && (
                        <>
                            <button className={`btn-secondary ${previewMode ? 'active' : ''}`} onClick={() => setPreviewMode(!previewMode)}>
                                <Eye size={18} /> {previewMode ? "Mode Édition" : "Aperçu Noor"}
                            </button>
                            <button className="btn-secondary" onClick={() => setShowRaw(!showRaw)}>
                                {showRaw ? <Eye size={18} /> : <Code size={18} />} {showRaw ? "Vue normale" : "Source XML"}
                            </button>

                            <button
                                className="btn-primary"
                                onClick={finalizeImport}
                                style={{ marginLeft: '8px' }}
                                disabled={isProcessing || conversionList.filter(m => m.selected).length === 0}
                            >
                                {isProcessing ? <Activity className="animate-spin" size={18} /> : <Layers size={18} />}
                                Importer ({conversionList.filter(m => m.selected).length})
                            </button>
                        </>
                    )}
                </div>
            </header>

            <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <aside style={{ width: '380px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', background: 'rgba(10, 12, 26, 0.4)' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Structure détectée</span>
                        <span style={{ fontSize: '0.7rem', background: 'var(--noor-primary)', padding: '2px 8px', borderRadius: '4px' }}>{detectedPages.length} Pages</span>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                        {detectedPages.map(page => (
                            <div
                                key={page.id}
                                onClick={() => analyzePage(page)}
                                className={`sidebar-item ${selectedPage?.id === page.id ? 'active' : ''}`}
                                style={{
                                    padding: '16px',
                                    borderRadius: '16px',
                                    marginBottom: '8px',
                                    border: '1px solid',
                                    borderColor: selectedPage?.id === page.id ? 'var(--noor-secondary)' : 'transparent',
                                    background: selectedPage?.id === page.id ? 'rgba(123, 97, 255, 0.15)' : 'rgba(255,255,255,0.02)'
                                }}
                            >
                                <FileCode size={20} style={{ color: selectedPage?.id === page.id ? 'var(--noor-secondary)' : 'var(--text-muted)' }} />
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{page.name}</span>
                                    <span style={{ fontSize: '0.6rem', opacity: 0.4, fontFamily: 'monospace' }}>{page.path}</span>
                                </div>
                                <ChevronRight size={16} opacity={0.3} />
                            </div>
                        ))}
                    </div>
                </aside>

                <div style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-primary)', position: 'relative' }}>
                    {selectedPage ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {previewMode && previewSlide ? (
                                <div style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    background: 'var(--bg-tertiary)',
                                    padding: '24px',
                                    overflow: 'hidden',
                                    boxSizing: 'border-box'
                                }}>
                                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                        <SlideRenderer
                                            key={selectedPage?.name || 'preview'}
                                            slide={previewSlide}
                                            isPreview={true}
                                        />
                                    </div>
                                </div>
                            ) : showRaw ? (
                                <div style={{ padding: '48px' }}>
                                    <pre style={{
                                        background: '#0a0c1a',
                                        padding: '24px',
                                        borderRadius: '20px',
                                        border: '1px solid var(--border-color)',
                                        fontSize: '0.8rem',
                                        overflowX: 'auto',
                                        color: '#7b61ff'
                                    }}>
                                        {selectedPage.content}
                                    </pre>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '48px' }}>
                                    {conversionList.length > 0 ? conversionList.map(mod => (
                                        <motion.div
                                            key={mod.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '24px',
                                                padding: '28px',
                                                display: 'flex',
                                                gap: '24px',
                                                opacity: mod.selected ? 1 : 0.6
                                            }}
                                        >
                                            <div onClick={() => toggleModuleSelection(mod.id)} style={{ cursor: 'pointer', marginTop: '4px' }}>
                                                <div style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '8px',
                                                    background: mod.selected ? 'var(--noor-primary)' : 'rgba(255,255,255,0.05)',
                                                    border: '2px solid',
                                                    borderColor: mod.selected ? 'var(--noor-primary)' : 'rgba(255,255,255,0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}>
                                                    {mod.selected && <CheckCircle2 size={18} />}
                                                </div>
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px' }}>
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--noor-secondary)' }}>SOURCE: {mod.originalType.toUpperCase()}</span>
                                                        <span style={{ opacity: 0.2 }}>|</span>
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>{mod.modId || 'HTML'}</span>
                                                    </div>
                                                    <ArrowRight size={16} opacity={0.3} />
                                                    <select
                                                        value={mod.mappedType}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setConversionList(prev => prev.map(m => m.id === mod.id ? { ...m, mappedType: val } : m));
                                                        }}
                                                        className="input-field"
                                                        style={{ width: 'auto', padding: '6px 16px', fontSize: '0.8rem', background: 'rgba(123, 97, 255, 0.1)', border: '1px solid var(--noor-secondary)' }}
                                                    >
                                                        <option value="PARAGRAPH">📄 Paragraphe Noor</option>
                                                        <option value="SPLASH">✨ Titre / Splash Noor</option>
                                                        <option value="VIDEO">🎬 Vidéo Noor</option>
                                                        <option value="CHOICE">❓ Question QCM Noor</option>
                                                        <option value="STORY">🎯 Activité Iframe</option>
                                                    </select>
                                                </div>

                                                <textarea
                                                    value={mod.text}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setConversionList(prev => prev.map(m => m.id === mod.id ? { ...m, text: val } : m));
                                                    }}
                                                    className="input-field"
                                                    placeholder="Aucun texte détecté..."
                                                    style={{ minHeight: '100px', fontSize: '1rem', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)' }}
                                                />

                                                {mod.imagePath && (
                                                    <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(123, 97, 255, 0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px dashed rgba(123, 97, 255, 0.3)' }}>
                                                        <div style={{ width: '40px', height: '40px', background: 'rgba(123, 97, 255, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <ImageIcon size={20} color="var(--noor-secondary)" />
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Média détecté</span>
                                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{mod.imagePath}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )) : (
                                        <div style={{ textAlign: 'center', padding: '100px 40px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '30px', border: '1px dashed var(--border-color)' }}>
                                            <AlertCircle size={48} style={{ marginBottom: '20px', opacity: 0.3 }} />
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Aucun composant reconnu</h3>
                                            <p style={{ color: 'var(--text-secondary)' }}>Cette page semble vide ou utilise un format personnalisé.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '40px', textAlign: 'center' }}>
                            <div style={{ position: 'relative', marginBottom: '40px' }}>
                                <div style={{ width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(123, 97, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Brain size={100} color="var(--noor-secondary)" opacity={0.3} />
                                </div>
                                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} style={{ position: 'absolute', top: 0, right: 0, background: 'var(--noor-primary)', padding: '12px', borderRadius: '14px', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
                                    <FileSearch size={24} />
                                </motion.div>
                            </div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '16px' }}>Sélectionnez une page</h2>
                            <p style={{ maxWidth: '450px', color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.7' }}>
                                L'assistant va analyser le Manifeste SCORM et le contenu HTML pour structurer votre cours automatiquement.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SCORMImporter;
