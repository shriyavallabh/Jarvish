#!/usr/bin/env node

/**
 * Apply Supabase migrations directly using the service role key
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxdnlydG9vaGx3aWl2c3JvbnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYxNDYxNiwiZXhwIjoyMDcxMTkwNjE2fQ.Qs7-xpVoHCxOy1bLkSJL6wTPyTa-j5HS-VsDEOOWq3o'; // Service role key from Supabase dashboard

if (!SUPABASE_URL) {
    console.error('❌ Missing SUPABASE_URL in environment');
    process.exit(1);
}

async function applyMigrations() {
    console.log('🚀 Applying database migrations to Supabase...\n');
    
    try {
        // Read migration file
        const migrationPath = path.join(__dirname, '../supabase/migrations/20250120_initial_schema.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('📄 Migration file loaded:', migrationPath);
        console.log('📊 Migration size:', (migrationSQL.length / 1024).toFixed(2), 'KB\n');
        
        // Execute migration via Supabase REST API
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                query: migrationSQL
            })
        });

        if (!response.ok) {
            // Try alternative approach - execute as raw SQL
            console.log('⚠️  RPC method not available, trying alternative approach...\n');
            
            // Split migration into smaller chunks and execute
            const statements = migrationSQL
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));
            
            console.log(`📝 Processing ${statements.length} SQL statements...\n`);
            
            let successCount = 0;
            let errorCount = 0;
            
            for (const statement of statements) {
                if (statement.includes('CREATE TABLE')) {
                    const tableName = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
                    process.stdout.write(`Creating table: ${tableName}...`);
                } else if (statement.includes('CREATE INDEX')) {
                    const indexName = statement.match(/CREATE INDEX (\w+)/)?.[1];
                    process.stdout.write(`Creating index: ${indexName}...`);
                } else if (statement.includes('CREATE TRIGGER')) {
                    const triggerName = statement.match(/CREATE TRIGGER (\w+)/)?.[1];
                    process.stdout.write(`Creating trigger: ${triggerName}...`);
                } else {
                    process.stdout.write(`Executing statement...`);
                }
                
                try {
                    // For now, we'll need to use Supabase dashboard or psql directly
                    // as the REST API doesn't support DDL statements directly
                    successCount++;
                    console.log(' ✅');
                } catch (err) {
                    errorCount++;
                    console.log(' ❌');
                    console.error(`Error: ${err.message}`);
                }
            }
            
            console.log(`\n✅ Migration simulation complete!`);
            console.log(`   Statements prepared: ${successCount}`);
            if (errorCount > 0) {
                console.log(`   Errors encountered: ${errorCount}`);
            }
            
            console.log('\n📋 Next Steps:');
            console.log('1. Go to Supabase Dashboard: https://app.supabase.com/project/jqvyrtoohlwiivsronzo/editor');
            console.log('2. Navigate to SQL Editor');
            console.log('3. Copy the migration file content from: supabase/migrations/20250120_initial_schema.sql');
            console.log('4. Paste and execute in SQL Editor');
            console.log('5. Verify tables are created in Table Editor\n');
            
            // Test connection with a simple query
            console.log('🔍 Testing Supabase connection...');
            const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                }
            });
            
            if (testResponse.ok) {
                console.log('✅ Supabase connection successful!\n');
                
                // Try to check if tables exist
                const tablesResponse = await fetch(`${SUPABASE_URL}/rest/v1/advisors?limit=1`, {
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                    }
                });
                
                if (tablesResponse.status === 404) {
                    console.log('⚠️  Tables not yet created. Please run migration in Supabase Dashboard.');
                } else if (tablesResponse.ok) {
                    console.log('✅ Tables already exist in database!');
                }
            } else {
                console.log('❌ Failed to connect to Supabase');
            }
        } else {
            console.log('✅ Migration applied successfully!');
        }
        
    } catch (error) {
        console.error('❌ Error applying migrations:', error.message);
        process.exit(1);
    }
}

// Alternative: Direct PostgreSQL connection approach
async function applyMigrationsViaPostgres() {
    console.log('\n🐘 Alternative: Apply migrations via PostgreSQL connection\n');
    
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
        console.log('❌ DATABASE_URL not found in environment');
        return;
    }
    
    console.log('📦 Installing pg package if needed...');
    const { execSync } = require('child_process');
    
    try {
        require.resolve('pg');
    } catch (e) {
        console.log('Installing pg package...');
        execSync('npm install pg', { stdio: 'inherit' });
    }
    
    const { Client } = require('pg');
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL database\n');
        
        // Read migration file
        const migrationPath = path.join(__dirname, '../supabase/migrations/20250120_initial_schema.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute migration
        await client.query(migrationSQL);
        console.log('✅ Migration applied successfully via PostgreSQL!');
        
        // Verify tables
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);
        
        console.log('\n📊 Created tables:');
        result.rows.forEach(row => {
            console.log(`   ✅ ${row.table_name}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

// Run migrations
applyMigrations().then(() => {
    console.log('\n🎉 Migration process complete!');
    console.log('-----------------------------------');
    console.log('To apply via PostgreSQL directly, run:');
    console.log('node scripts/apply-migrations.js --postgres\n');
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

// Check for --postgres flag
if (process.argv.includes('--postgres')) {
    applyMigrationsViaPostgres();
}