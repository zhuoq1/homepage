// ========================================
// Admin JS — Auth (GitHub OAuth), Editor, Persistence
// ========================================

// Authentication uses GitHub OAuth via a Cloudflare Worker.
// The worker holds the OAuth Client Secret server-side — it never
// reaches the browser. Only the owner (zhuoq1) can authenticate.

// --- Config ---
// Replace with your deployed Cloudflare Worker URL:
const OAUTH_WORKER_URL = 'https://zhuoqi-homepage-admin.zhuoqi-homepage.workers.dev';

// --- DOM Elements ---
const loginGate = document.getElementById('login-gate');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const adminApp = document.getElementById('admin-app');
const postSelector = document.getElementById('post-selector');
const postTitle = document.getElementById('post-title');
const postDate = document.getElementById('post-date');
const postReadtime = document.getElementById('post-readtime');
const postSlug = document.getElementById('post-slug');
const postTags = document.getElementById('post-tags');
const postExcerpt = document.getElementById('post-excerpt');
const editorTextarea = document.getElementById('editor-textarea');
const previewPane = document.getElementById('preview-pane');
const wordCount = document.getElementById('word-count');
const btnDraft = document.getElementById('btn-draft');
const btnPublish = document.getElementById('btn-publish');
const btnDelete = document.getElementById('btn-delete');
const adminStatus = document.getElementById('admin-status');

let currentSlug = null; // null = new post, string = editing existing
let postsManifest = [];

// ==========================================
// Auth — GitHub OAuth
// ==========================================

/** Whether we have a valid token in sessionStorage. */
function isAuthenticated() {
  return !!sessionStorage.getItem('github_token');
}

/** Return the OAuth access token (used by publish/delete). */
function getPat() {
  return sessionStorage.getItem('github_token');
}

/**
 * Kick off the GitHub OAuth flow.
 * Redirects to the Cloudflare Worker, which redirects to GitHub,
 * which then calls back to the worker, which finally redirects
 * back here with the token in the URL hash.
 */
function startOAuth() {
  window.location.href = `${OAUTH_WORKER_URL}/auth`;
}

/**
 * Extract the access token from the URL hash, validate it, and
 * store it in sessionStorage.
 * Called on page load.
 */
async function handleOAuthCallback() {
  const hash = window.location.hash;
  if (!hash.startsWith('#access_token=')) return;

  const token = hash.slice('#access_token='.length);

  // Validate the token against the GitHub API
  try {
    const resp = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (resp.ok) {
      const user = await resp.json();
      sessionStorage.setItem('github_token', token);
      sessionStorage.setItem('admin_user', user.login);

      // Clean the URL — remove the hash so the token isn't
      // visible in the address bar or browser history
      history.replaceState(null, '', window.location.pathname);

      loginGate.hidden = true;
      adminApp.hidden = false;
      initAdmin();
    } else {
      // Token invalid — show login gate with error
      history.replaceState(null, '', window.location.pathname);
      loginGate.hidden = false;
      adminApp.hidden = true;
      loginError.textContent = 'Authentication failed. Please try signing in again.';
      loginError.hidden = false;
    }
  } catch (err) {
    history.replaceState(null, '', window.location.pathname);
    loginGate.hidden = false;
    adminApp.hidden = true;
    loginError.textContent = `Network error: ${err.message}`;
    loginError.hidden = false;
  }
}

/** Decide which view to show: login gate or admin app. */
function checkAuth() {
  if (isAuthenticated()) {
    loginGate.hidden = true;
    adminApp.hidden = false;
    initAdmin();
  } else {
    loginGate.hidden = false;
    adminApp.hidden = true;
  }
}

// --- Event listeners ---

loginBtn.addEventListener('click', () => {
  loginError.hidden = true;
  startOAuth();
});

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem('github_token');
  sessionStorage.removeItem('admin_user');
  // Re-show the login gate
  loginGate.hidden = false;
  adminApp.hidden = true;
});

