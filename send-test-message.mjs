import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

console.log('\n💬 Sending Test Message\n');

// Get the current user
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  console.log('❌ No active session. Please sign in first.');
  process.exit(1);
}

const userId = session.user.id;
const userName = session.user.email?.split('@')[0] || 'User';

console.log('👤 User:', userName, `(${userId})`);

// Get user's groups
const { data: members } = await supabase
  .from('group_members')
  .select('group_id, group:event_groups(id, name, event_id)')
  .eq('user_id', userId);

if (!members || members.length === 0) {
  console.log('❌ You are not a member of any groups.');
  console.log('   Book an event first to join its group chat.');
  process.exit(1);
}

const group = members[0].group;
console.log('📦 Group:', group.name);
console.log('   Group ID:', group.id);

// Send a test message
const testMessage = `Hello from ${userName}! Testing realtime chat 🎉`;
console.log('\n📤 Sending:', testMessage);

const { data: message, error } = await supabase
  .from('messages')
  .insert({
    group_id: group.id,
    user_id: userId,
    content: testMessage,
    message_type: 'text',
  })
  .select('id, content, created_at')
  .single();

if (error) {
  console.log('❌ Error:', error.message);
  process.exit(1);
}

console.log('✅ Message sent!');
console.log('   ID:', message.id);
console.log('   Time:', new Date(message.created_at).toLocaleTimeString());
console.log('\n💡 Now check your app - the message should appear in:');
console.log('   1. The Chats tab (showing the last message)');
console.log('   2. The chat screen (if it\'s open)');
console.log('   3. Should appear in realtime without refresh!\n');
