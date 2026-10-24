/**
 * Persistent Browser Voter ID Service
 * Generates a persistent random UUIDv4 and stores it in localStorage.
 */

const STORAGE_KEY = 'evm_ward5_voter_id';

export function getOrCreateVoterId() {
  let voterId = localStorage.getItem(STORAGE_KEY);

  if (!voterId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      voterId = crypto.randomUUID();
    } else {
      // Fallback RFC4122 v4 generator
      voterId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
    localStorage.setItem(STORAGE_KEY, voterId);
  }

  return voterId;
}

export function resetVoterId() {
  localStorage.removeItem(STORAGE_KEY);
  return getOrCreateVoterId();
}
