#!/usr/bin/env node

/**
 * Apply Migration 002 - Fix Profile Insert Policy
 * 
 * This will display the SQL needed and copy it to clipboard
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🚀 Applying Migration 002: Fix Profile Insert Policy\n');

// Read migration file
const migrationPath = path.join(__dirname, 'backend/supabase/migrations/002_fix_profile_insert_policy.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found');
  process.exit(1);
}

const sql = fs.readFileSync(migrationPath, 'utf8');

console.log('📄 Migration SQL:');
console.log('─'.repeat(60));
console.log(sql);
console.log('─'.repeat(60));

// Copy to clipboard
const tempFile = path.join(__dirname, 'temp-migration.sql');
fs.writeFileSync(tempFile, sql);

exec(`type "${tempFile}" | clip`, (err) => {
  fs.unlinkSync(tempFile);
  
  if (err) {
    console.error('\n❌ Failed to copy to clipboard');
  } else {
    console.log('\n✅ SQL copied to clipboard!');
  }
  
  console.log('\n📋 NEXT STEPS:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/rsyuknfgziydxtvmidgd/sql/new');
  console.log('2. Paste the SQL (Ctrl+V) - already in clipboard!');
  console.log('3. Click RUN button');
  console.log('4. Verify "Success" message');
  console.log('5. Sign out and sign in again to test\n');
  
  // Open browser
  const sqlEditorUrl = 'https://supabase.com/dashboard/project/rsyuknfgziydxtvmidgd/sql/new';
  exec(`start "" "${sqlEditorUrl}"`, (err) => {
    if (!err) {
      console.log('🌐 Opening Supabase SQL Editor in browser...\n');
    }
  });
});
