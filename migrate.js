import { createClient } from '@supabase/supabase-js';

const OLD_URL = 'https://grhzorxpoomhgviygrur.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyaHpvcnhwb29taGd2aXlncnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NzI3MzMsImV4cCI6MjA4NTI0ODczM30.84208yivkWQ19R6DejxeU-w0rIDAiEgbwnWQ8llpY90';

const NEW_URL = 'https://ftklihdejahkxyrycsoc.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2xpaGRlamFoa3h5cnljc29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTIyMjYsImV4cCI6MjA4NTc4ODIyNn0.bPdUHv1n6yVm4fM7nx_P9jdka0-u-5A8I1mo-0mlYVc';

const oldSupabase = createClient(OLD_URL, OLD_KEY, { db: { schema: 'public' } });
const newSupabase = createClient(NEW_URL, NEW_KEY, { db: { schema: 'public' } });

async function migrateTable(tableName, allowedColumns) {
    console.log(`\n--- Migrating ${tableName} ---`);
    const { data, error: fetchError } = await oldSupabase
        .from(tableName)
        .select('*');

    if (fetchError) {
        console.error(`Error fetching ${tableName}:`, fetchError);
        return;
    }

    console.log(`Found ${data.length} records in ${tableName}.`);

    for (const record of data) {
        // Pick only allowed columns if specified, otherwise exclude id/created_at
        let cleanData = {};
        if (allowedColumns) {
            allowedColumns.forEach(col => {
                if (record[col] !== undefined) {
                    cleanData[col] = record[col];
                }
            });
        } else {
            const { id, created_at, ...rest } = record;
            cleanData = rest;
        }

        const { error: insertError } = await newSupabase
            .from(tableName)
            .insert([cleanData]);

        if (insertError) {
            console.error(`Error inserting into ${tableName}:`, insertError.message);
        } else {
            console.log(`Successfully migrated record from ${tableName}: ${record.title || record.name || ''}`);
        }
    }
}

async function startMigration() {
    // Specify allowed columns for each table to avoid schema mismatch
    await migrateTable('levels', ['name']);
    await migrateTable('subjects', ['name']);
    await migrateTable('courses', ['title', 'slug', 'data', 'user_id', 'updated_at']);

    console.log('\n✅ All migrations complete!');
}

startMigration();


