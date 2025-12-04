#!/usr/bin/env node

/**
 * Automated Migration Runner
 * 
 * This script helps you run the database migration.
 * It will open your browser to the Supabase SQL Editor with instructions.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🚀 ArzKaro Database Migration Helper\n');

// Read the migration file
const migrationPath = path.join(__dirname, 'backend/supabase/migrations/001_initial_schema.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');

console.log('✅ Migration file loaded');
console.log(`   Statements: ${migration.split(';').filter(s => s.trim()).length}`);
console.log(`   File: ${migrationPath}\n`);

// Get Supabase URL from .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/EXPO_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();

if (!supabaseUrl) {
  console.error('❌ Could not find EXPO_PUBLIC_SUPABASE_URL in .env file');
  process.exit(1);
}

// Extract project ID from URL
const projectId = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1];

if (!projectId) {
  console.error('❌ Invalid Supabase URL format');
  process.exit(1);
}

console.log('📋 INSTRUCTIONS TO RUN MIGRATION:\n');
console.log('I will open the Supabase SQL Editor in your browser.');
console.log('Then you need to:\n');
console.log('1. Copy the ENTIRE migration file contents');
console.log('2. Paste into the SQL Editor');
console.log('3. Click the RUN button\n');

console.log('Press ENTER to continue...');

process.stdin.once('data', () => {
  console.log('\n📂 Opening migration file in your default editor...');
  
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectId}/sql/new`;
  
  // Open SQL Editor in browser
  console.log('🌐 Opening Supabase SQL Editor in browser...');
  const openCommand = process.platform === 'win32' ? 'start' : 
                     process.platform === 'darwin' ? 'open' : 'xdg-open';
  
  exec(`${openCommand} "${sqlEditorUrl}"`, (err) => {
    if (err) {
      console.error('❌ Could not open browser automatically');
      console.log(`   Please open manually: ${sqlEditorUrl}`);
    } else {
      console.log('✅ Browser opened!');
    }
  });

  // Open migration file
  setTimeout(() => {
    console.log('\n📄 Opening migration file...');
    exec(`${openCommand} "${migrationPath}"`, (err) => {
      if (err) {
        console.error('❌ Could not open file automatically');
        console.log(`   Please open manually: ${migrationPath}`);
      } else {
        console.log('✅ Migration file opened!');
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('NEXT STEPS:');
    console.log('='.repeat(60));
    console.log('1. Copy ALL content from the migration file (Ctrl+A, Ctrl+C)');
    console.log('2. Switch to browser (Supabase SQL Editor should be open)');
    console.log('3. Paste into the editor (Ctrl+V)');
    console.log('4. Click RUN button (bottom right)');
    console.log('5. Wait for "Success" message');
    console.log('6. Restart your app: pnpm run android');
    console.log('='.repeat(60));
    console.log('\n✨ After running, your database will be ready!\n');
  }, 2000);
});

console.log('');
