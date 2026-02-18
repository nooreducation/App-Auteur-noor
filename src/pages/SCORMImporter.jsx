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
    AlertCircle,
    X,
    MessageSquare,
    Monitor,
    Tablet,
    Smartphone,
    RefreshCw,
} from 'lucide-react';
import JSZip from 'jszip';
import toast from 'react-hot-toast';
import useCourseStore from '../stores/courseStore';
import SlideRenderer from '../components/SlideRenderer';
import { ConversionBrain } from '../utils/conversionBrain';
import { StandardConverter } from '../utils/StandardConverter';


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
    const [debugMetadata, setDebugMetadata] = useState(null);
    const [showDebugJson, setShowDebugJson] = useState(false);
    const [generatedHTML, setGeneratedHTML] = useState(null);
    const [showGeneratedHtml, setShowGeneratedHtml] = useState(false);

    // --- ÉTAT DU CERVEAU (CLOUD LEARNING) ---
    const [learnedRules, setLearnedRules] = useState({}); // { signature: { html_template, addon_id } }
    const [showStudioModal, setShowStudioModal] = useState(false);
    const [teachingModule, setTeachingModule] = useState(null); // Module en cours d'apprentissage
    const [teachingPreview, setTeachingPreview] = useState(""); // Rendu de l'aperçu dynamique
    const [activePageRule, setActivePageRule] = useState(null); // Règle globale de la page actuelle
    const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop', 'tablet', 'mobile'


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

    // --- HELPERS TECHNIQUES (DÉLÉGUÉS AU StandardConverter) ---
    const detectDirection = StandardConverter.detectDirection;
    const cleanText = StandardConverter.cleanText;
    const extractContent = StandardConverter.extractContent;

    const extractmAuthorMetadata = StandardConverter.parseMAuthorXML;

    /**
     * ÉTAPE 2 : LE GÉNÉRATEUR HTML (JSON -> HTML STANDALONE)
     * Produit un fichier HTML complet et stylisé à partir des métadonnées.
     */
    const generateStaticHTML = (metadata) => {
        if (!metadata) return "";

        return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.page}</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #6c5ce7;
            --secondary: #a29bfe;
            --accent: #fd79a8;
            --success: #00b894;
            --bg-gradient: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            --glass: rgba(255, 255, 255, 0.1);
            --glass-border: rgba(255, 255, 255, 0.1);
            --card-front: linear-gradient(135deg, #6c5ce7, #a29bfe);
        }

        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

        body {
            font-family: 'Cairo', sans-serif;
            background: var(--bg-gradient);
            background-attachment: fixed;
            display: flex;
            justify-content: center;
            padding: 40px 20px;
            margin: 0;
            color: white;
            min-height: 100vh;
        }

        .container {
            background: var(--glass);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            width: 100%;
            max-width: 900px;
            padding: 40px;
            border-radius: 24px;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.1);
            position: relative;
        }

        h1 { text-align: center; margin-bottom: 40px; font-weight: 900; color: var(--secondary); font-size: 2.2rem; }

        .instruction {
            background: rgba(108, 92, 231, 0.2);
            padding: 15px 25px;
            border-right: 5px solid var(--primary);
            font-weight: 800;
            font-size: 1.3rem;
            margin-bottom: 30px;
            border-radius: 8px;
            color: white;
        }

        /* --- QUIZ & TRUE/FALSE --- */
        .quiz-section {
            background: rgba(0,0,0,0.2);
            padding: 25px;
            border-radius: 16px;
            margin-bottom: 30px;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .question-text { font-size: 1.4rem; font-weight: 700; margin-bottom: 20px; }
        .btn-group { display: flex; gap: 15px; flex-wrap: wrap; }
        .opt-btn {
            padding: 12px 25px;
            font-size: 1.1rem;
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            background: rgba(255,255,255,0.05);
            color: white;
            cursor: pointer;
            transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            font-weight: 700;
            font-family: inherit;
        }
        .opt-btn:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
        .opt-btn.active { background: var(--primary); border-color: var(--secondary); box-shadow: 0 0 20px rgba(108, 92, 231, 0.4); }

        /* --- TEXT EVIDENCE --- */
        .text-evidence-area {
            line-height: 2.5; font-size: 1.6rem; padding: 30px;
            background: rgba(0,0,0,0.2); border-radius: 16px; margin-bottom: 30px;
        }
        .selectable-word {
            display: inline-block; cursor: pointer; padding: 0 8px; border-radius: 8px;
            transition: 0.2s; border-bottom: 2px dashed rgba(255,255,255,0.2); margin: 0 3px;
        }
        .selectable-word:hover { background: rgba(255,255,255,0.1); }
        .selectable-word.selected { background: var(--accent); color: white; border-bottom-color: white; }

        /* --- CONNECTING --- */
        .connecting-area { display: flex; justify-content: space-between; gap: 40px; margin-bottom: 30px; }
        .list-column { display: flex; flex-direction: column; gap: 15px; flex: 1; }
        .item-box {
            padding: 18px; background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.1);
            border-radius: 12px; cursor: pointer; text-align: center; font-weight: 700; transition: 0.3s;
        }
        .item-box:hover { border-color: var(--secondary); background: rgba(255,255,255,0.1); }
        .item-box.selected { background: var(--primary); border-color: var(--secondary); transform: scale(1.02); }
        .item-box.matched { opacity: 0.3; pointer-events: none; border-style: dashed; transform: scale(0.95); }

        /* --- MEMORY GAME --- */
        .memory-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .card { height: 120px; cursor: pointer; position: relative; transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 16px; }
        .card.flipped { transform: rotateY(180deg); }
        .card-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; display: flex; align-items: center; justify-content: center; border-radius: 16px; border: 2px solid rgba(255,255,255,0.1); }
        .card-front { background: var(--card-front); color: white; font-size: 2.5rem; font-weight: 900; }
        .card-back { background: white; color: #2d3436; transform: rotateY(180deg); padding: 10px; text-align: center; font-weight: 700; }
        .card.matched .card-back { background: var(--success); color: white; }

        /* --- ORDERING --- */
        .ordering-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 30px; }
        .order-item { cursor: grab; display: flex; align-items: center; gap: 15px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
        .order-handle { font-size: 1.5rem; opacity: 0.5; }

        .check-btn {
            width: 100%; padding: 20px; background: var(--success); color: white; border: none;
            border-radius: 16px; font-size: 1.5rem; font-weight: 900; cursor: pointer;
            box-shadow: 0 10px 30px rgba(0, 184, 148, 0.4); transition: 0.3s; margin-top: 20px;
        }
        .check-btn:hover { background: #00a080; transform: translateY(-3px); box-shadow: 0 15px 35px rgba(0, 184, 148, 0.5); }

        #result-status { display: none; text-align: center; font-size: 2.5rem; margin-top: 30px; animation: bounce 0.5s infinite alternate; }
        @keyframes bounce { from { transform: scale(1); } to { transform: scale(1.1); } }

        .unknown-box { border: 2px dashed rgba(255,255,255,0.2); padding: 15px; border-radius: 12px; background: rgba(0,0,0,0.3); margin-top: 20px; }
        .dataset-tag { font-size: 0.7rem; background: var(--accent); color: white; padding: 4px 8px; border-radius: 6px; margin-bottom: 10px; display: inline-block; font-weight: 700; }
        .learned-module {
            background: rgba(108, 92, 231, 0.05);
            border: 1px dashed rgba(108, 92, 231, 0.3);
            border-radius: 16px;
            padding: 20px;
            margin-top: 10px;
        }
    </style>
</head>
<body>

<div class="container">
    <h1>${metadata.page}</h1>
    <div id="activities-root"></div>
    <button class="check-btn" onclick="validate()">تحقق من الإجابة</button>
    <div id="result-status">⭐⭐ ممتاز ⭐⭐</div>

    ${metadata.uncategorized_modules?.length > 0 ? `
    <div style="margin-top: 60px; opacity: 0.5;">
        <h4 style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">Modules Complémentaires</h4>
        ${metadata.uncategorized_modules.map(mod => `
            <div class="unknown-box">
                <span class="dataset-tag">${mod.addonId}</span>
                <pre style="font-size: 0.7rem; margin: 0; overflow-x: auto; color: #a29bfe;">${JSON.stringify(mod.properties, null, 2)}</pre>
            </div>
        `).join('')}
    </div>` : ''}
</div>

<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
<script>
    const metadata = ${JSON.stringify(metadata).replace(/</g, '\\u003c')};
    const root = document.getElementById('activities-root');
    let userSelections = { quiz: {}, evidence: {}, connecting: [], memory: [], ordering: [] };

    // Support pour format Gemini (objet unique) ou mAuthor (liste d'activités)
    const activities = metadata.activities || [metadata];

    activities.forEach((act, actIdx) => {
        if (!act.type && !act.activity_type) return;
        const type = act.activity_type || act.type;

        const section = document.createElement('div');
        const instr = document.createElement('div');
        instr.className = 'instruction';
        instr.textContent = act.instruction || (type === 'LEARNED' ? 'تمرين إضافي' : '');
        if (instr.innerText) section.appendChild(instr);

        if (type === "LEARNED" && act.template) {
            const learnedDiv = document.createElement('div');
            learnedDiv.className = 'learned-module';
            learnedDiv.innerHTML = act.template;
            section.appendChild(learnedDiv);
        }
        else if (type === "TRUE_FALSE" || type === "MULTI_CHOICE") {
            const quiz = document.createElement('div');
            quiz.className = 'quiz-section';
            quiz.innerHTML = '<div class="question-text">' + (act.question || "اِخْتَرِ الْإِجَابَةَ الصَّحِيحَةَ:") + '</div>';
            const btnGroup = document.createElement('div');
            btnGroup.className = 'btn-group';
            const options = act.options || act.data?.Options || [];
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'opt-btn';
                btn.textContent = opt.label;
                btn.onclick = () => {
                    btnGroup.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    userSelections.quiz[actIdx] = opt.isCorrect;
                    
                    if (opt.isCorrect && metadata.audio?.correct) new Audio(metadata.audio.correct).play();
                    else if (!opt.isCorrect && metadata.audio?.wrong) new Audio(metadata.audio.wrong).play();
                };
                btnGroup.appendChild(btn);
            });
            quiz.appendChild(btnGroup);
            section.appendChild(quiz);
        }
        else if (type === "MEMORY_GAME") {
            const grid = document.createElement('div');
            grid.className = 'memory-grid';
            if (act.config?.columns) grid.style.gridTemplateColumns = "repeat(" + act.config.columns + ", 1fr)";

            (function() {
                const localCards = [];
                if (act.cards && act.cards.length > 0) {
                    act.cards.forEach(c => localCards.push({ content: c.val, id: c.id, type: c.type }));
                } else {
                    const pairs = (act.data?.pairs || act.data?.Pairs || []);
                    pairs.forEach((p, i) => {
                        localCards.push({ content: p.a || p.A || '', id: i, type: (p.a || p.A || "").includes('/') ? 'img' : 'txt' });
                        localCards.push({ content: p.b || p.B || '', id: i, type: (p.b || p.B || "").includes('/') ? 'img' : 'txt' });
                    });
                }

                localCards.sort(() => Math.random() - 0.5).forEach(cData => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    const backContent = cData.type === 'img' 
                        ? '<img src="' + cData.content + '" style="max-width:100%; max-height:100%; object-fit:contain;">'
                        : cData.content;
                    
                    card.innerHTML = '<div class="card-face card-front">?</div><div class="card-face card-back">' + backContent + '</div>';
                    card.onclick = () => {
                        if (card.classList.contains('flipped') || userSelections.memory.length >= 2) return;
                        card.classList.add('flipped');
                        userSelections.memory.push({ card, id: cData.id });
                        if (userSelections.memory.length === 2) {
                            const [c1, c2] = userSelections.memory;
                            if (c1.id === c2.id) {
                                c1.card.classList.add('matched'); c2.card.classList.add('matched');
                                userSelections.memory = [];
                                if (metadata.audio?.correct) new Audio(metadata.audio.correct).play();
                            } else {
                                if (metadata.audio?.wrong) new Audio(metadata.audio.wrong).play();
                                setTimeout(() => {
                                    c1.card.classList.remove('flipped'); c2.card.classList.remove('flipped');
                                    userSelections.memory = [];
                                }, 1000);
                            }
                        }
                    };
                    grid.appendChild(card);
                });
            })();
            section.appendChild(grid);
        }
        else if (type === "TEXT_EVIDENCE") {
            const area = document.createElement('div');
            area.className = 'text-evidence-area';
            const segments = act.cards || act.data?.segments || act.data?.Segments || [];
            segments.forEach((seg, segIdx) => {
                if (seg.type === "text") area.appendChild(document.createTextNode(seg.content));
                else {
                    const span = document.createElement('span');
                    span.className = 'selectable-word';
                    span.textContent = seg.content;
                    span.onclick = () => {
                        span.classList.toggle('selected');
                        if (metadata.audio?.correct && seg.isCorrect) new Audio(metadata.audio.correct).play();
                    };
                    area.appendChild(span);
                }
            });
            section.appendChild(area);
        }
        else if (type === "CONNECTING") {
            const con = document.createElement('div');
            con.className = 'connecting-area';
            const leftCol = document.createElement('div');
            leftCol.className = 'list-column';
            const rightCol = document.createElement('div');
            rightCol.className = 'list-column';
            
            let selectedLeft = null;
            const leftData = act.data?.left || act.data?.LeftItems || [];
            const rightData = act.data?.right || act.data?.RightItems || [];

            leftData.forEach((txt, i) => {
                const btn = document.createElement('div');
                btn.className = 'item-box';
                btn.textContent = txt;
                btn.onclick = () => {
                   leftCol.querySelectorAll('.item-box').forEach(b => b.classList.remove('selected'));
                   btn.classList.add('selected');
                   selectedLeft = btn;
                };
                leftCol.appendChild(btn);
            });

            rightData.forEach((txt, i) => {
                const btn = document.createElement('div');
                btn.className = 'item-box';
                btn.textContent = txt;
                btn.onclick = () => {
                    if (!selectedLeft) return;
                    btn.classList.add('matched');
                    selectedLeft.classList.add('matched');
                    selectedLeft = null;
                    if (metadata.audio?.correct) new Audio(metadata.audio.correct).play();
                };
                rightCol.appendChild(btn);
            });
            con.appendChild(leftCol); con.appendChild(rightCol);
            section.appendChild(con);
        }
        else if (type === "KARAOKE") {
            const karaokeDiv = document.createElement('div');
            karaokeDiv.className = 'karaoke-player';
            const karaContent = document.createElement('div');
            karaContent.style.cssText = "background: rgba(108, 92, 231, 0.1); padding: 20px; border-radius: 12px; text-align: center;";
            karaContent.innerHTML = '<button style="background: var(--accent); border: none; color: white; padding: 10px 20px; border-radius: 8px; cursor: pointer;">أَسْتَمِعُ</button>';
            const textDiv = document.createElement('div');
            textDiv.style.cssText = "margin-top: 15px; font-size: 1.2rem;";
            textDiv.textContent = act.text || act.data?.text || act.data?.Content || "";
            karaContent.appendChild(textDiv);
            karaokeDiv.appendChild(karaContent);
            section.appendChild(karaokeDiv);
        }
        else if (type === "VIDEO") {
            const videoDiv = document.createElement('div');
            videoDiv.className = 'video-container';
            videoDiv.style.marginTop = '15px';
            const vData = act.data || {};
            if (vData.videoId) {
                videoDiv.innerHTML = '<iframe width="100%" height="315" src="https://www.youtube.com/embed/' + vData.videoId + '" frameborder="0" allowfullscreen></iframe>';
            } else {
                videoDiv.innerHTML = '<div class="unknown-box">Fichier vidéo local : ' + (vData.url || "Non trouvé") + '</div>';
            }
            section.appendChild(videoDiv);
        }
        root.appendChild(section);
    });

    function validate() {
        document.getElementById('result-status').style.display = 'block';
        if (metadata.audio?.victory) new Audio(metadata.audio.victory).play();
        if (typeof confetti === 'function') {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#6c5ce7', '#a29bfe', '#fd79a8', '#00b894'] });
        }
        alert("عمل ممتاز! تم حفظ إجاباتك بنجاح.");
    }
