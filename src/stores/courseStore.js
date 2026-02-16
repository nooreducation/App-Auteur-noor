import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

const DEFAULT_HEADER = {
    id: 'global-header',
    title: 'En-tête',
    blocks: [
        {
            id: 'header-block-0',
            title: 'Contenu En-tête',
            style: { columns: 12, minHeight: 60, background: 'transparent', padding: 0, margin: 0 },
            elements: [
                { id: 'logo-main', type: 'ANIMATED_LOGO', size: 35, cellId: 'h-cell-1' },
                { id: 'title-main', type: 'COURSE_TITLE', cellId: 'h-cell-2' },
                { id: 'counter-main', type: 'SLIDE_COUNTER', cellId: 'h-cell-3' }
            ]
        }
    ]
};

const DEFAULT_FOOTER = {
    id: 'global-footer',
    title: 'Pied de page',
    blocks: [
        {
            id: 'footer-block-0',
            title: 'Contenu Pied de page',
            style: { columns: 12, minHeight: 'auto', background: 'transparent', padding: 0, margin: 0 },
            elements: []
        }
    ]
};

const verifyCourseIntegrity = (courseData) => {
    if (!courseData) return courseData;
    const data = { ...courseData };

    if (!data.playerConfig) {
        data.playerConfig = {
            showHeader: true,
            showFooter: true,
            showProgressBar: true,
            showInteractionScore: true,
            showSlideCounter: true,
            headerBackground: 'rgba(18, 21, 45, 0.98)',
            footerBackground: 'rgba(18, 21, 45, 0.98)',
            logoUrl: null,
        };
    }

    if (!data.playerConfig.headerLayout) {
        data.playerConfig.headerLayout = {
            cells: [
                { id: 'h-cell-1', span: 3, alignment: 'left' },
                { id: 'h-cell-2', span: 6, alignment: 'center' },
                { id: 'h-cell-3', span: 3, alignment: 'right' }
            ],
            isRTL: false,
            height: 60,
            background: 'rgba(18, 21, 45, 0.98)',
            isCard: false,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            borderRadius: 12,
            padding: 10,
            gap: 4
        };
    } else {
        // Migration of existing fields to the new layout object if they are at the top level
        if (data.playerConfig.headerHeight && !data.playerConfig.headerLayout.height) {
            data.playerConfig.headerLayout.height = data.playerConfig.headerHeight;
        }
        if (data.playerConfig.headerBackground && !data.playerConfig.headerLayout.background) {
            data.playerConfig.headerLayout.background = data.playerConfig.headerBackground;
        }
        // Ensure defaults for new fields
        data.playerConfig.headerLayout = {
            height: 60,
            background: 'rgba(18, 21, 45, 0.98)',
            isCard: false,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            borderRadius: 12,
            padding: 10,
            gap: 4,
            isRTL: false,
            ...data.playerConfig.headerLayout
        };
    }

    if (!data.playerConfig.footerLayout) {
        data.playerConfig.footerLayout = {
            cells: [
                { id: 'f-cell-prev', span: 3, alignment: 'left' },
                { id: 'f-cell-counter', span: 6, alignment: 'center' },
                { id: 'f-cell-next', span: 3, alignment: 'right' }
            ],
            isRTL: false,
            height: 72,
            background: 'rgba(18, 21, 45, 0.98)',
            isCard: false,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            borderRadius: 12,
            padding: 10,
            gap: 4
        };
    } else {
        if (data.playerConfig.footerHeight && !data.playerConfig.footerLayout.height) {
            data.playerConfig.footerLayout.height = data.playerConfig.footerHeight;
        }
        if (data.playerConfig.footerBackground && !data.playerConfig.footerLayout.background) {
            data.playerConfig.footerLayout.background = data.playerConfig.footerBackground;
        }
        data.playerConfig.footerLayout = {
            height: 72,
            background: 'rgba(18, 21, 45, 0.98)',
            isCard: false,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            borderRadius: 12,
            padding: 10,
            gap: 4,
            isRTL: false,
            ...data.playerConfig.footerLayout
        };
    }

    // Si le header n'existe pas ou s'il est à l'ancienne version (pas de blocs ou blocs vides)
    if (!data.header || !data.header.blocks || data.header.blocks.length === 0) {
        data.header = DEFAULT_HEADER;
    }

    if (!data.footer) {
        data.footer = DEFAULT_FOOTER;
    }

    if (!data.slides || data.slides.length === 0) {
        data.slides = [{ id: 'slide-0', title: 'Bienvenue !', blocks: [{ id: 'block-0', type: 'SPLASH', title: 'Bienvenue !', description: 'Introduction de votre nouveau module interactif.' }] }];
    }
    return data;
};

