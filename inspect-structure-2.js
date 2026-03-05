import { createClient } from '@supabase/supabase-js';

const OLD_URL = 'https://grhzorxpoomhgviygrur.supabase.co';
const OLD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyaHpvcnhwb29taGd2aXlncnVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY3MjczMywiZXhwIjoyMDg1MjQ4NzMzfQ.pGEyw7r_47kAoOaG7za9EseSjP0hGpeuX7Mb8UiviUY';

const supabase = createClient(OLD_URL, OLD_SERVICE_KEY);

async function inspectStructure() {
    const tables = ['lessons', 'sections', 'assignments', 'grades', 'user_roles', 'parents'];

    for (const table of tables) {
        console.log(`\n--- ${table} ---`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Error: ${error.message}`);
        } else if (data && data.length > 0) {
            console.log('Sample Row Keys:', Object.keys(data[0]));
        } else {
            // Try to use a different method to get column names if empty
            console.log('No data. Attempting to get columns via a different method...');
        }
    }
}

inspectStructure();
