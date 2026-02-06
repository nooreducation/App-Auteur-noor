import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useAuthStore = create((set) => ({
    user: null,
    loading: true,

    setUser: (user) => set({ user, loading: false }),

    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        set({ user: data.user });
        return data.user;
    },

    signUp: async (email, password, metadata = {}) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
        if (error) throw error;
        set({ user: data.user });
        return data.user;
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null });
    },

    checkUser: async () => {
        set({ loading: true });
        const { data: { session } } = await supabase.auth.getSession();
        set({ user: session?.user || null, loading: false });
    },

    initialize: () => {
        supabase.auth.onAuthStateChange((event, session) => {
            set({ user: session?.user || null, loading: false });
        });
    }
}));

export default useAuthStore;