// ==========================================
// Editor
// ==========================================

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function estimateReadTime(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function updatePreview() {
  const md = editorTextarea.value;
  const rawHtml = marked.parse(md);
  previewPane.innerHTML = DOMPurify.sanitize(rawHtml);
  wordCount.textContent = `${md.split(/\s+/).filter(Boolean).length} words`;
}

function autoReadTime() {
  const words = editorTextarea.value.split(/\s+/).filter(Boolean).length;
  postReadtime.value = `${Math.max(1, Math.round(words / 200))} min`;
}

// Auto-slug from title
postTitle.addEventListener('input', () => {
  if (!currentSlug) {
    postSlug.value = slugify(postTitle.value);
  }
});

// Live preview (debounced)
let previewTimer;
editorTextarea.addEventListener('input', () => {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    updatePreview();
    autoReadTime();
  }, 150);
});

// Mobile tab toggle
const tabEdit = document.getElementById('tab-edit');
const tabPreview = document.getElementById('tab-preview');
const editorPane = document.querySelector('.admin-pane-editor');
const previewPaneEl = document.querySelector('.admin-pane-preview');

tabEdit.addEventListener('click', () => {
  tabEdit.classList.add('active');
  tabPreview.classList.remove('active');
  editorPane.style.display = 'block';
  previewPaneEl.style.display = 'none';
});

tabPreview.addEventListener('click', () => {
  tabPreview.classList.add('active');
  tabEdit.classList.remove('active');
  previewPaneEl.style.display = 'block';
  editorPane.style.display = 'none';
});

// ==========================================
// Drafts (localStorage)
// ==========================================

function getDraftKey(slug) {
  return `draft_${slug || 'new'}`;
}

function saveDraft() {
  const slug = postSlug.value || 'new';
  const draft = {
    title: postTitle.value,
    date: postDate.value,
    readTime: postReadtime.value,
    slug: postSlug.value,
    tags: postTags.value,
    excerpt: postExcerpt.value,
    body: editorTextarea.value,
  };
  localStorage.setItem(getDraftKey(slug), JSON.stringify(draft));
  showStatus('Draft saved.', 'success');
}

function loadDraft(slug) {
  const raw = localStorage.getItem(getDraftKey(slug));
  if (!raw) return false;
  try {
    const draft = JSON.parse(raw);
    postTitle.value = draft.title || '';
    postDate.value = draft.date || '';
    postReadtime.value = draft.readTime || '';
    postSlug.value = draft.slug || '';
    postTags.value = draft.tags || '';
    postExcerpt.value = draft.excerpt || '';
    editorTextarea.value = draft.body || '';
    updatePreview();
    autoReadTime();
    return true;
  } catch {
    return false;
  }
}

function clearDraft(slug) {
  localStorage.removeItem(getDraftKey(slug));
}

// ==========================================
// Post CRUD
// ==========================================

function getPostData() {
  return {
    slug: postSlug.value,
    title: postTitle.value,
    date: postDate.value,
    tags: postTags.value.split(',').map((t) => t.trim()).filter(Boolean),
    readTime: postReadtime.value,
    excerpt: postExcerpt.value,
    body: editorTextarea.value,
  };
}

function populateForm(post, body = '') {
  postTitle.value = post.title || '';
  postDate.value = post.date || new Date().toISOString().slice(0, 10);
  postReadtime.value = post.readTime || '';
  postSlug.value = post.slug || '';
  postTags.value = (post.tags || []).join(', ');
  postExcerpt.value = post.excerpt || '';
  editorTextarea.value = body;
  currentSlug = post.slug || null;
  btnDelete.hidden = !post.slug;
  updatePreview();
  autoReadTime();
}

function resetForm() {
  currentSlug = null;
  postTitle.value = '';
  postDate.value = new Date().toISOString().slice(0, 10);
  postReadtime.value = '';
  postSlug.value = '';
  postTags.value = '';
  postExcerpt.value = '';
  editorTextarea.value = '';
  previewPane.innerHTML = '';
  wordCount.textContent = '0 words';
  btnDelete.hidden = true;
  postSelector.value = '';
}

