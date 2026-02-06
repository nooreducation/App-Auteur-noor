import { createClient } from '@supabase/supabase-js';

const OLD_URL = 'https://grhzorxpoomhgviygrur.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyaHpvcnhwb29taGd2aXlncnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NzI3MzMsImV4cCI6MjA4NTI0ODczM30.84208yivkWQ19R6DejxeU-w0rIDAiEgbwnWQ8llpY90';

const oldSupabase = createClient(OLD_URL, OLD_KEY);

async function check() {
    try {
        console.log('Testing courses...');
        const res1 = await oldSupabase.from('courses').select('id').limit(1);
        console.log('courses:', res1.error ? res1.error.message : 'OK');

        console.log('Testing levels...');
        const res2 = await oldSupabase.from('levels').select('id').limit(1);
        console.log('levels:', res2.error ? res2.error.message : 'OK');

        console.log('Testing subjects...');
        const res3 = await oldSupabase.from('subjects').select('id').limit(1);
        console.log('subjects:', res3.error ? res3.error.message : 'OK');

    } catch (e) {
        console.error('Catch:', e);
    }
}

check();