const useCourseStore = create(
    persist(
        (set, get) => ({
            course: {
                id: null,
                title: 'Mon Nouveau Cours',
                level: 'Primaire 1',
                subject: 'Mathématiques',
                aspectRatio: '16/9',
                autoFullscreen: false,
                theme: {
                    primary: '#4834d4',
                    secondary: '#7b61ff',
                    accent: '#ff4757',
                },
                playerConfig: {
                    showHeader: true,
                    showFooter: true,
                    showProgressBar: true,
                    showInteractionScore: true,
                    showSlideCounter: true,
                    headerBackground: 'rgba(18, 21, 45, 0.98)',
                    footerBackground: 'rgba(18, 21, 45, 0.98)',
                    logoUrl: null,
                    headerLayout: {
                        cells: [
                            { id: 'h-cell-1', span: 3, alignment: 'left' },
                            { id: 'h-cell-2', span: 6, alignment: 'center' },
                            { id: 'h-cell-3', span: 3, alignment: 'right' }
                        ],
                        isRTL: false
                    },
                    footerLayout: {
                        cells: [
                            { id: 'f-cell-1', span: 3, alignment: 'left' },
                            { id: 'f-cell-2', span: 6, alignment: 'center' },
                            { id: 'f-cell-3', span: 3, alignment: 'right' }
                        ],
                        isRTL: false
                    }
                },
                header: {
                    id: 'global-header',
                    title: 'En-tête',
                    blocks: [
                        {
                            id: 'header-block-0',
                            title: 'Contenu En-tête',
                            style: {
                                columns: 12,
                                minHeight: 'auto',
                                background: 'transparent',
                                padding: 10,
                                margin: 0
                            },
                            elements: [
                                { id: 'logo-main', type: 'ANIMATED_LOGO', size: 40, cellId: 'h-cell-1' }
                            ]
                        }
                    ],
                    style: { padding: 0 }
                },
                footer: {
                    id: 'global-footer',
                    title: 'Pied de page',
                    blocks: [
                        {
                            id: 'footer-block-0',
                            title: 'Contenu Pied de page',
                            style: {
                                columns: 12,
                                minHeight: 'auto',
                                background: 'transparent',
                                padding: 10,
                                margin: 0
                            },
                            elements: []
                        }
                    ],
                    style: { padding: 0 }
                },
                slides: [
                    {
                        id: 'slide-0',
                        title: 'Bienvenue !',
                        blocks: [
                            {
                                id: 'block-0',
                                type: 'SPLASH',
                                title: 'Bienvenue !',
                                description: 'Introduction de votre nouveau module interactif.',
                                image: '',
                            }
                        ],
                    }
                ],
            },
            activeSlideIndex: 0,
            activeBlockIndex: 0,
            activeComponentIndex: null,
            activeGlobalElement: null, // 'header' | 'footer' | null
            isPreviewMode: false,
            levels: [],
            subjects: [],
            isSaving: false,
            isLoadingCategories: false,
            userProfile: null,
            activeDraggedItem: null,
            dashboardCourses: [],
            lastSaved: null,
            lastError: null,

            // Actions
            setCourse: (course) => set({ course: verifyCourseIntegrity(course) }),

            updateCourseMetadata: (fields) => set((state) => ({
                course: { ...state.course, ...fields }
            })),

            setActiveSlideIndex: (index) => set({
                activeSlideIndex: index,
                activeBlockIndex: 0,
                activeComponentIndex: null,
                activeGlobalElement: null
            }),

            setEditingGlobalElement: (type) => set({
                activeGlobalElement: type,
                activeSlideIndex: null,
                activeBlockIndex: 0,
                activeComponentIndex: null
            }),

            setActiveBlockIndex: (index) => set({ activeBlockIndex: index, activeComponentIndex: null }),

            setActiveComponentIndex: (index) => set({ activeComponentIndex: index }),

            setPreviewMode: (isMode) => set({ isPreviewMode: isMode }),

            setDraggedItem: (item) => set({ activeDraggedItem: item }),

            fetchUserProfile: async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return null;

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    const admins = ['admin@noor.com', 'khayati.med.ahmed@gmail.com'];
                    const profile = {
                        ...data,
                        role: admins.includes(user.email) ? 'admin' : data.role
                    };
                    set({ userProfile: profile });
                    return profile;
                }

                // Fallback for new users or admin
                const admins = ['admin@noor.com', 'khayati.med.ahmed@gmail.com'];
                const profile = {
                    role: admins.includes(user.email) ? 'admin' : 'author',
                    allowed_levels: [],
                    allowed_subjects: []
                };
                set({ userProfile: profile });
                return profile;
            },

            // --- Supabase Actions ---

            saveCourse: async () => {
                const { course, userProfile } = get();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    set({ lastError: 'Session expirée' });
                    return false;
                }

                set({ isSaving: true, lastError: null });

                try {
                    // 1. Génération du Slug (Peaufinée pour la stabilité)
                    let slug = course.slug || course.title.toLowerCase()
                        .trim()
                        .replace(/ /g, '-')
                        .replace(/[^\w-]+/g, '');

                    if (!slug) slug = `cours-${Date.now()}`;

                    // 2. STRATÉGIE ANTI-CRASH : Exportation JSON vers le Storage (CDN)
                    // On prépare le fichier JSON complet
                    const courseContent = JSON.stringify({ ...course, slug });
                    const blob = new Blob([courseContent], { type: 'application/json' });
                    const fileName = `${slug}.json`;
                    const filePath = `published/${fileName}`;

                    // Upload vers le Storage (Bucket 'courses' supposé public)
                    const { error: uploadError } = await supabase.storage
                        .from('courses')
                        .upload(filePath, blob, {
                            upsert: true,
                            contentType: 'application/json'
                        });

                    if (uploadError) {
                        console.warn('Storage upload failed, falling back to DB only:', uploadError);
                        // On continue quand même pour ne pas perdre le travail en DB
                    }

                    // 3. Sauvegarde des Métadonnées en DB
                    let result;
                    const courseData = {
                        title: course.title,
                        slug: slug,
                        data: { ...course, slug, content_path: filePath }, // On garde le JSONB et on y injecte le chemin du CDN
                        user_id: user.id,
                        updated_at: new Date().toISOString()
                    };

                    if (course.id && !course.id.startsWith('new-course')) {
                        // Update existing
                        let query = supabase
                            .from('courses')
                            .update(courseData)
                            .eq('id', course.id);

                        if (userProfile?.role !== 'admin') {
                            query = query.eq('user_id', user.id);
                        }

                        result = await query.select();
                    } else {
                        // Insert new
                        result = await supabase
                            .from('courses')
                            .insert([courseData])
                            .select();

                        if (result.data?.[0]) {
                            set({ course: { ...course, id: result.data[0].id, slug } });
                        }
                    }

                    if (result.error) throw result.error;
                    return true;
                } catch (error) {
                    console.error('Error saving course:', error);
                    set({ lastError: error.message });
                    return false;
                } finally {
                    set({ isSaving: false });
                }
            },

            fetchDashboardCourses: async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const profile = await get().fetchUserProfile();
                set({ isSaving: true, lastError: null });

                try {
                    let data = [];
                    let error = null;

                    if (profile && profile.role === 'admin') {
                        // Admin: Fetch EVERYTHING
                        const res = await supabase.from('courses').select('*').order('updated_at', { ascending: false });
                        data = res.data;
                        error = res.error;
                    } else {
                        // Author: Fetch own courses OR courses in allowed categories
                        // Note: Supabase JS filter 'or' is tricky for complex logic across related fields
                        // For simplicity and clarity, we fetch their own courses
                        const ownRes = await supabase
                            .from('courses')
                            .select('*')
                            .eq('user_id', user.id)
                            .order('updated_at', { ascending: false });

                        let combinedData = ownRes.data || [];

                        // If they have category permissions, fetch those too
                        // Note: level/subject are currently only in the JSONB 'data' field, 
                        // so we can't filter via .in() on the top level.
                        if (profile?.allowed_levels?.length > 0 || profile?.allowed_subjects?.length > 0) {
                            const sharedRes = await supabase.from('courses').select('*');

                            if (sharedRes.data) {
                                const sharedCourses = sharedRes.data.filter(c => {
                                    const cLevel = c.data?.level;
                                    const cSubject = c.data?.subject;

                                    const levelMatch = profile.allowed_levels?.length > 0 && profile.allowed_levels.includes(cLevel);
                                    const subjectMatch = profile.allowed_subjects?.length > 0 && profile.allowed_subjects.includes(cSubject);

                                    return levelMatch || subjectMatch;
                                });

                                // Merge and remove duplicates
                                const existingIds = new Set(combinedData.map(c => c.id));
                                const newCourses = sharedCourses.filter(c => !existingIds.has(c.id));
                                combinedData = [...combinedData, ...newCourses];
                            }
                        }

                        data = combinedData;
                        error = ownRes.error;
                    }

                    if (error) throw error;
                    set({ dashboardCourses: data || [] });
                } catch (error) {
                    console.error('Error fetching courses:', error);
                    set({ lastError: error.message });
                } finally {
                    set({ isSaving: false });
                }
            },

            loadCourseById: async (courseId) => {
                try {
                    const { data, error } = await supabase
                        .from('courses')
                        .select('*')
                        .eq('id', courseId)
                        .single();

                    if (error) throw error;

                    if (data) {
                        const courseData = verifyCourseIntegrity(data.data);
                        set({ course: courseData });
                        return courseData;
                    }
                    return null;
                } catch (error) {
                    console.error('Error loading course:', error);
                    set({ lastError: error.message });
                    return null;
                }
            },

            deleteCourse: async (id) => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return false;

                const profile = get().userProfile;

                try {
                    let query = supabase
                        .from('courses')
                        .delete()
                        .eq('id', id);

                    // If not admin, can only delete own courses
                    if (profile?.role !== 'admin') {
                        query = query.eq('user_id', user.id);
                    }

                    const { error } = await query;

                    if (error) throw error;

                    set((state) => ({
                        dashboardCourses: state.dashboardCourses.filter(c => c.id !== id)
                    }));
                    return true;
                } catch (error) {
                    console.error('Error deleting course:', error);
                    return false;
                }
            },

            fetchCategories: async () => {
                set({ isLoadingCategories: true });
                try {
                    const profile = await get().fetchUserProfile();

                    const [levelsRes, subjectsRes] = await Promise.all([
                        supabase.from('levels').select('name').order('name'),
                        supabase.from('subjects').select('name').order('name')
                    ]);

                    let allLevels = levelsRes.data?.map(l => l.name) || [];
                    let allSubjects = subjectsRes.data?.map(s => s.name) || [];

                    // Filter if not admin
                    if (profile && profile.role !== 'admin') {
                        if (profile.allowed_levels?.length > 0) {
                            allLevels = allLevels.filter(l => profile.allowed_levels.includes(l));
                        }
                        if (profile.allowed_subjects?.length > 0) {
                            allSubjects = allSubjects.filter(s => profile.allowed_subjects.includes(s));
                        }
                    }

                    set({
                        levels: allLevels,
                        subjects: allSubjects,
                        isLoadingCategories: false
                    });
                } catch (error) {
                    console.error('Error categories catch:', error);
                    set({ isLoadingCategories: false });
                }
            },

            loadCourse: (courseData) => set({
                course: courseData,
                activeSlideIndex: 0
            }),

            updateCourseMetadata: (metadata) => set((state) => ({
                course: { ...state.course, ...metadata }
            })),

            setEditingGlobalElement: (element) => set({ activeGlobalElement: element }),

            setCourse: (course) => set({ course }),
            setPreviewMode: (mode) => set({ isPreviewMode: mode }),

            uploadAsset: async (file) => {
                const { course } = get();

                // Helper to clean strings for URL/Path
                const clean = (str) => str.toLowerCase().trim()
                    .replace(/ /g, '-')
                    .replace(/[^\w-]+/g, '');

                const levelFolder = clean(course.level || 'sans-niveau');
                const subjectFolder = clean(course.subject || 'sans-matiere');
                const courseFolder = clean(course.title || 'nouveau-cours');

                // Path structure: level/subject/course-slug/timestamp-filename
                const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const filePath = `${levelFolder}/${subjectFolder}/${courseFolder}/${fileName}`;

                try {
                    const { data, error } = await supabase.storage
                        .from('course-assets')
                        .upload(filePath, file);

                    if (error) throw error;

                    const { data: { publicUrl } } = supabase.storage
                        .from('course-assets')
                        .getPublicUrl(filePath);

                    return publicUrl;
                } catch (error) {
                    console.error('Upload error:', error);
                    return null;
                }
            },

            // --- Slide Actions ---

            addSlide: () => set((state) => {
                const newSlide = {
                    id: 'slide-' + Date.now(),
                    title: 'Nouvelle Diapositive',
                    blocks: [
                        {
                            id: 'block-' + Date.now(),
                            type: 'SPLASH',
                            title: 'Bienvenue !',
                            description: '',
                            image: '',
                            style: {
                                columns: 12,
                                minHeight: 'auto',
                                background: 'transparent',
                                borderColor: 'transparent',
                                borderWidth: '0px',
                                borderRadius: '24px',
                                padding: 24,
                                margin: 16,
                                showBorder: false
                            }
                        }
                    ],
                    style: {
                        padding: 24,
                        background: 'transparent'
                    }
                };
                const newSlides = [...state.course.slides];
                newSlides.splice(state.activeSlideIndex + 1, 0, newSlide);
                return {
                    course: { ...state.course, slides: newSlides },
                    activeSlideIndex: state.activeSlideIndex + 1,
                    activeBlockIndex: 0
                };
            }),

            updateActiveSlide: (fields) => set((state) => {
                if (state.activeGlobalElement) {
                    const key = state.activeGlobalElement; // 'header' or 'footer'
                    return {
                        course: {
                            ...state.course,
                            [key]: { ...state.course[key], ...fields }
                        }
                    };
                }
                const newSlides = [...state.course.slides];
                newSlides[state.activeSlideIndex] = {
                    ...newSlides[state.activeSlideIndex],
                    ...fields
                };
                return { course: { ...state.course, slides: newSlides } };
            }),

            // --- Block Actions ---

            addBlock: (type = null) => set((state) => {
                const { activeGlobalElement, activeSlideIndex } = state;
                let target;
                if (activeGlobalElement) {
                    target = { ...state.course[activeGlobalElement] };
                } else {
                    target = { ...state.course.slides[activeSlideIndex] };
                }

                const newBlock = {
                    id: 'block-' + Date.now(),
                    title: 'Nouveau Bloc',
                    style: {
                        columns: 12,
                        minHeight: 'auto',
                        background: 'transparent',
                        borderColor: 'transparent',
                        borderWidth: '0px',
                        borderRadius: '24px',
                        padding: 24,
                        margin: 16,
                        showBorder: false
                    },
                    elements: []
                };

                // If a type is provided, auto-add a component of that type
                if (type) {
                    const newComponent = {
                        id: 'comp-' + Date.now(),
                        type,
                        title: 'Nouveau ' + type,
                        ...(type === 'CHOICE' ? { options: [{ text: 'Option 1', isCorrect: false }], instruction: 'Choisissez la bonne réponse' } : {}),
                        ...(type === 'CHOICE_MULTI' ? { options: [{ text: 'Réponse A', isCorrect: false }], instruction: 'Sélectionnez toutes les bonnes réponses' } : {}),
                        ...(type === 'TRUE_FALSE' ? { instruction: 'Vrai ou Faux ?', question: '', correctAnswer: 'VRAI' } : {}),
                        ...(type === 'STORY' ? { url: '', title: 'Histoire' } : {}),
                        ...(type === 'GAP_FILL' ? { content: '', instruction: 'Complétez le texte' } : {}),
                        ...(type === 'PARAGRAPH' ? { content: 'Écrivez votre texte ici...', instruction: '' } : {}),
                        ...(type === 'VIDEO' ? { url: '', videoType: 'youtube', instruction: '' } : {}),
                        ...(type === 'DROPDOWN_TEXT' ? { content: 'Le chat [boit|mange|dort] son lait.', instruction: 'Choisissez la bonne action' } : {}),
                        ...(type === 'DRAG_DROP' ? { categories: [{ id: 'cat-1', title: 'Catégorie 1', items: [] }], items: [{ id: 'item-1', text: 'Élément 1', categoryId: 'cat-1' }], instruction: 'Triez les éléments' } : {}),
                        ...(type === 'ORDERING' ? { items: [{ id: 'ord-1', text: 'Étape 1' }, { id: 'ord-2', text: 'Étape 2' }], instruction: 'Mettez dans l\'ordre' } : {}),
                        ...(type === 'MATCHING_PAIRS' ? { pairs: [{ id: 'pair-1', left: 'A', right: '1' }], instruction: 'Reliez les paires' } : {}),
                        ...(type === 'DROPDOWN_QUESTION' ? { question: 'C\'est une question...', options: ['Réponse A', 'Réponse B'], correctAnswer: 'Réponse A', instruction: 'Sélectionnez la bonne réponse' } : {}),
                        ...(type === 'SPLASH' ? { description: '', image: '' } : {}),
                        ...(type === 'SOURCE_LIST' ? { items: ['Mot 1', 'Mot 2'], instruction: 'Liste des éléments à utiliser' } : {}),
                        ...(type === 'DROP_ZONE' ? { expected: '', label: 'Déposer ici', instruction: 'Zone de dépôt' } : {}),
                        ...(type === 'HOTSPOTS' ? { image: '', spots: [] } : {}),
                        ...(type === 'TIMELINE' ? { events: [{ date: '2024', title: 'Nouvel An', desc: 'Début de l\'année' }] } : {}),
                        ...(type === 'CONNECTING' ? { left: ['Question 1'], right: ['Réponse 1'], connections: [] } : {}),
                        ...(type === 'IMAGE_CLICK' ? { image: '', targetAreas: [] } : {}),
                        ...(type === 'FREE_TEXT' ? { instruction: 'Répondez à la question', expected: '' } : {}),
                        ...(type === 'TEXT_SELECT' ? { content: 'Le petit chat boit du lait.', selections: [] } : {}),
                    };
                    newBlock.elements = [newComponent];
                    newBlock.title = 'Bloc ' + type;
                }

                target.blocks = [...(target.blocks || []), newBlock];

                if (activeGlobalElement) {
                    return {
                        course: { ...state.course, [activeGlobalElement]: target },
                        activeBlockIndex: target.blocks.length - 1,
                        activeComponentIndex: type ? 0 : null
                    };
                } else {
                    const newSlides = [...state.course.slides];
                    newSlides[activeSlideIndex] = target;
                    return {
                        course: { ...state.course, slides: newSlides },
                        activeBlockIndex: target.blocks.length - 1,
                        activeComponentIndex: type ? 0 : null
                    };
                }
            }),

            updateBlock: (index, fields) => set((state) => {
                const { activeGlobalElement, activeSlideIndex } = state;
                let target;

                if (activeGlobalElement) {
                    target = { ...state.course[activeGlobalElement] };
                    const newBlocks = [...(target.blocks || [])];
                    newBlocks[index] = { ...newBlocks[index], ...fields };
                    target.blocks = newBlocks;
                    return { course: { ...state.course, [activeGlobalElement]: target } };
                } else {
                    const newSlides = [...state.course.slides];
                    target = { ...newSlides[activeSlideIndex] };
                    const newBlocks = [...(target.blocks || [])];
                    newBlocks[index] = { ...newBlocks[index], ...fields };
                    target.blocks = newBlocks;
                    newSlides[activeSlideIndex] = target;
                    return { course: { ...state.course, slides: newSlides } };
                }
            }),

            updateActiveBlock: (fields) => {
                const { activeBlockIndex, updateBlock } = get();
                updateBlock(activeBlockIndex, fields);
            },

            deleteBlock: (index) => set((state) => {
                const { activeGlobalElement, activeSlideIndex } = state;
                let target;

                if (activeGlobalElement) {
                    target = { ...state.course[activeGlobalElement] };
                    if (!target.blocks || target.blocks.length <= 1) return state;
                    const newBlocks = target.blocks.filter((_, i) => i !== index);
                    target.blocks = newBlocks;
                    return {
                        course: { ...state.course, [activeGlobalElement]: target },
                        activeBlockIndex: Math.max(0, index - 1)
                    };
                } else {
                    const newSlides = [...state.course.slides];
                    target = { ...newSlides[activeSlideIndex] };
                    if (!target.blocks || target.blocks.length <= 1) return state;
                    const newBlocks = target.blocks.filter((_, i) => i !== index);
                    target.blocks = newBlocks;
                    newSlides[activeSlideIndex] = target;
                    return {
                        course: { ...state.course, slides: newSlides },
                        activeBlockIndex: Math.max(0, index - 1)
                    };
                }
            }),

            reorderBlocks: (startIndex, endIndex) => set((state) => {
                const { activeGlobalElement, activeSlideIndex } = state;
                let target;

                if (activeGlobalElement) {
                    target = { ...state.course[activeGlobalElement] };
                    const newBlocks = Array.from(target.blocks || []);
                    const [removed] = newBlocks.splice(startIndex, 1);
                    newBlocks.splice(endIndex, 0, removed);
                    target.blocks = newBlocks;
                    return {
                        course: { ...state.course, [activeGlobalElement]: target },
                        activeBlockIndex: endIndex,
                        activeComponentIndex: null
                    };
                } else {
                    const newSlides = [...state.course.slides];
                    target = { ...newSlides[activeSlideIndex] };
                    const newBlocks = Array.from(target.blocks || []);
                    const [removed] = newBlocks.splice(startIndex, 1);
                    newBlocks.splice(endIndex, 0, removed);
                    target.blocks = newBlocks;
                    newSlides[activeSlideIndex] = target;
                    return {
                        course: { ...state.course, slides: newSlides },
                        activeBlockIndex: endIndex,
                        activeComponentIndex: null
                    };
                }
            }),

            // --- Component (Sub-block) Actions ---

            addComponentToBlock: (blockIndex, type, cellId = null, targetType = null) => set((state) => {
                const activeSection = targetType || state.activeGlobalElement;
                let target;

                if (activeSection) {
                    target = { ...state.course[activeSection] };
                } else {
                    target = { ...state.course.slides[state.activeSlideIndex] };
                }

                const newBlocks = [...(target.blocks || [])];
                const targetBlock = { ...newBlocks[blockIndex] };

                const newComponent = {
                    id: 'comp-' + Date.now(),
                    type,
                    title: 'Nouveau ' + type,
                    // Default props based on type (same as blocks before)
                    ...(type === 'CHOICE' ? { options: [{ text: 'Option 1', isCorrect: false }], instruction: 'Choisissez la bonne réponse' } : {}),
                    ...(type === 'CHOICE_MULTI' ? { options: [{ text: 'Réponse A', isCorrect: false }], instruction: 'Sélectionnez toutes les bonnes réponses' } : {}),
                    ...(type === 'TRUE_FALSE' ? { instruction: 'Vrai ou Faux ?', question: '', correctAnswer: 'VRAI' } : {}),
                    ...(type === 'STORY' ? { url: '', title: 'Histoire' } : {}),
                    ...(type === 'GAP_FILL' ? { content: '', instruction: 'Complétez le texte' } : {}),
                    ...(type === 'PARAGRAPH' ? { content: 'Écrivez votre texte ici...', instruction: '' } : {}),
                    ...(type === 'VIDEO' ? { url: '', videoType: 'youtube', instruction: '' } : {}),
                    ...(type === 'DROPDOWN_TEXT' ? { content: 'Le chat [boit|mange|dort] son lait.', instruction: 'Choisissez la bonne action' } : {}),
                    ...(type === 'DRAG_DROP' ? { categories: [{ id: 'cat-1', title: 'Catégorie 1', items: [] }], items: [{ id: 'item-1', text: 'Élément 1', categoryId: 'cat-1' }], instruction: 'Triez les éléments' } : {}),
                    ...(type === 'ORDERING' ? { items: [{ id: 'ord-1', text: 'Étape 1' }, { id: 'ord-2', text: 'Étape 2' }], instruction: 'Mettez dans l\'ordre' } : {}),
                    ...(type === 'MATCHING_PAIRS' ? { pairs: [{ id: 'pair-1', left: 'A', right: '1' }], instruction: 'Reliez les paires' } : {}),
                    ...(type === 'DROPDOWN_QUESTION' ? { question: 'C\'est une question...', options: ['Réponse A', 'Réponse B'], correctAnswer: 'Réponse A', instruction: 'Sélectionnez la bonne réponse' } : {}),
                    ...(type === 'SPLASH' ? { description: '', image: '' } : {}),
                    ...(type === 'SOURCE_LIST' ? { items: ['Mot 1', 'Mot 2'], instruction: 'Liste des éléments à utiliser' } : {}),
                    ...(type === 'DROP_ZONE' ? { expected: '', label: 'Déposer ici', instruction: 'Zone de dépôt' } : {}),
                    ...(type === 'HOTSPOTS' ? { image: '', spots: [] } : {}),
                    ...(type === 'TIMELINE' ? { events: [{ date: '2024', title: 'Nouvel An', desc: 'Début de l\'année' }] } : {}),
                    ...(type === 'CONNECTING' ? { left: ['Question 1'], right: ['Réponse 1'], connections: [] } : {}),
                    ...(type === 'IMAGE_CLICK' ? { image: '', targetAreas: [] } : {}),
                    ...(type === 'FREE_TEXT' ? { instruction: 'Répondez à la question', expected: '' } : {}),
                    ...(type === 'TEXT_SELECT' ? { content: 'Le petit chat boit du lait.', selections: [] } : {}),
                    ...(type === 'GAMEMEMO' ? {
                        text: 'Jeu de mémoire',
                        pairs: [
                            { imageUrl: '', text: 'Paire 1' },
                            { imageUrl: '', text: 'Paire 2' },
                            { imageUrl: '', text: 'Paire 3' }
                        ],
                        gridColumns: 4,
                        gridRows: 3
                    } : {}),
                    ...(type === 'ANIMATED_LOGO' ? { size: 40 } : {}),
                    ...(type === 'PREV_BUTTON' ? { label: 'Précédent' } : {}),
                    ...(type === 'NEXT_BUTTON' ? { label: 'Suivant' } : {}),
                    cellId
                };

                targetBlock.elements = [...(targetBlock.elements || []), newComponent];
                newBlocks[blockIndex] = targetBlock;
                target.blocks = newBlocks;

                if (activeSection) {
                    return {
                        course: { ...state.course, [activeSection]: target },
                        activeComponentIndex: targetBlock.elements.length - 1
                    };
                } else {
                    const newSlides = [...state.course.slides];
                    newSlides[state.activeSlideIndex] = target;
                    return {
                        course: { ...state.course, slides: newSlides },
                        activeComponentIndex: targetBlock.elements.length - 1
                    };
                }
            }),

            updateComponent: (blockIndex, compIndex, fields) => set((state) => {
                const { activeGlobalElement, activeSlideIndex } = state;
                let target;

                if (activeGlobalElement) {
                    target = { ...state.course[activeGlobalElement] };
                } else {
                    target = { ...state.course.slides[activeSlideIndex] };
                }

                const newBlocks = [...(target.blocks || [])];
                const targetBlock = { ...newBlocks[blockIndex] };
                const newElements = [...(targetBlock.elements || [])];

                newElements[compIndex] = { ...newElements[compIndex], ...fields };
                targetBlock.elements = newElements;
                newBlocks[blockIndex] = targetBlock;
                target.blocks = newBlocks;

                if (activeGlobalElement) {
                    return { course: { ...state.course, [activeGlobalElement]: target } };
                } else {
                    const newSlides = [...state.course.slides];
                    newSlides[activeSlideIndex] = target;
                    return { course: { ...state.course, slides: newSlides } };
                }
            }),

            updateActiveComponent: (fields) => {
                const { activeBlockIndex, activeComponentIndex, updateComponent } = get();
                if (activeComponentIndex === null) return;
                updateComponent(activeBlockIndex, activeComponentIndex, fields);
            },

            deleteComponent: (blockIndex, compIndex) => set((state) => {
                const { activeGlobalElement, activeSlideIndex } = state;
                let target;

                if (activeGlobalElement) {
                    target = { ...state.course[activeGlobalElement] };
                } else {
                    target = { ...state.course.slides[activeSlideIndex] };
                }

                const newBlocks = [...(target.blocks || [])];
                const targetBlock = { ...newBlocks[blockIndex] };

                const newElements = targetBlock.elements.filter((_, i) => i !== compIndex);
                targetBlock.elements = newElements;
                newBlocks[blockIndex] = targetBlock;
                target.blocks = newBlocks;

                if (activeGlobalElement) {
                    return {
                        course: { ...state.course, [activeGlobalElement]: target },
                        activeComponentIndex: null
                    };
                } else {
                    const newSlides = [...state.course.slides];
                    newSlides[activeSlideIndex] = target;
                    return {
                        course: { ...state.course, slides: newSlides },
                        activeComponentIndex: null
                    };
                }
            }),

            reorderComponents: (blockIndex, startIndex, endIndex) => set((state) => {
                const { activeGlobalElement, activeSlideIndex } = state;
                let target;

                if (activeGlobalElement) {
                    target = { ...state.course[activeGlobalElement] };
                } else {
                    target = { ...state.course.slides[activeSlideIndex] };
                }

                const newBlocks = [...(target.blocks || [])];
                const targetBlock = { ...newBlocks[blockIndex] };
                const newElements = Array.from(targetBlock.elements || []);

                const [removed] = newElements.splice(startIndex, 1);
                newElements.splice(endIndex, 0, removed);

                targetBlock.elements = newElements;
                newBlocks[blockIndex] = targetBlock;
                target.blocks = newBlocks;

                if (activeGlobalElement) {
                    return {
                        course: { ...state.course, [activeGlobalElement]: target },
                        activeComponentIndex: endIndex
                    };
                } else {
                    const newSlides = [...state.course.slides];
                    newSlides[activeSlideIndex] = target;
                    return {
                        course: { ...state.course, slides: newSlides },
                        activeComponentIndex: endIndex
                    };
                }
            }),

            moveComponentBetweenBlocks: (fromBlockIndex, fromComponentIndex, toBlockIndex) => set((state) => {
                const newSlides = [...state.course.slides];
                const activeSlide = { ...newSlides[state.activeSlideIndex] };
                const newBlocks = [...(activeSlide.blocks || [])];

                // If indexes are the same, do nothing (or should already be handled by reorderComponents)
                if (fromBlockIndex === toBlockIndex) return state;

                const sourceBlock = { ...newBlocks[fromBlockIndex] };
                const targetBlock = { ...newBlocks[toBlockIndex] };

                const sourceElements = [...(sourceBlock.elements || [])];
                const targetElements = [...(targetBlock.elements || [])];

                const [removed] = sourceElements.splice(fromComponentIndex, 1);
                targetElements.push(removed);

                sourceBlock.elements = sourceElements;
                targetBlock.elements = targetElements;

                newBlocks[fromBlockIndex] = sourceBlock;
                newBlocks[toBlockIndex] = targetBlock;

                activeSlide.blocks = newBlocks;
                newSlides[state.activeSlideIndex] = activeSlide;

                return {
                    course: { ...state.course, slides: newSlides },
                    activeBlockIndex: toBlockIndex,
                    activeComponentIndex: targetElements.length - 1
                };
            }),

            setBlockElements: (blockIndex, newElements) => set((state) => {
                const { activeGlobalElement, activeSlideIndex } = state;
                let target;

                if (activeGlobalElement) {
                    target = { ...state.course[activeGlobalElement] };
                } else {
                    target = { ...state.course.slides[activeSlideIndex] };
                }

                const newBlocks = [...(target.blocks || [])];
                const targetBlock = { ...newBlocks[blockIndex] };

                targetBlock.elements = newElements;
                newBlocks[blockIndex] = targetBlock;
                target.blocks = newBlocks;

                if (activeGlobalElement) {
                    return { course: { ...state.course, [activeGlobalElement]: target } };
                } else {
                    const newSlides = [...state.course.slides];
                    newSlides[activeSlideIndex] = target;
                    return { course: { ...state.course, slides: newSlides } };
                }
            }),

            deleteSlide: (index) => set((state) => {
                if (state.course.slides.length <= 1) return state;
                const newSlides = state.course.slides.filter((_, i) => i !== index);
                const newIndex = Math.max(0, index - 1);
                return {
                    course: { ...state.course, slides: newSlides },
                    activeSlideIndex: newIndex
                };
            }),

            reorderSlides: (startIndex, endIndex) => set((state) => {
                const newSlides = Array.from(state.course.slides);
                const [removed] = newSlides.splice(startIndex, 1);
                newSlides.splice(endIndex, 0, removed);
                return { course: { ...state.course, slides: newSlides }, activeSlideIndex: endIndex };
            }),
        }),
        {
            name: 'noor-course-storage',
            partialize: (state) => ({ course: state.course }),
            onRehydrateStorage: () => (state) => {
                if (state && state.course) {
                    state.course = verifyCourseIntegrity(state.course);
                }
            }
        }
    )
);

export default useCourseStore;