async function openPost(slug) {
  if (!slug) {
    // Check for unsaved draft first
    if (editorTextarea.value && !confirm('Discard current changes?')) {
      postSelector.value = currentSlug || '';
      return;
    }
    // Try loading new-post draft
    if (!loadDraft('new')) {
      resetForm();
    }
    return;
  }

  if (editorTextarea.value && currentSlug !== slug && !confirm('Discard current changes?')) {
    postSelector.value = currentSlug || '';
    return;
  }

  // Try draft first, then fetch published
  if (loadDraft(slug)) {
    currentSlug = slug;
    btnDelete.hidden = false;
    updatePreview();
    autoReadTime();
    return;
  }

  try {
    const resp = await fetch(`/posts/${slug}.md`);
    if (!resp.ok) throw new Error('Not found');
    const body = await resp.text();
    const post = postsManifest.find((p) => p.slug === slug);
    if (post) {
      populateForm(post, body);
    } else {
      populateForm({ slug, date: new Date().toISOString().slice(0, 10) }, body);
    }
  } catch (err) {
    showStatus(`Failed to load post: ${err.message}`, 'error');
  }
}

// Post selector change
postSelector.addEventListener('change', () => {
  openPost(postSelector.value);
});

// Button handlers
btnDraft.addEventListener('click', saveDraft);

btnPublish.addEventListener('click', async () => {
  const data = getPostData();
  if (!data.title || !data.slug || !data.body) {
    showStatus('Title, slug, and body are required.', 'error');
    return;
  }

  // Check for GitHub PAT
  const pat = getPat();
  if (!pat) {
    showStatus('Not authenticated. Please log in again.', 'error');
    return;
  }

  showStatus('Publishing...', 'info');

  try {
    // 1. Upload the .md file
    const mdPath = `posts/${data.slug}.md`;
    let mdSha = null;
    try {
      const checkResp = await fetch(`https://api.github.com/repos/zhuoq1/homepage/contents/${mdPath}`, {
        headers: { Authorization: `Bearer ${pat}` },
      });
      if (checkResp.ok) {
        const existing = await checkResp.json();
        mdSha = existing.sha;
      }
    } catch { /* file doesn't exist yet */ }

    const mdContent = btoa(unescape(encodeURIComponent(data.body)));
    const mdBody = { message: `Publish: ${data.title}`, content: mdContent };
    if (mdSha) mdBody.sha = mdSha;

    const mdResp = await fetch(`https://api.github.com/repos/zhuoq1/homepage/contents/${mdPath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${pat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mdBody),
    });

    if (!mdResp.ok) {
      const err = await mdResp.json();
      throw new Error(err.message || `GitHub API error: ${mdResp.status}`);
    }

    // 2. Update manifest
    const manifestResp = await fetch('https://api.github.com/repos/zhuoq1/homepage/contents/posts-manifest.json', {
      headers: { Authorization: `Bearer ${pat}` },
    });
    const manifestFile = await manifestResp.json();
    const manifest = JSON.parse(atob(manifestFile.content));

    const entry = {
      slug: data.slug,
      title: data.title,
      date: data.date,
      tags: data.tags,
      readTime: data.readTime,
      excerpt: data.excerpt,
    };

    const idx = manifest.findIndex((p) => p.slug === data.slug);
    if (idx >= 0) {
      manifest[idx] = entry;
    } else {
      manifest.unshift(entry);
    }

    const manifestContent = btoa(unescape(encodeURIComponent(JSON.stringify(manifest, null, 2) + '\n')));
    const mfResp = await fetch('https://api.github.com/repos/zhuoq1/homepage/contents/posts-manifest.json', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${pat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Update manifest: ${data.title}`,
        content: manifestContent,
        sha: manifestFile.sha,
      }),
    });

    if (!mfResp.ok) {
      const err = await mfResp.json();
      throw new Error(`Manifest update failed: ${err.message}`);
    }

    clearDraft(data.slug);
    clearDraft('new');
    currentSlug = data.slug;
    btnDelete.hidden = false;
    showStatus(`Published! View at <a href="/post.html?slug=${encodeURIComponent(data.slug)}" target="_blank">/post.html?slug=${data.slug}</a> (may take ~60s for GitHub Pages to deploy)`, 'success');

    // Refresh manifest cache
    postsManifest = manifest;
    refreshPostSelector();
  } catch (err) {
    showStatus(`Publish failed: ${err.message}`, 'error');
  }
});

