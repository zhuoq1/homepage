// ========================================
// Auth — GitHub OAuth (shared module)
// ========================================
// Used by all pages (index.html, post.html, archive.html, admin.html)
// to gate content behind GitHub SSO. Only the owner (zhuoq1) can
// authenticate — enforced server-side by the Cloudflare Worker.

// --- Config ---
const OAUTH_WORKER_URL = 'https://zhuoqi-homepage-admin.zhuoqi-homepage.workers.dev';

// --- Helpers ---

/** Safely encode a Unicode string to base64 (replaces deprecated unescape). */
function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// --- Auth state ---

/** Whether we have a valid token in sessionStorage. */
function isAuthenticated() {
  return !!sessionStorage.getItem('github_token');
}

/** Return the OAuth access token (used by publish/delete API calls). */
function getPat() {
  return sessionStorage.getItem('github_token');
}

/** Return the authenticated user's GitHub login. */
function getAdminUser() {
  return sessionStorage.getItem('admin_user');
}

/**
 * Kick off the GitHub OAuth flow.
 * Saves the current page URL so we can return here after auth.
 * Redirects to the Cloudflare Worker, which redirects to GitHub,
 * which then calls back to the worker, which finally redirects
 * back to the main page with the token in the URL hash.
 */
function startOAuth() {
  // Remember where we started so the main page can redirect us back
  sessionStorage.setItem('auth_redirect', window.location.href);
  window.location.href = `${OAUTH_WORKER_URL}/auth`;
}

/**
 * Extract the access token from the URL hash, validate it against
 * the GitHub API, and store it in sessionStorage.
 * Returns true if authentication succeeded, false otherwise.
 * Called on page load (typically only on the main page).
 */
async function handleOAuthCallback() {
  const hash = window.location.hash;
  if (!hash.startsWith('#access_token=')) return false;

  const token = hash.slice('#access_token='.length);

  // Clean the URL immediately — remove the hash so the token isn't
  // visible in the address bar or browser history
  history.replaceState(null, '', window.location.pathname + window.location.search);

  try {
    const resp = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (resp.ok) {
      const user = await resp.json();
      sessionStorage.setItem('github_token', token);
      sessionStorage.setItem('admin_user', user.login);
      return true;
    } else {
      return false;
    }
  } catch {
    return false;
  }
}

/** Clear all auth state. */
function logout() {
  sessionStorage.removeItem('github_token');
  sessionStorage.removeItem('admin_user');
}

/**
 * If not authenticated, redirect to the main page to sign in.
 * Call this on pages that require authentication.
 * Returns true if authenticated (and execution continues),
 * returns false and redirects away if not.
 */
function requireAuth() {
  if (isAuthenticated()) return true;
  // Save current URL so we come back after login
  sessionStorage.setItem('auth_redirect', window.location.href);
  window.location.href = '/';
  return false;
}
