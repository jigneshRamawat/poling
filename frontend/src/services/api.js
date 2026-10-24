/**
 * API service for communicating with the Node/Express backend
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchPollInfo() {
  const res = await fetch(`${BASE_URL}/api/poll`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'पोल विवरण लोड करने में विफल।');
  }
  return data;
}

export async function fetchResults() {
  const res = await fetch(`${BASE_URL}/api/results`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'परिणाम लोड करने में विफल।');
  }
  return data;
}

export async function checkVoterStatus(voterId) {
  const res = await fetch(`${BASE_URL}/api/votes/status?voterId=${encodeURIComponent(voterId)}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'मतदान स्थिति जांचने में विफल।');
  }
  return data;
}

export async function submitVote({ pollId, optionId, voterId }) {
  const res = await fetch(`${BASE_URL}/api/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pollId, optionId, voterId }),
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || 'वोट सहेजने में विफल।');
    error.code = data.code;
    throw error;
  }
  return data;
}

export async function submitOptionalName({ pollId, voterId, optionalName }) {
  const res = await fetch(`${BASE_URL}/api/votes/name`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pollId, voterId, optionalName }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'नाम सहेजने में विफल।');
  }
  return data;
}
