import { createClient } from '@supabase/supabase-js';

const OLD_URL = 'https://grhzorxpoomhgviygrur.supabase.co';
const OLD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyaHpvcnhwb29taGd2aXlncnVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY3MjczMywiZXhwIjoyMDg1MjQ4NzMzfQ.pGEyw7r_47kAoOaG7za9EseSjP0hGpeuX7Mb8UiviUY';

const supabase = createClient(OLD_URL, OLD_SERVICE_KEY);

async function listTables() {
    console.log('--- Detailed Table Scan (OLD DB) ---');

    const suspects = [
        'profiles', 'courses', 'levels', 'subjects', 'conversion_rules',
        'student_course_progress', 'enrollments', 'lessons', 'sections',
        'assignments', 'grades', 'notifications', 'settings', 'user_roles',
        'audit_log', 'messages', 'parents', 'students'
    ];

    for (const table of suspects) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                if (error.code === '42P01' || error.message.includes('キャッシュ内のスキーマ')) {
                    // console.log(`❌ ${table}: Missing`);
                } else {
                    console.log(`⚠️ ${table}: Error ${error.code} - ${error.message}`);
                }
            } else {
                console.log(`✅ ${table}: ${count} rows`);
            }
        } catch (e) {
            console.log(`💥 ${table}: runtime error`);
        }
    }
}

listTables();
