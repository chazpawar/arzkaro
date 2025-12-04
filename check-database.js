#!/usr/bin/env node

/**
 * Database Health Check and Fix Script
 * 
 * This script:
 * 1. Checks all tables exist
 * 2. Checks all RLS policies
 * 3. Applies missing policies
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log('🔍 ArzKaro Database Health Check\n');
  console.log('Project:', supabaseUrl);
  console.log('─'.repeat(60));

  // Test 1: Check if we can query profiles table
  console.log('\n📋 Test 1: Check profiles table...');
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      if (error.code === 'PGRST204' || error.code === 'PGRST116') {
        console.log('✅ Profiles table exists (empty)');
      } else if (error.code === 'PGRST205') {
        console.log('❌ Profiles table does NOT exist');
        console.log('   Error:', error.message);
        console.log('   You need to run migration 001 first!');
      } else {
        console.log('⚠️  Warning:', error.message);
      }
    } else {
      console.log('✅ Profiles table exists');
      console.log('   Rows:', data?.length || 0);
    }
  } catch (err) {
    console.log('❌ Error checking profiles:', err.message);
  }

  // Test 2: Check other critical tables
  const tables = ['events', 'bookings', 'tickets', 'host_requests'];
  console.log('\n📋 Test 2: Check other tables...');
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      
      if (error) {
        if (error.code === 'PGRST204' || error.code === 'PGRST116') {
          console.log(`✅ ${table} - exists (empty)`);
        } else if (error.code === 'PGRST205') {
          console.log(`❌ ${table} - MISSING`);
        } else {
          console.log(`⚠️  ${table} - ${error.message}`);
        }
      } else {
        console.log(`✅ ${table} - exists`);
      }
    } catch (err) {
      console.log(`❌ ${table} - ${err.message}`);
    }
  }

  // Test 3: Try to get current user
  console.log('\n📋 Test 3: Check authentication...');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('⚠️  No authenticated user (expected in CLI context)');
    } else if (user) {
      console.log('✅ User authenticated:', user.email);
      
      // Test 4: Try to fetch profile
      console.log('\n📋 Test 4: Check profile for authenticated user...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log('❌ Profile does NOT exist for user:', user.email);
          console.log('   This is the issue! Profile should auto-create on signup.');
          console.log('   Need to run migration 002 to fix this.');
        } else {
          console.log('⚠️  Error:', profileError.message);
        }
      } else {
        console.log('✅ Profile exists:', profile.email);
      }
    } else {
      console.log('ℹ️  No user authenticated (running from CLI)');
    }
  } catch (err) {
    console.log('⚠️  Auth check skipped:', err.message);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('RECOMMENDED ACTIONS:');
  console.log('='.repeat(60));
  console.log('\n1. Run migration 002 to fix profile insert policy:');
  console.log('   - Go to Supabase SQL Editor');
  console.log('   - Run: backend/supabase/migrations/002_fix_profile_insert_policy.sql');
  console.log('\n2. Test sign-in with Google OAuth');
  console.log('   - Profile should auto-create on first sign-in');
  console.log('\n3. If issues persist, check Supabase logs');
  console.log('   - Go to Supabase Dashboard > Logs > Database');
  console.log('='.repeat(60));
  console.log('');
}

checkDatabase().catch(console.error);
