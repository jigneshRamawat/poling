/**
 * API service for communicating with the Node/Express backend
 */

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://poling-f8u0.onrender.com';

/**
 * Robust JSON fetch wrapper that guards against non-JSON / HTML responses
 * (e.g., 404 "The page could not be found", 502 Bad Gateway, 500 error pages).
 */
async function safeJsonFetch(endpoint, options = {}, defaultErrorMessage = 'अनुरोध विफल रहा।') {
  const url = `${BASE_URL}${endpoint}`;
  let res;

  try {
    res = await fetch(url, options);
  } catch (netErr) {
    throw new Error(
      `सर्वर से संपर्क नहीं हो सका। कृपया सुनिश्चित करें कि बैकएंड सर्वर चालू है। (${netErr.message})`
    );
  }

  const contentType = (res.headers && res.headers.get('content-type')) || '';
  const isJson = contentType.toLowerCase().includes('application/json');

  if (!res.ok) {
    let errorMessage = '';
    let errorCode = null;

    if (isJson) {
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || '';
        errorCode = errorData.code || null;
      } catch (_) {
        // Fallback to text below
      }
    } else {
      try {
        const rawText = await res.text();
        if (
          rawText.includes('The page could not be found') ||
          rawText.includes('The page cannot be found') ||
          res.status === 404
        ) {
          errorMessage = `सर्वर एंडपॉइंट (${endpoint}) नहीं मिला (404 Not Found)।\nयदि ऑनलाइन (Vercel) पर हैं, तो VITE_API_URL में बैकएंड URL सेट करें। लोकल में बैकएंड (पोर्ट 5001) चालू करें।`;
        } else if (res.status === 502 || res.status === 503) {
          errorMessage = `बैकएंड सर्वर से संपर्क नहीं हो सका (HTTP ${res.status})। कृपया बैकएंड सर्वर (पोर्ट 5001) चालू करें।`;
        } else if (rawText) {
          errorMessage = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
        }
      } catch (_) {
        // Fallback
      }
    }

    const err = new Error(errorMessage || `${defaultErrorMessage} (HTTP ${res.status})`);
    err.status = res.status;
    if (errorCode) err.code = errorCode;
    throw err;
  }

  if (!isJson) {
    const rawText = await res.text().catch(() => '');
    const cleanText = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
    throw new Error(
      `सर्वर से अमान्य प्रतिक्रिया मिली (JSON अपेक्षित था, लेकिन HTML/Text मिला: "${cleanText || contentType}")। कृपया बैकएंड URL और पोर्ट जांचें।`
    );
  }

  return await res.json();
}

export async function fetchPollInfo() {
  return safeJsonFetch('/api/poll', {}, 'पोल विवरण लोड करने में विफल।');
}

export async function fetchResults() {
  return safeJsonFetch('/api/results', {}, 'परिणाम लोड करने में विफल।');
}

export async function checkVoterStatus(voterId) {
  return safeJsonFetch(
    `/api/votes/status?voterId=${encodeURIComponent(voterId)}`,
    {},
    'मतदान स्थिति जांचने में विफल।'
  );
}

export async function submitVote({ pollId, optionId, voterId }) {
  return safeJsonFetch(
    '/api/votes',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId, optionId, voterId }),
    },
    'वोट सहेजने में विफल।'
  );
}

export async function submitOptionalName({ pollId, voterId, optionalName }) {
  return safeJsonFetch(
    '/api/votes/name',
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId, voterId, optionalName }),
    },
    'नाम सहेजने में विफल।'
  );
}

