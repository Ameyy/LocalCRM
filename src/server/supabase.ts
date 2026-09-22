import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    // Server-only key: SUPABASE_SERVICE_ROLE_KEY takes precedence to safely bypass RLS
    // while RLS remains strictly enabled on the Supabase database.
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        '[Supabase Server] Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.'
      );
    }
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
}

// In-memory serialization queue to protect concurrent write operations from race conditions
let writeQueue = Promise.resolve();

export function queueStateOperation<T>(operation: () => Promise<T>): Promise<T> {
  const resultPromise = writeQueue.then(operation, operation);
  writeQueue = resultPromise.then(() => {}, () => {});
  return resultPromise;
}

export interface CrmStatePayload {
  version: number;
  updatedAt: string;
  users: any[];
  leads: any[];
  tasks: any[];
  notifications: any[];
  auditLogs: any[];
  [key: string]: any;
}

/**
 * Reads CRM state from Supabase:
 * SELECT data FROM crm_state WHERE id = 'main'
 */
export async function readCrmStateFromSupabase(defaultState: CrmStatePayload): Promise<CrmStatePayload> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('crm_state')
      .select('data')
      .eq('id', 'main')
      .maybeSingle();

    if (error) {
      if (error.code === '42501') {
        console.error(
          '[Supabase RLS Error] Row-Level Security blocked access to "crm_state". ' +
          'Please provide SUPABASE_SERVICE_ROLE_KEY in your server environment variables.'
        );
      } else {
        console.error('[Supabase Read Error]', error.message || error);
      }
      throw new Error(`Database read failed: ${error.message || 'Supabase error'}`);
    }

    if (!data || !data.data) {
      console.warn('[Supabase] No "main" state record found. Initializing with default state...');
      await writeCrmStateToSupabase(defaultState);
      return defaultState;
    }

    const state = data.data as CrmStatePayload;

    // Ensure default collections exist
    if (!Array.isArray(state.users) || state.users.length === 0) {
      state.users = defaultState.users || [];
    }
    if (!Array.isArray(state.leads)) state.leads = [];
    if (!Array.isArray(state.tasks)) state.tasks = defaultState.tasks || [];
    if (!Array.isArray(state.notifications)) state.notifications = [];
    if (!Array.isArray(state.auditLogs)) state.auditLogs = [];

    return state;
  } catch (err: any) {
    console.error('[Supabase Error] Unable to read crm_state:', err.message || err);
    throw err;
  }
}

/**
 * Writes CRM state to Supabase:
 * UPDATE crm_state SET data = ..., updated_at = now() WHERE id = 'main'
 */
export async function writeCrmStateToSupabase(state: CrmStatePayload): Promise<CrmStatePayload> {
  const supabase = getSupabaseClient();
  
  state.updatedAt = new Date().toISOString();
  state.version = (state.version || 1) + 1;

  try {
    const { data, error } = await supabase
      .from('crm_state')
      .update({
        data: state,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'main')
      .select('data')
      .maybeSingle();

    if (error) {
      if (error.code === '42501') {
        console.error(
          '[Supabase RLS Error] Row-Level Security blocked write to "crm_state". ' +
          'Please set SUPABASE_SERVICE_ROLE_KEY in your server environment variables.'
        );
      } else {
        console.error('[Supabase Write Error]', error.message || error);
      }
      throw new Error(`Database write failed: ${error.message || 'Supabase error'}`);
    }

    // If update affected 0 rows (e.g. 'main' row didn't exist yet), upsert it
    if (!data) {
      const { error: upsertError } = await supabase
        .from('crm_state')
        .upsert({
          id: 'main',
          data: state,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        console.error('[Supabase Upsert Error]', upsertError.message || upsertError);
        throw new Error(`Database upsert failed: ${upsertError.message}`);
      }
    }

    return state;
  } catch (err: any) {
    console.error('[Supabase Error] Unable to write crm_state:', err.message || err);
    throw err;
  }
}