</script>
</body>
</html>
        `;
    };


    const analyzePage = async (page) => {
        setSelectedPage(page);
        setActivePageRule(null);
        console.log("⚡ Standard Analysis (StandardConverter):", page.path);

        const standardMetadata = StandardConverter.convert(page.content, page.type, page.path);
        if (!standardMetadata) {
            console.error("❌ Conversion failed");
            return;
        }

        // --- CONVERSION VERS LE FORMAT GEMINI (DEMANDÉ PAR L'UTILISATEUR) ---
        const geminiMetadata = StandardConverter.toGeminiJSON(standardMetadata);
        setDebugMetadata(geminiMetadata);

        const initialHtml = generateStaticHTML(geminiMetadata); // Utilise maintenant le format Gemini
        setGeneratedHTML(initialHtml);

        let filtered = [];
        // On continue d'utiliser standardMetadata pour la liste de sélection si nécessaire
        // Mais on privilégie l'activité principale
        standardMetadata.activities.forEach(item => {
            filtered.push({
                ...item,
                geminiData: StandardConverter.toGeminiJSON(standardMetadata, item),
                selected: true,
                direction: StandardConverter.detectDirection(item.text || item.instruction)
            });
        });

        setConversionList(filtered);

        // 3. BRAIN SCAN (Cloud Learning)
        const scanUncategorized = async () => {
            const newLearned = { ...learnedRules };
            let needsUpdate = false;

            const pageSig = ConversionBrain.generatePageSignature(filtered);
            const pageRule = await ConversionBrain.fetchRule(pageSig, 'GLOBAL_PAGE');

            if (pageRule) {
                newLearned[pageSig] = pageRule;
                setActivePageRule(pageRule);
                needsUpdate = true;
            } else {
                setActivePageRule(null);
            }

            for (let i = 0; i < filtered.length; i++) {
                const item = filtered[i];
                if (item.properties) {
                    const rule = await ConversionBrain.fetchRule(item.signature, item.addonId);
                    if (rule) {
                        newLearned[item.signature] = rule;
                        filtered[i] = {
                            ...item,
                            text: "Module appris (Cloud Override) : " + (item.addonId || item.originalType),
                            mappedType: 'LEARNED',
                            selected: true,
                            template: ConversionBrain.render(rule.html_template, item.geminiData || item.properties)
                        };
                        needsUpdate = true;
                    }
                }
            }

            if (needsUpdate) {
                setLearnedRules(newLearned);
                setConversionList([...filtered]);

                if (pageRule) {
                    const globalData = geminiMetadata || {
                        page: selectedPage?.name || page.name,
                        activities: standardMetadata.activities,
                        components: filtered.map(c => ({
                            ...c,
                            type: c.originalType || c.mappedType,
                            text: c.text,
                            learnedTemplate: c.mappedType === 'LEARNED' ? c.template : null
                        })),
                        RAW_JSON: standardMetadata
                    };
                    const phtml = ConversionBrain.render(pageRule.html_template, globalData);
                    setGeneratedHTML(phtml);
                } else {
                    const enrichedMetadata = {
                        ...standardMetadata,
                        activities: standardMetadata.activities.map(act => {
                            const sig = act.properties ? ConversionBrain.generateSignature(act.properties) : null;
                            if (newLearned[sig]) {
                                return { ...act, type: 'LEARNED', template: ConversionBrain.render(newLearned[sig].html_template, act.properties) };
                            }
                            return act;
                        })
                    };
                    setGeneratedHTML(generateStaticHTML(enrichedMetadata));
                }
            }
        };

        scanUncategorized();
    };


    const generatePreview = async (modules) => {
        // --- CAS PRIORITAIRE : RÈGLE DE PAGE GLOBALE ---
        if (activePageRule) {
            console.log("🧠 Preview: Utilisation de la règle de PAGE GLOBALE");
            const globalData = {
                page_name: selectedPage?.name,
                page: selectedPage?.name,
                components: modules.map(c => ({
                    ...c,
                    type: c.originalType || c.mappedType,
                    text: c.text
                })),
                activities: debugMetadata?.activities || []
            };
            const pageHtml = ConversionBrain.render(activePageRule.html_template, globalData);

            setPreviewSlide({
                id: 'preview-global-' + Date.now(),
                title: selectedPage?.name || 'Aperçu',
                blocks: [{
                    id: 'global-block',
                    type: 'STORY',
                    content: pageHtml,
                    style: { columns: 12, margin: 0, background: 'white', padding: 0 }
                }]
            });
            return;
        }

        const blocks = [];
        for (const mod of modules) {
            if (!mod.selected) continue;

            // Traitement spécial pour DRAG_DROP_IMAGE (Spatiale)
            if (mod.isDragDrop && mod.pairs && zipContent) {
                const finalPairs = [];
                for (const pair of mod.pairs) {
                    let imageUrl = '';
                    if (pair.image) {
                        const cleanPath = pair.image.replace(/^(\.\/|\.\.\/|\/)+/, '');
                        let imgFile = zipContent.file(cleanPath) ||
                            zipContent.file('resources/' + cleanPath.split('/').pop());

                        if (imgFile) {
                            const blob = await imgFile.async("blob");
                            imageUrl = URL.createObjectURL(blob);
                        }
                    }
                    finalPairs.push({
                        image: imageUrl,
                        answer: pair.answer
                    });
                }

                blocks.push({
                    id: mod.id,
                    type: 'DRAG_DROP_IMAGE',
                    instruction: mod.text,
                    draggableLabels: mod.labels,
                    dropZones: finalPairs,
                    style: { columns: 12, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20 }
                });
                continue;
            }

            // Traitement spécial pour DRAG_DROP_IMAGE
            if (mod.mappedType === 'DRAG_DROP_IMAGE' && mod.pairs && zipContent) {
                const finalPairs = [];
                for (const pair of mod.pairs) {
                    let imageUrl = '';
                    if (pair.image) {
                        const cleanPath = pair.image.replace(/^(\.\/|\.\.\/|\/)+/, '');
                        let imgFile = zipContent.file(cleanPath) ||
                            zipContent.file('resources/' + cleanPath.split('/').pop());
                        if (imgFile) {
                            const blob = await imgFile.async("blob");
                            imageUrl = URL.createObjectURL(blob);
                        }
                    }
                    finalPairs.push({ image: imageUrl, answer: pair.answer });
                }
                blocks.push({
                    id: mod.id, type: 'DRAG_DROP_IMAGE', instruction: mod.text,
                    draggableLabels: mod.labels, dropZones: finalPairs,
                    style: { columns: 12, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20 }
                });
                continue;
            }

            // Traitement spécial pour CONNECTING
            if (mod.mappedType === 'CONNECTING' && mod.left && mod.right) {
                const resolveItems = async (items) => {
                    return await Promise.all(items.map(async (item) => {
                        if (item && item.includes('/') && zipContent) {
                            const cleanPath = item.replace(/^(\.\/|\.\.\/|\/)+/, '');
                            let imgFile = zipContent.file(cleanPath) ||
                                zipContent.file('resources/' + cleanPath.split('/').pop());

                            if (imgFile) {
                                const blob = await imgFile.async("blob");
                                return URL.createObjectURL(blob);
                            }
                        }
                        return item;
                    }));
                };

                const pLeft = await resolveItems(mod.left);
                const pRight = await resolveItems(mod.right);

                blocks.push({
                    id: 'conn-' + Date.now(),
                    type: 'CONNECTING',
                    instruction: mod.text || "أَرْبُطُ بِمَا يُنَاسِبُ لِأَحْصُلَ عَلَى جُمَلٍ مُفِيدَةٍ :",
                    left: pLeft,
                    right: pRight,
                    pairs: mod.pairs,
                    direction: mod.direction || 'rtl',
                    style: {
                        columns: 12, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20,
                        direction: mod.direction || 'rtl',
                        textAlign: (mod.direction || 'rtl') === 'rtl' ? 'right' : 'left'
                    }
                });
                continue;
            }


            // Traitement spécial pour IDENTIFICATION (QCM / Sélection par image)
            if (mod.mappedType === 'IDENTIFICATION' && mod.pairs && zipContent) {
                for (const pair of mod.pairs) {
                    let imageUrl = '';
                    if (pair.image) {
                        const cleanPath = pair.image.replace(/^(\.\/|\.\.\/|\/)+/, '');
                        let imgFile = zipContent.file(cleanPath) || zipContent.file('resources/' + cleanPath.split('/').pop());
                        if (imgFile) {
                            const blob = await imgFile.async("blob");
                            imageUrl = URL.createObjectURL(blob);
                        }
                    }
                    blocks.push({
                        id: 'preview-' + Math.random().toString(36).substr(2, 9),
                        type: 'CHOICE',
                        instruction: mod.text || "Identifiez l'image",
                        image: imageUrl || null,
                        options: (pair.options || []).map((opt, idx) => ({
                            id: 'opt-' + idx,
                            text: opt.text,
                            isCorrect: opt.isCorrect
                        })),
                        style: { columns: 6, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20 }
                    });
                }
                continue;
            }

            // Traitement spécial pour COMPOSITE_QUIZ (Consolidation v1.1.15)
            if (mod.mappedType === 'COMPOSITE_QUIZ' && mod.parts) {
                const resolvedParts = [];
                for (const part of mod.parts) {
                    let partImage = part.image;
                    if (part.image && zipContent) {
                        const cleanPath = part.image.replace(/^(\.\/|\.\.\/|\/)+/, '');
                        let imgFile = zipContent.file(cleanPath) || zipContent.file('resources/' + cleanPath.split('/').pop());
                        if (imgFile) {
                            const blob = await imgFile.async("blob");
                            partImage = URL.createObjectURL(blob);
                        }
                    }
                    resolvedParts.push({ ...part, image: partImage });
                }

                blocks.push({
                    id: mod.id,
                    type: 'COMPOSITE_QUIZ',
                    instruction: mod.text || "أُجِيبُ وَ أُحَدِّدُ الْقَرِينَةَ :",
                    parts: resolvedParts,
                    style: { columns: 12, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20 }
                });
                continue;
            }

            // Traitement spécial pour CHOICE (Agrégation Identification)
            if (mod.mappedType === 'CHOICE' && mod.options) {
                blocks.push({
                    id: mod.id,
                    type: 'CHOICE',
                    instruction: mod.text || "Choisissez la bonne réponse",
                    options: mod.options,
                    direction: mod.direction || 'rtl',
                    style: {
                        columns: 12, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20,
                        direction: mod.direction || 'rtl',
                        textAlign: (mod.direction || 'rtl') === 'rtl' ? 'right' : 'left'
                    }
                });
                continue;
            }

            // Traitement spécial pour TEXT_SELECT (Sélection de texte / القرينة)
            if (mod.mappedType === 'TEXT_SELECT' && mod.segments) {
                blocks.push({
                    id: mod.id,
                    type: 'TEXT_SELECT',
                    instruction: mod.text || "أَنْقُرُ عَلَى القَرِينَة الَّتِي تَدُلُّ عَلَى ذَلِكَ :",
                    segments: mod.segments,
                    direction: mod.direction || 'rtl',
                    style: {
                        columns: 12, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20,
                        direction: mod.direction || 'rtl',
                        textAlign: (mod.direction || 'rtl') === 'rtl' ? 'right' : 'left'
                    }
                });
                continue;
            }

            // Traitement spécial pour DROPDOWN_TEXT
            if (mod.mappedType === 'DROPDOWN_TEXT' && mod.groups) {
                blocks.push({
                    id: mod.id,
                    type: 'DROPDOWN_TEXT',
                    instruction: mod.text || "أَخْتارُ الْكَلِمَةَ الْمُنَاسِبَةَ لِكُلِّ جُمْلَةٍ :",
                    sentences: mod.groups,
                    direction: mod.direction || 'rtl',
                    style: {
                        columns: 12, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20,
                        direction: mod.direction || 'rtl',
                        textAlign: (mod.direction || 'rtl') === 'rtl' ? 'right' : 'left'
                    }
                });
                continue;
            }

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

            // Cas spécial : LEARNED (Cloud Brain)
            if (mod.mappedType === 'LEARNED' && mod.template) {
                blocks.push({
                    id: mod.id,
                    type: 'STORY', // On l'affiche comme un bloc Story/HTML
                    title: mod.text || 'Module Appris',
                    content: mod.template,
                    style: { columns: 12, margin: 16, background: 'transparent', borderRadius: '16px', padding: 0 }
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
                image: previewImageUrl || null,
                url: mod.videoUrl || '',
                direction: mod.direction || 'rtl',
                style: {
                    columns: 12, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20,
                    direction: mod.direction || 'rtl',
                    textAlign: (mod.direction || 'rtl') === 'rtl' ? 'right' : 'left'
                }
            });
        }

        setPreviewSlide({
            id: 'preview-' + Date.now(),
            title: selectedPage?.name || 'Aperçu',
            blocks: blocks
        });
    };

    useEffect(() => {
        if (conversionList.length > 0 || activePageRule) {
            generatePreview(conversionList);
        }
    }, [conversionList, activePageRule]);




    const mapType = (type) => {
        const t = type.toLowerCase();
        if (t.includes('text') || t.includes('content') || t.includes('parag')) return 'PARAGRAPH';
        if (t.includes('heading') || t.includes('header') || t.includes('title')) return 'SPLASH';
        if (t.includes('image') || t.includes('picture') || t.includes('photo')) return 'SPLASH_IMAGE';
        if (t.includes('choice') || t.includes('selection') || t.includes('quiz')) return 'CHOICE';
        if (t.includes('video') || t.includes('youtube')) return 'VIDEO';
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
                // Cas spécial : DRAG_DROP_IMAGE
                if (mod.mappedType === 'DRAG_DROP_IMAGE' && mod.pairs) {
                    const finalPairs = [];
                    for (const pair of mod.pairs) {
                        let imageUrl = '';
                        if (pair.image && zipContent) {
                            const cleanPath = pair.image.replace(/^(\.\/|\.\.\/|\/)+/, '');
                            let imgFile = zipContent.file(cleanPath) ||
                                zipContent.file('resources/' + cleanPath.split('/').pop());
                            if (imgFile) {
                                try {
                                    const blob = await imgFile.async("blob");
                                    const fileObj = new File([blob], cleanPath.split('/').pop(), { type: "image/png" });
                                    imageUrl = await uploadAsset(fileObj);
                                } catch (e) { console.warn("Upload asset failed", e); }
                            }
                        }
                        finalPairs.push({ image: imageUrl, answer: pair.answer });
                    }
                    blocks.push({
                        id: 'imp-' + Math.random().toString(36).substr(2, 9),
                        type: 'DRAG_DROP_IMAGE', instruction: mod.text,
                        draggableLabels: mod.labels, dropZones: finalPairs,
                        style: { columns: 12, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20 }
                    });
                    continue;
                }

                // Cas spécial : COMPOSITE_QUIZ (Consolidation v1.1.15)
                if (mod.mappedType === 'COMPOSITE_QUIZ' && mod.parts) {
                    const finalParts = [];
                    for (const part of mod.parts) {
                        let finalImage = part.image;
                        if (part.image && zipContent) {
                            const cleanPath = part.image.replace(/^(\.\/|\.\.\/|\/)+/, '');
                            let imgFile = zipContent.file(cleanPath) || zipContent.file('resources/' + cleanPath.split('/').pop());
                            if (imgFile) {
                                try {
                                    const blob = await imgFile.async("blob");
                                    const fileObj = new File([blob], cleanPath.split('/').pop(), { type: "image/png" });
                                    finalImage = await uploadAsset(fileObj);
                                } catch (e) { console.warn("Upload failed", e); }
                            }
                        }
                        finalParts.push({ ...part, image: finalImage });
                    }

                    blocks.push({
                        id: 'imp-' + Math.random().toString(36).substr(2, 9),
                        type: 'COMPOSITE_QUIZ',
                        instruction: mod.text || "أُجِيبُ وَ أُحَدِّدُ الْقَرِينَةَ :",
                        parts: finalParts,
                        direction: 'rtl',
                        style: { columns: 12, margin: 16 }
                    });
                    continue;
                }

                // Cas spécial : IDENTIFICATION (Mappage vers plusieurs blocs CHOICE)
                if (mod.mappedType === 'IDENTIFICATION' && mod.pairs) {
                    for (const pair of mod.pairs) {
                        let imageUrl = '';
                        if (pair.image && zipContent) {
                            const cleanPath = pair.image.replace(/^(\.\/|\.\.\/|\/)+/, '');
                            let imgFile = zipContent.file(cleanPath) || zipContent.file('resources/' + cleanPath.split('/').pop());
                            if (imgFile) {
                                try {
                                    const blob = await imgFile.async("blob");
                                    const fileObj = new File([blob], cleanPath.split('/').pop(), { type: "image/png" });
                                    imageUrl = await uploadAsset(fileObj);
                                } catch (e) { console.warn("Upload failed", e); }
                            }
                        }
                        blocks.push({
                            id: 'imp-' + Math.random().toString(36).substr(2, 9),
                            type: 'CHOICE',
                            instruction: mod.text || "Identifiez l'image",
                            image: imageUrl,
                            options: (pair.options || []).map((opt, idx) => ({
                                id: 'opt-' + idx,
                                text: opt.text,
                                isCorrect: opt.isCorrect
                            })),
                            style: { columns: 6, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20 }
                        });
                    }
                    continue;
                }

                // Cas spécial : CHOICE (Agrégation Identification)
                if (mod.mappedType === 'CHOICE' && mod.options) {
                    blocks.push({
                        id: 'imp-' + Math.random().toString(36).substr(2, 9),
                        type: 'CHOICE',
                        instruction: mod.text || "Choisissez la bonne réponse",
                        options: mod.options,
                        direction: mod.direction || 'rtl',
                        style: {
                            columns: 12, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20,
                            direction: mod.direction || 'rtl',
                            textAlign: (mod.direction || 'rtl') === 'rtl' ? 'right' : 'left'
                        }
                    });
                    continue;
                }

                // Cas spécial : TEXT_SELECT (Sélection de texte / القرينة)
                if (mod.mappedType === 'TEXT_SELECT' && mod.segments) {
                    blocks.push({
                        id: 'imp-' + Math.random().toString(36).substr(2, 9),
                        type: 'TEXT_SELECT',
                        instruction: mod.text || "أَنْقُرُ عَلَى القَرِينَة الَّتِي تَدُلُّ عَلَى ذَلِكَ :",
                        segments: mod.segments,
                        direction: mod.direction || 'rtl',
                        style: {
                            columns: 12, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20,
                            direction: mod.direction || 'rtl',
                            textAlign: (mod.direction || 'rtl') === 'rtl' ? 'right' : 'left'
                        }
                    });
                    continue;
                }

                // Cas spécial : DROPDOWN_TEXT
                if (mod.mappedType === 'DROPDOWN_TEXT' && mod.groups) {
                    blocks.push({
                        id: 'imp-' + Math.random().toString(36).substr(2, 9),
                        type: 'DROPDOWN_TEXT',
                        instruction: mod.text || "أَخْتارُ الْكَلِمَةَ الْمُنَاسِبَةَ لِكُلِّ جُمْلَةٍ :",
                        sentences: mod.groups,
                        direction: mod.direction || 'rtl',
                        style: {
                            columns: 12, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20,
                            direction: mod.direction || 'rtl',
                            textAlign: (mod.direction || 'rtl') === 'rtl' ? 'right' : 'left'
                        }
                    });
                    continue;
                }

                // Cas spécial : CONNECTING
                if (mod.mappedType === 'CONNECTING' && mod.left && mod.right) {
                    const finalizeItems = async (items) => {
                        return await Promise.all(items.map(async (item) => {
                            if (item && item.includes('/') && zipContent) {
                                const cleanPath = item.replace(/^(\.\/|\.\.\/|\/)+/, '');
                                let imgFile = zipContent.file(cleanPath) ||
                                    zipContent.file('resources/' + cleanPath.split('/').pop());
                                if (imgFile) {
                                    try {
                                        const blob = await imgFile.async("blob");
                                        const fileObj = new File([blob], cleanPath.split('/').pop(), { type: "image/png" });
                                        return await uploadAsset(fileObj);
                                    } catch (e) { console.warn("Upload failed", e); }
                                }
                            }
                            return item;
                        }));
                    };

                    const finalLeft = await finalizeItems(mod.left);
                    const finalRight = await finalizeItems(mod.right);

                    blocks.push({
                        id: 'imp-' + Math.random().toString(36).substr(2, 9),
                        type: 'CONNECTING',
                        instruction: mod.text || "أَرْبُطُ بِمَا يُنَاسِبُ لِأَحْصُلَ عَلَى جُمَلٍ مُفِيدَةٍ :",
                        left: finalLeft,
                        right: finalRight,
                        pairs: mod.pairs,
                        direction: mod.direction || 'rtl',
                        style: {
                            columns: 12, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20,
                            direction: mod.direction || 'rtl',
                            textAlign: (mod.direction || 'rtl') === 'rtl' ? 'right' : 'left'
                        }
                    });
                    continue;
                }

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

                // Cas spécial : LEARNED (Appris via le Cloud)
                if (mod.mappedType === 'LEARNED' && mod.template) {
                    blocks.push({
                        id: 'imp-' + Math.random().toString(36).substr(2, 9),
                        type: 'STORY',
                        title: mod.addonId || 'Module Appris',
                        content: mod.template, // Le HTML rendu
                        style: { columns: 12, margin: 16, background: 'transparent', borderRadius: '16px', padding: 0 }
                    });
                    continue;
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
                    direction: mod.direction || 'rtl',
                    style: {
                        columns: 12, margin: 16, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: 20,
                        direction: mod.direction || 'rtl',
                        textAlign: (mod.direction || 'rtl') === 'rtl' ? 'right' : 'left'
                    }
                };

                // Init spécifique pour les questions QCM
                if (blockType === 'CHOICE') {
                    block.instruction = mod.text || "Répondez à la question";
                    block.options = [
                        { id: 'opt1', text: 'Option 1', isCorrect: true },
                        { id: 'opt2', text: 'Option 2', isCorrect: false }
                    ];
                }

                // Init spécifique pour le MEMORY_GAME
                if (blockType === 'MEMORY_GAME') {
                    block.instruction = mod.instruction || mod.text || "أَتَسَلَّى : أَخْتَارُ الْكَلِمَةَ وَ الصُّورَةَ الْمُنَاسِبَةَ لَهَا .";
                    block.cards = mod.cards || mod.geminiData?.cards || [];
                    block.config = mod.config || mod.geminiData?.config || {};
                    block.audio = mod.audio || mod.geminiData?.audio || {};
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
        <div style={{ height: '100vh', background: 'var(--bg-primary)', color: 'white', display: 'flex', overflow: 'hidden' }}>
            <div className="aurora"></div>

            {/* Admin Sidebar consistent with Admin Home & Settings */}
            <aside style={{
                width: '320px',
                background: 'rgba(18, 21, 45, 0.7)',
                backdropFilter: 'blur(40px)',
                borderRight: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 100
            }}>
                <div style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <AnimatedLogo size={50} />
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', letterSpacing: '1px' }}>ADMIN PANEL</h2>
                        <span style={{ fontSize: '0.6rem', color: 'var(--noor-primary)', fontWeight: 800 }}>IMPORTATEUR</span>
                    </div>
                </div>

                <div style={{ flex: 1, padding: '20px' }}>
                    <div className="sidebar-item" onClick={() => navigate('/admin')}>
                        <Activity size={18} />
                        <span>Vue d'ensemble</span>
                    </div>
                    <div className="sidebar-item active">
                        <Upload size={18} />
                        <span style={{ fontWeight: 700 }}>Import SCORM</span>
                    </div>
                    <div className="sidebar-item" onClick={() => navigate('/settings')}>
                        <SettingsIcon size={18} />
                        <span>Configuration</span>
                    </div>

                    <div style={{ margin: '20px 0', height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>

                    <div className="sidebar-item" onClick={() => navigate('/dashboard')}>
                        <ChevronLeft size={18} />
                        <span>Retour au Studio</span>
                    </div>
                </div>

                {detectedPages.length > 0 && (
                    <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--noor-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>Structure du Pack</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                            {detectedPages.map(page => (
                                <div
                                    key={page.id}
                                    onClick={() => analyzePage(page)}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '10px',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        background: selectedPage?.id === page.id ? 'rgba(123, 97, 255, 0.15)' : 'transparent',
                                        color: selectedPage?.id === page.id ? 'white' : 'rgba(255,255,255,0.5)',
                                        border: '1px solid',
                                        borderColor: selectedPage?.id === page.id ? 'var(--noor-secondary)' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <FileCode size={14} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{page.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Application Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <header style={{
                    padding: '24px 40px',
                    background: 'rgba(18, 21, 45, 0.4)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 90
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>
                                {selectedPage ? 'Analyse de ' : 'Convertisseur '}
                                <span className="gradient-text">{selectedPage ? selectedPage.name : 'SCORM Universal'}</span>
                            </h1>
                            {selectedPage && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Pipeline : XML → JSON → HTML → Noor Studio Blocks</p>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input type="file" ref={fileInputRef} hidden accept=".zip" onChange={handleFileUpload} />

                        {!zipContent ? (
                            <button className="btn-primary" onClick={() => fileInputRef.current?.click()} style={{ padding: '0 32px', height: '56px', borderRadius: '16px' }}>
                                <Upload size={20} /> Sélectionner un pack .ZIP
                            </button>
                        ) : (
                            <>
                                <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} title="Changer de pack">
                                    <RefreshCw size={16} /> Changer de Pack
                                </button>

                                {selectedPage && (
                                    <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '10px' }}>
                                        <button
                                            className={`btn-secondary ${!showDebugJson && !showGeneratedHtml && !previewMode && !showRaw ? 'active' : ''}`}
                                            onClick={() => { setShowDebugJson(false); setShowGeneratedHtml(false); setPreviewMode(false); setShowRaw(false); }}
                                        >
                                            Modules
                                        </button>
                                        <button
                                            className={`btn-secondary ${previewMode ? 'active' : ''}`}
                                            style={{ color: 'var(--noor-secondary)', fontWeight: 800 }}
                                            onClick={() => { setPreviewMode(!previewMode); setShowDebugJson(false); setShowGeneratedHtml(false); setShowRaw(false); }}
                                        >
                                            <Eye size={16} /> APERÇU LUXE
                                        </button>
                                    </div>
                                )}

                                <button
                                    className="btn-primary"
                                    onClick={finalizeImport}
                                    style={{ padding: '0 24px', height: '48px', borderRadius: '12px' }}
                                    disabled={isProcessing || conversionList.filter(m => m.selected).length === 0}
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <Layers size={18} />}
                                    Importer ({conversionList.filter(m => m.selected).length})
                                </button>
                            </>
                        )}
                    </div>

                    {selectedPage && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '10px' }}>
                                <button
                                    className={`btn-secondary ${!showDebugJson && !showGeneratedHtml && !previewMode && !showRaw ? 'active' : ''}`}
                                    onClick={() => { setShowDebugJson(false); setShowGeneratedHtml(false); setPreviewMode(false); setShowRaw(false); }}
                                >
                                    <Layers size={16} /> Modules
                                </button>
                                <button
                                    className={`btn-secondary ${previewMode ? 'active' : ''}`}
                                    style={{ color: 'var(--noor-secondary)', fontWeight: 800 }}
                                    onClick={() => { setPreviewMode(!previewMode); setShowDebugJson(false); setShowGeneratedHtml(false); setShowRaw(false); }}
                                >
                                    <Eye size={16} /> APERÇU LUXE
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={() => setShowStudioModal(true)}
                                >
                                    <Monitor size={16} /> Studio
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '10px' }}>
                                <button
                                    className={`btn-secondary ${showDebugJson ? 'active' : ''}`}
                                    onClick={() => { setShowDebugJson(!showDebugJson); setShowGeneratedHtml(false); setPreviewMode(false); setShowRaw(false); }}
                                >
                                    JSON
                                </button>
                                <button
                                    className={`btn-secondary ${showGeneratedHtml ? 'active' : ''}`}
                                    onClick={() => { setShowGeneratedHtml(!showGeneratedHtml); setShowDebugJson(false); setPreviewMode(false); setShowRaw(false); }}
                                >
                                    HTML
                                </button>
                            </div>
                        </div>
                    )}
                </header>

                <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                    {!zipContent ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    maxWidth: '800px',
                                    width: '100%',
                                    background: 'rgba(18, 21, 45, 0.4)',
                                    borderRadius: '40px',
                                    padding: '80px 40px',
                                    border: '1px solid var(--border-color)',
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '32px'
                                }}
                            >
                                <div style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '40px',
                                    background: 'rgba(72, 52, 212, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative'
                                }}>
                                    <Upload size={64} color="var(--noor-primary)" />
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        style={{ position: 'absolute', inset: -20, background: 'var(--noor-primary)', filter: 'blur(30px)', borderRadius: '50%', zIndex: -1 }}
                                    />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '16px' }}>Importation Intelligente</h2>
                                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto', lineHeight: '1.7' }}>
                                        Glissez-déposez votre pack SCORM (.zip) ici pour commencer la conversion automatique vers le format Noor Studio.
                                    </p>
                                </div>
                                <button
                                    className="btn-primary"
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ padding: '0 48px', height: '64px', borderRadius: '20px', fontSize: '1.1rem' }}
                                >
                                    Explorer les fichiers
                                </button>
                                <div style={{ display: 'flex', gap: '24px', marginTop: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <CheckCircle2 size={16} color="var(--noor-success)" /> Analyse Manifeste
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <CheckCircle2 size={16} color="var(--noor-success)" /> Extraction Médias
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <CheckCircle2 size={16} color="var(--noor-success)" /> Cloud Learning
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    ) : selectedPage ? (
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
                            ) : showDebugJson ? (
                                <div style={{ padding: '48px', height: '100%', overflow: 'auto' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>MÉTADONNÉES JSON (Étape 1)</h3>
                                        <button className="btn-secondary" onClick={() => {
                                            navigator.clipboard.writeText(JSON.stringify(debugMetadata, null, 2));
                                            toast.success("JSON copié !");
                                        }}>Copier le JSON</button>
                                    </div>
                                    <pre style={{
                                        background: '#0a0c1a',
                                        padding: '24px',
                                        borderRadius: '20px',
                                        border: '1px solid #7b61ff',
                                        fontSize: '0.8rem',
                                        color: '#00e676',
                                        fontFamily: 'monospace'
                                    }}>
                                        {JSON.stringify(debugMetadata, null, 2)}
                                    </pre>
                                </div>
                            ) : showGeneratedHtml ? (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ padding: '15px 48px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '1rem' }}>FICHIER HTML GÉNÉRÉ (Étape 2)</h3>
                                        <button className="btn-secondary" onClick={() => {
                                            const blob = new Blob([generatedHTML], { type: 'text/html' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `exercice-${selectedPage.name}.html`;
                                            a.click();
                                        }}>Télécharger le HTML</button>
                                    </div>
                                    <iframe
                                        srcDoc={generatedHTML}
                                        style={{ flex: 1, border: 'none', background: 'white' }}
                                        title="Generated HTML Preview"
                                    />
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
                                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '48px' }}>
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
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--noor-secondary)' }}>SOURCE: {mod.originalType?.toUpperCase() || 'UNKNOWN'}</span>
                                                        {mod.isGuessed && (
                                                            <span style={{
                                                                fontSize: '0.6rem',
                                                                background: 'rgba(76, 209, 55, 0.1)',
                                                                color: '#4cd137',
                                                                padding: '2px 8px',
                                                                borderRadius: '4px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                fontWeight: 800
                                                            }}>
                                                                <Brain size={10} /> SMART DISCOVERY
                                                            </span>
                                                        )}
                                                    </div>
                                                    <ArrowRight size={14} opacity={0.3} />
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(123, 97, 255, 0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(123, 97, 255, 0.2)' }}>
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--noor-secondary)' }}>CIBLE: {mod.mappedType?.toUpperCase()}</span>
                                                    </div>

                                                    {(mod.mappedType === 'UNCATEGORIZED' || mod.isGuessed) && (
                                                        <button
                                                            onClick={() => setTeachingModule(mod)}
                                                            className="btn-secondary"
                                                            style={{
                                                                padding: '4px 10px',
                                                                fontSize: '0.65rem',
                                                                background: 'rgba(255,255,255,0.02)',
                                                                color: 'var(--noor-secondary)',
                                                                border: '1px dashed var(--noor-secondary)',
                                                                marginLeft: 'auto'
                                                            }}
                                                        >
                                                            <Brain size={12} /> ENSEIGNER LE DESIGN
                                                        </button>
                                                    )}
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
                                                        <option value="MEMORY_GAME">🎴 Memo Game Noor</option>
                                                        <option value="STORY">🎯 Activité Iframe</option>
                                                        <option value="LEARNED">🧠 Appris du Cloud</option>
                                                        <option value="UNCATEGORIZED">❓ Inconnu</option>
                                                    </select>

                                                    {mod.properties && (
                                                        <button
                                                            className="btn-secondary"
                                                            style={{ padding: '6px 12px', fontSize: '0.7rem', background: 'transparent', border: '1px solid var(--noor-secondary)', color: 'var(--noor-secondary)' }}
                                                            onClick={() => setTeachingModule(mod)}
                                                            title="Enseigner le design de ce module"
                                                        >
                                                            <Brain size={14} />
                                                        </button>
                                                    )}
                                                </div>

                                                {mod.mappedType === 'LEARNED' && (
                                                    <div style={{ marginBottom: '15px', fontSize: '0.8rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(74, 222, 128, 0.1)', padding: '8px 12px', borderRadius: '8px' }}>
                                                        <CheckCircle2 size={14} /> Ce module est géré par une méthode apprise dans le Cloud.
                                                    </div>
                                                )}

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
                            <div style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '32px',
                                background: 'rgba(123, 97, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '24px'
                            }}>
                                <FileSearch size={48} color="var(--noor-secondary)" />
                            </div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '16px' }}>Sélectionnez une page</h2>
                            <p style={{ maxWidth: '450px', color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.7' }}>
                                L'assistant a analysé {detectedPages.length} ressources. Sélectionnez une page dans la barre latérale pour commencer la conversion.
                            </p>
                        </div>
                    )}
                </main>
            </div>


            {/* --- MODALE D'APPRENTISSAGE (TEACHING) --- */}
            <AnimatePresence>
                {teachingModule && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            style={{
                                width: '1400px', maxWidth: '98vw', height: '90vh',
                                background: 'var(--bg-tertiary)', borderRadius: '32px',
                                border: '1px solid var(--glass-border)',
                                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                                boxShadow: '0 50px 100px -20px rgba(0,0,0,0.7)'
                            }}
                        >
                            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ padding: '10px', background: 'var(--noor-secondary)', borderRadius: '12px' }}>
                                        <Brain size={24} color="white" />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>
                                            {teachingModule.isPage ? "Enseigner le Design de la PAGE" : "Enseigner un nouveau type"}
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.5 }}>
                                            {teachingModule.isPage ? `Signature Page: ${teachingModule.signature}` : `Addon: ${teachingModule.addonId} | ADN: ${teachingModule.signature}`}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setTeachingModule(null)} className="sidebar-item" style={{ padding: '8px' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                                {/* Gauche: Données JSON */}
                                <div style={{ width: '300px', borderRight: '1px solid var(--glass-border)', padding: '24px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--noor-secondary)', textTransform: 'uppercase' }}>
                                            {teachingModule.geminiData ? "JSON Gemini (Recommandé)" : "Propriétés mAuthor"}
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn-secondary"
                                                onClick={() => {
                                                    const dataToCopy = teachingModule.geminiData || teachingModule.properties;
                                                    navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
                                                    toast.success("JSON copié !");
                                                }}
                                                style={{ padding: '4px 10px', fontSize: '0.65rem', background: 'rgba(123, 97, 255, 0.1)', border: '1px solid var(--noor-secondary)' }}
                                            >
                                                <Code size={12} /> Copier
                                            </button>
                                        </div>
                                    </div>
                                    <pre style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#00ffcc' }}>
                                        {JSON.stringify(teachingModule.geminiData || teachingModule.properties, null, 2)}
                                    </pre>

                                    {teachingModule.geminiData && (
                                        <div style={{ marginTop: '20px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Note: Utilisez ces clés dans vos templates.</span>
                                        </div>
                                    )}
                                </div>

                                {/* Milieu: Éditeur de Template */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', borderRight: '1px solid var(--glass-border)' }}>
                                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Template HTML / CSS</span>
                                            <p style={{ fontSize: '0.7rem', opacity: 0.4 }}>Utilisez les variables du JSON (ex: {"{{Pairs}}"}).</p>
                                        </div>
                                        <button
                                            className="btn-secondary"
                                            style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--noor-primary)' }}
                                            onClick={() => {
                                                const raw = document.getElementById('brain-template-editor').value;
                                                const cleaned = ConversionBrain.cleanHTML(raw);
                                                const dataForRender = teachingModule.geminiData || teachingModule.properties;
                                                const rendered = ConversionBrain.render(cleaned, dataForRender);
                                                setTeachingPreview(rendered);
                                            }}
                                        >
                                            <RefreshCw size={14} /> Rafraîchir
                                        </button>
                                    </div>
                                    <textarea
                                        id="brain-template-editor"
                                        placeholder="Collez ici le code HTML/CSS complet..."
                                        onPaste={(e) => {
                                            setTimeout(() => {
                                                const raw = document.getElementById('brain-template-editor').value;
                                                const cleaned = ConversionBrain.cleanHTML(raw);
                                                const dataForRender = teachingModule.geminiData || teachingModule.properties;
                                                const rendered = ConversionBrain.render(cleaned, dataForRender);
                                                setTeachingPreview(rendered);
                                            }, 100);
                                        }}
                                        style={{
                                            flex: 1,
                                            background: '#0a0c1a',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            color: '#00ffcc',
                                            fontFamily: 'monospace',
                                            fontSize: '0.9rem',
                                            resize: 'none',
                                            lineHeight: '1.5'
                                        }}
                                        defaultValue={teachingModule.template || ''}
                                    />

                                    <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
                                        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setTeachingModule(null); setTeachingPreview(""); }}>Annuler</button>
                                        <button
                                            className="btn-primary"
                                            style={{ flex: 2 }}
                                            onClick={async () => {
                                                const template = document.getElementById('brain-template-editor').value;
                                                if (!template) return toast.error("Le template est vide");

                                                const loader = toast.loading("Mémorisation dans le Cloud...");
                                                try {
                                                    await ConversionBrain.learn(teachingModule.signature, teachingModule.addonId, template);
                                                    toast.success("Cerveau mis à jour !");
                                                    setTeachingModule(null);
                                                    setTeachingPreview("");
                                                    analyzePage(selectedPage);
                                                } catch (e) {
                                                    toast.error("Erreur de sauvegarde");
                                                } finally {
                                                    toast.dismiss(loader);
                                                }
                                            }}
                                        >
                                            <Save size={18} /> Enregistrer sur le Cloud
                                        </button>
                                    </div>
                                </div>

                                {/* Droite: Aperçu en temps réel */}
                                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', background: '#e0e1e6', overflow: 'hidden' }}>
                                    <div style={{ padding: '8px 16px', background: 'white', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Eye size={16} color="#4834d4" />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2d3436' }}>APERÇU RÉEL</span>
                                        </div>
                                        <div style={{ display: 'none' }}>
                                            <button
                                                onClick={() => setPreviewDevice('desktop')}
                                                style={{ padding: '6px', borderRadius: '6px', border: 'none', background: previewDevice === 'desktop' ? '#4834d4' : 'transparent', color: previewDevice === 'desktop' ? 'white' : '#636e72', cursor: 'pointer' }}
                                                title="Bureau (100%)"
                                            >
                                                <Monitor size={16} />
                                            </button>
                                            <button
                                                onClick={() => setPreviewDevice('tablet')}
                                                style={{ padding: '6px', borderRadius: '6px', border: 'none', background: previewDevice === 'tablet' ? '#4834d4' : 'transparent', color: previewDevice === 'tablet' ? 'white' : '#636e72', cursor: 'pointer' }}
                                                title="Tablette (768px)"
                                            >
                                                <Tablet size={16} />
                                            </button>
                                            <button
                                                onClick={() => setPreviewDevice('mobile')}
                                                style={{ padding: '6px', borderRadius: '6px', border: 'none', background: previewDevice === 'mobile' ? '#4834d4' : 'transparent', color: previewDevice === 'mobile' ? 'white' : '#636e72', cursor: 'pointer' }}
                                                title="Mobile (375px)"
                                            >
                                                <Smartphone size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px' }}>
                                        {teachingPreview ? (
                                            <div style={{
                                                width: '100%',
                                                height: '100%',
                                                background: 'white',
                                                boxShadow: 'none',
                                                borderRadius: '0',
                                                overflow: 'hidden',
                                                border: 'none',
                                                transition: 'none'
                                            }}>
                                                <iframe
                                                    srcDoc={teachingPreview}
                                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                                    title="Teaching Preview"
                                                />
                                            </div>
                                        ) : (
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#b2bec3', gap: '16px', height: '100%' }}>
                                                <Brain size={48} opacity={0.2} />
                                                <p style={{ fontSize: '0.9rem' }}>Collez du code pour voir le résultat</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- MODALE D'APERÇU STUDIO (NOOR BLOCKS) --- */}
            <AnimatePresence>
                {showStudioModal && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 10000,
                        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{
                                width: '1000px', maxWidth: '90vw', height: '80vh',
                                background: 'var(--bg-tertiary)', borderRadius: '32px',
                                display: 'flex', flexDirection: 'column', overflow: 'hidden'
                            }}
                        >
                            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontWeight: 900 }}>Aperçu Studio (Blocs Noor)</h3>
                                <button onClick={() => setShowStudioModal(false)} className="sidebar-item" style={{ padding: '8px' }}>
                                    <X size={24} />
                                </button>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '32px', background: 'var(--bg-primary)' }}>
                                {previewSlide ? (
                                    <SlideRenderer
                                        key="studio-preview"
                                        slide={previewSlide}
                                        isPreview={true}
                                    />
                                ) : (
                                    <div style={{ textAlign: 'center', opacity: 0.5, padding: '100px' }}>
                                        Aucun bloc à prévisualiser.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div >
    );
};

export default SCORMImporter;
