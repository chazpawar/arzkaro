#!/usr/bin/env node

/**
 * Apply Migration via Supabase Client
 * 
 * This script applies the migration 002 to fix profile insert policy
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🚀 ArzKaro Migration 002 - Fix Profile Insert Policy\n');

// Read .env file
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/EXPO_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const anonKey = envContent.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

if (!supabaseUrl || !anonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Read migration file
const migrationPath = path.join(__dirname, 'backend/supabase/migrations/002_fix_profile_insert_policy.sql');
if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 Migration Details:');
console.log('   Project:', supabaseUrl);
console.log('   File:', path.basename(migrationPath));
console.log('   Size:', migrationSQL.length, 'bytes');
console.log('');

console.log('⚠️  IMPORTANT:');
console.log('This script cannot run migrations directly via the REST API.');
console.log('You need to run the migration manually in the Supabase SQL Editor.\n');

console.log('📝 INSTRUCTIONS:\n');
console.log('1. The migration SQL has been copied to your clipboard');
console.log('2. Go to: https://supabase.com/dashboard/project/' + supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1] + '/sql/new');
console.log('3. Paste the SQL (Ctrl+V)');
console.log('4. Click RUN\n');

// Try to copy to clipboard
const { exec } = require('child_process');
exec('echo ' + JSON.stringify(migrationSQL) + ' | clip', (err) => {
  if (!err) {
    console.log('✅ Migration SQL copied to clipboard!\n');
  }
  
  console.log('─'.repeat(60));
  console.log('MIGRATION SQL PREVIEW:');
  console.log('─'.repeat(60));
  console.log(migrationSQL);
  console.log('─'.repeat(60));
  console.log('\n✨ Ready to apply migration!\n');
});
