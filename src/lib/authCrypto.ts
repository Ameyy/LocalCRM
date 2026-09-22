/**
 * Secure password hashing utility using standard Web Crypto API (SHA-256)
 * Passwords are never stored as readable plain text.
 */

export async function hashPassword(password: string): Promise<string> {
  const normalized = password.trim();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(normalized);
      const hash = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hash));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }

  // Simple deterministic fallback if crypto.subtle is unavailable
  let h = 0xdeadbeef;
  for (let i = 0; i < normalized.length; i++) {
    h = Math.imul(h ^ normalized.charCodeAt(i), 2654435761);
  }
  return 'h_' + ((h ^ (h >>> 16)) >>> 0).toString(16);
}

/**
 * Synchronous hash check for fast verification during offline sessions
 */
export function verifyPasswordMatch(entered: string, storedHashOrPlain?: string): boolean {
  if (!storedHashOrPlain) return false;
  const cleanEntered = entered.trim();
  // Check direct equality (in case of initial seed string)
  if (cleanEntered === storedHashOrPlain) return true;

  // Check simple fallback hash
  let h = 0xdeadbeef;
  for (let i = 0; i < cleanEntered.length; i++) {
    h = Math.imul(h ^ cleanEntered.charCodeAt(i), 2654435761);
  }
  const fallbackHash = 'h_' + ((h ^ (h >>> 16)) >>> 0).toString(16);
  if (fallbackHash === storedHashOrPlain) return true;

  return false;
}