btnDelete.addEventListener('click', async () => {
  const slug = currentSlug || postSlug.value;
  if (!slug) return;
  if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;

  const pat = getPat();
  if (!pat) {
    showStatus('Not authenticated. Please log in again.', 'error');
    return;
  }

  showStatus('Deleting...', 'info');

  try {
    // Get file sha
    const checkResp = await fetch(`https://api.github.com/repos/zhuoq1/homepage/contents/posts/${slug}.md`, {
      headers: { Authorization: `Bearer ${pat}` },
    });
    if (!checkResp.ok) throw new Error('Post file not found in repo.');
    const fileInfo = await checkResp.json();

    // Delete the .md file
    const delResp = await fetch(`https://api.github.com/repos/zhuoq1/homepage/contents/posts/${slug}.md`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${pat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Delete: ${slug}`,
        sha: fileInfo.sha,
      }),
    });

    if (!delResp.ok) {
      const err = await delResp.json();
      throw new Error(err.message);
    }

    // Update manifest — remove entry
    const manifestResp = await fetch('https://api.github.com/repos/zhuoq1/homepage/contents/posts-manifest.json', {
      headers: { Authorization: `Bearer ${pat}` },
    });
    const manifestFile = await manifestResp.json();
    const manifest = JSON.parse(atob(manifestFile.content));
    const newManifest = manifest.filter((p) => p.slug !== slug);

    const manifestContent = btoa(unescape(encodeURIComponent(JSON.stringify(newManifest, null, 2) + '\n')));
    await fetch('https://api.github.com/repos/zhuoq1/homepage/contents/posts-manifest.json', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${pat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Remove from manifest: ${slug}`,
        content: manifestContent,
        sha: manifestFile.sha,
      }),
    });

    clearDraft(slug);
    postsManifest = newManifest;
    resetForm();
    refreshPostSelector();
    showStatus(`"${slug}" deleted.`, 'success');
  } catch (err) {
    showStatus(`Delete failed: ${err.message}`, 'error');
  }
});

// ==========================================
// Status messages
// ==========================================

function showStatus(msg, type) {
  adminStatus.innerHTML = msg;
  adminStatus.className = `admin-status admin-status-${type}`;
  adminStatus.hidden = false;
  if (type === 'success') {
    setTimeout(() => { adminStatus.hidden = true; }, 8000);
  }
}

// ==========================================
// Post selector
// ==========================================

async function refreshPostSelector() {
  // Keep "New Post" as first option
  postSelector.innerHTML = '<option value="">+ New Post</option>';
  postsManifest.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.slug;
    opt.textContent = `${p.date} — ${p.title}`;
    postSelector.appendChild(opt);
  });
}

// ==========================================
// Init
// ==========================================

async function initAdmin() {
  // Load manifest
  try {
    postsManifest = await fetchManifest();
  } catch {
    postsManifest = [];
  }

  // Set today's date
  postDate.value = new Date().toISOString().slice(0, 10);

  // Populate post selector
  await refreshPostSelector();

  // Check for draft
  const hasDraft = loadDraft('new');
  if (hasDraft) {
    updatePreview();
    autoReadTime();
  }

  // Check if there's a slug in URL (for editing from post page)
  const params = new URLSearchParams(window.location.search);
  const editSlug = params.get('edit');
  if (editSlug) {
    await openPost(editSlug);
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (!isAuthenticated()) return;
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    saveDraft();
  }
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
    e.preventDefault();
    btnPublish.click();
  }
});

// Initial load: handle OAuth callback if returning from GitHub,
// otherwise show login gate or admin depending on stored token.
(async function init() {
  await handleOAuthCallback();
  checkAuth();
})();
