import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL or SUPABASE_ANON_KEY missing in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const localDataPath = path.join(process.cwd(), 'data', 'crm_store.json');

async function migrate() {
  console.log(`\n======================================================`);
  console.log(`Starting CRM Data Migration from Local JSON to Supabase`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(localDataPath)) {
    console.error(`Local file not found: ${localDataPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(localDataPath, 'utf-8');
  const localState = JSON.parse(raw);

  console.log(`Local file inspected: ${localDataPath}`);
  console.log(`  - Users: ${localState.users?.length || 0}`);
  console.log(`  - Leads: ${localState.leads?.length || 0}`);
  console.log(`  - Tasks: ${localState.tasks?.length || 0}`);
  console.log(`  - Notifications: ${localState.notifications?.length || 0}`);
  console.log(`  - AuditLogs: ${localState.auditLogs?.length || 0}`);
  console.log(`  - Version: ${localState.version}`);

  console.log(`\nChecking existing row in Supabase crm_state (id = 'main')...`);
  const { data: existingRow, error: selectError } = await supabase
    .from('crm_state')
    .select('*')
    .eq('id', 'main')
    .maybeSingle();

  if (selectError) {
    console.error('\n[Supabase Select Error]:', selectError.message);
    if (selectError.code === '42501') {
      console.error('\n>>> IMPORTANT: Row-Level Security (RLS) is blocking access.');
      console.error('>>> Run this SQL command in Supabase SQL Editor:');
      console.error('    ALTER TABLE crm_state DISABLE ROW LEVEL SECURITY;');
      console.error('>>> OR set SUPABASE_SERVICE_ROLE_KEY in .env');
    }
    process.exit(1);
  }

  let finalState = { ...localState };

  if (existingRow && existingRow.data) {
    console.log('Existing Supabase row found.');
    const remoteData = existingRow.data;
    console.log(`  - Remote users count: ${remoteData.users?.length || 0}`);
    console.log(`  - Remote leads count: ${remoteData.leads?.length || 0}`);

    // If Supabase already has leads or tasks, preserve any newer ones
    if (Array.isArray(remoteData.leads) && remoteData.leads.length > 0) {
      console.log('  Merging leads from Supabase to ensure no newer leads are lost...');
      const leadMap = new Map();
      for (const l of localState.leads || []) leadMap.set(l.id, l);
      for (const l of remoteData.leads) {
        const localLead = leadMap.get(l.id);
        if (!localLead || (l.version || 0) >= (localLead.version || 0)) {
          leadMap.set(l.id, l);
        }
      }
      finalState.leads = Array.from(leadMap.values());
    }

    // Ensure users from local state are preserved
    if (!Array.isArray(remoteData.users) || remoteData.users.length === 0) {
      console.log('  Supabase users was empty. Migrating local users...');
      finalState.users = localState.users;
    } else {
      const userMap = new Map();
      for (const u of localState.users || []) userMap.set(u.id, u);
      for (const u of remoteData.users) userMap.set(u.id, u);
      finalState.users = Array.from(userMap.values());
    }
  } else {
    console.log('No existing data or empty row in Supabase. Uploading full local state.');
  }

  finalState.updatedAt = new Date().toISOString();
  finalState.version = Math.max((localState.version || 1), (existingRow?.data?.version || 0)) + 1;

  console.log(`\nUploading to Supabase (id = 'main')...`);
  const { data: updated, error: upsertError } = await supabase
    .from('crm_state')
    .upsert({
      id: 'main',
      data: finalState,
      updated_at: new Date().toISOString(),
    })
    .select();

  if (upsertError) {
    console.error('\n[Supabase Upload Error]:', upsertError.message);
    if (upsertError.code === '42501') {
      console.error('\n>>> IMPORTANT: Row-Level Security (RLS) is blocking access.');
      console.error('>>> Run this SQL command in Supabase SQL Editor:');
      console.error('    ALTER TABLE crm_state DISABLE ROW LEVEL SECURITY;');
      console.error('>>> OR set SUPABASE_SERVICE_ROLE_KEY in .env');
    }
    process.exit(1);
  }

  console.log('\nSUCCESS! Supabase crm_state updated successfully.');
  console.log(`Result:`, JSON.stringify(updated, null, 2));

  // Verify verification read
  console.log('\nPerforming verification read...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('crm_state')
    .select('data')
    .eq('id', 'main')
    .single();

  if (verifyError) {
    console.error('Verification failed:', verifyError.message);
  } else {
    console.log(`Verification confirmed:`);
    console.log(`  - Users migrated: ${verifyData.data.users?.length}`);
    verifyData.data.users.forEach((u) => {
      console.log(`      * [${u.role.toUpperCase()}] ${u.name} (username: "${u.username}", id: "${u.id}")`);
    });
    console.log(`  - Leads migrated: ${verifyData.data.leads?.length}`);
    console.log(`  - Tasks migrated: ${verifyData.data.tasks?.length}`);
  }
}

migrate().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
