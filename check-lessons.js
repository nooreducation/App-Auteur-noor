import { createClient } from '@supabase/supabase-js';

const OLD_URL = 'https://grhzorxpoomhgviygrur.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyaHpvcnhwb29taGd2aXlncnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NzI3MzMsImV4cCI6MjA4NTI0ODczM30.84208yivkWQ19R6DejxeU-w0rIDAiEgbwnWQ8llpY90';

const oldSupabase = createClient(OLD_URL, OLD_KEY);

async function check() {
    const { count, error } = await oldSupabase.from('lessons').select('*', { count: 'exact', head: true });
    if (error) {
        console.log('Error checking lessons:', error.message);
    } else {
        console.log('Lessons count:', count);
    }
}

check();
