import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

const useCourseStore = create(
    persist(
        (set, get) => ({
            course: {
                id: null,
                title: 'Mon Nouveau Cours',
                level: 'Primaire 1',
                subject: 'Mathématiques',
                aspectRatio: '16/9',
                theme: {
                    primary: '#4834d4',
                    secondary: '#7b61ff',
                    accent: '#ff4757',
                },
                slides: [
                    {
                        id: 'slide-0',
                        type: 'SPLASH',
                        title: 'Bienvenue !',
                        description: 'Introduction de votre nouveau module interactif.',
                        image: '',
                    }
                ],
            },
            activeSlideIndex: 0,
            isPreviewMode: false,
            isSaving: false,
            lastError: null,
            dashboardCourses: [],
            levels: [],
            subjects: [],
            isLoadingCategories: false,

            // Actions
            setCourse: (course) => set({ course }),

            updateCourseMetadata: (fields) => set((state) => ({
                course: { ...state.course, ...fields }
            })),

            setActiveSlideIndex: (index) => set({ activeSlideIndex: index }),

            setPreviewMode: (isMode) => set({ isPreviewMode: isMode }),

            // --- Supabase Actions ---

            saveCourse: async () => {
                const { course } = get();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    set({ lastError: 'Session expirée' });
                    return false;
                }

                set({ isSaving: true, lastError: null });

                try {
                    let slug = course.title.toLowerCase()
                        .trim()
                        .replace(/ /g, '-')
                        .replace(/[^\w-]+/g, '');

                    if (!slug) slug = 'cours-sans-titre';

                    let result;
                    if (course.id && !course.id.startsWith('new-course')) {
                        // Update existing
                        const courseData = {
                            title: course.title,
                            slug: slug,
                            data: course,
                            user_id: user.id,
                            updated_at: new Date().toISOString()
                        };

                        result = await supabase
                            .from('courses')
                            .update(courseData)
                            .eq('id', course.id)
                            .eq('user_id', user.id);
                    } else {
                        // Insert new - add unique suffix to slug
                        const uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
                        const courseData = {
                            title: course.title,
                            slug: uniqueSlug,
                            data: { ...course, slug: uniqueSlug },
                            user_id: user.id,
                            updated_at: new Date().toISOString()
                        };

                        result = await supabase
                            .from('courses')
                            .insert([courseData])
                            .select();

                        if (result.data?.[0]) {
                            set({ course: { ...course, id: result.data[0].id, slug: uniqueSlug } });
                        }
                    }

                    if (result.error) throw result.error;
                    return true;
                } catch (error) {
                    set({ lastError: error.message });
                    return false;
                } finally {
                    set({ isSaving: false });
                }
            },

            fetchDashboardCourses: async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                try {
                    // 1. Fetch user's courses
                    let { data, error } = await supabase
                        .from('courses')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('updated_at', { ascending: false });

                    // 2. If admin, check for orphaned courses (migrated without user log)
                    if (user.email === 'admin@noor.com') {
                        const { data: orphans } = await supabase
                            .from('courses')
                            .select('id')
                            .is('user_id', null);

                        if (orphans && orphans.length > 0) {
                            console.log(`Found ${orphans.length} orphaned courses. Recovering...`);

                            for (const orphan of orphans) {
                                await supabase
                                    .from('courses')
                                    .update({ user_id: user.id })
                                    .eq('id', orphan.id);
                            }

                            // Re-fetch everything
                            const refresh = await supabase
                                .from('courses')
                                .select('*')
                                .eq('user_id', user.id)
                                .order('updated_at', { ascending: false });
                            data = refresh.data;
                        }
                    }

                    if (error) throw error;
                    set({ dashboardCourses: data || [] });
                } catch (error) {
                    console.error('Error fetching courses:', error);
                }
            },

            deleteCourse: async (id) => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return false;

                try {
                    const { error } = await supabase
                        .from('courses')
                        .delete()
                        .eq('id', id)
                        .eq('user_id', user.id);

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
                    const [levelsRes, subjectsRes] = await Promise.all([
                        supabase.from('levels').select('name').order('name'),
                        supabase.from('subjects').select('name').order('name')
                    ]);

                    if (levelsRes.error) console.error('Erreur SQL Levels:', levelsRes.error.message);
                    if (subjectsRes.error) console.error('Erreur SQL Subjects:', subjectsRes.error.message);

                    set({
                        levels: levelsRes.data?.map(l => l.name) || [],
                        subjects: subjectsRes.data?.map(s => s.name) || [],
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

            addSlide: (type = 'SPLASH') => set((state) => {
                const newSlide = {
                    id: 'slide-' + Date.now(),
                    type,
                    title: 'Nouvelle Diapositive',
                    description: '',
                    image: '',
                };
                const newSlides = [...state.course.slides];
                newSlides.splice(state.activeSlideIndex + 1, 0, newSlide);
                return {
                    course: { ...state.course, slides: newSlides },
                    activeSlideIndex: state.activeSlideIndex + 1
                };
            }),

            updateActiveSlide: (fields) => set((state) => {
                const newSlides = [...state.course.slides];
                newSlides[state.activeSlideIndex] = {
                    ...newSlides[state.activeSlideIndex],
                    ...fields
                };
                return { course: { ...state.course, slides: newSlides } };
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
            partialize: (state) => ({ course: state.course }), // Only persist the course object
        }
    )
);

export default useCourseStore;
