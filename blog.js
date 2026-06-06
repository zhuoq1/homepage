// ========================================
// Blog Rendering Engine — blog.js
// ========================================

const POSTS_PER_PAGE = 5;

/**
 * Fetch the posts manifest. Returns parsed array, newest-first.
 */
async function fetchManifest() {
  const resp = await fetch('/posts-manifest.json');
  if (!resp.ok) throw new Error(`Manifest fetch failed: ${resp.status}`);
  return resp.json();
}

/**
 * Fetch a markdown post and parse it to HTML.
 * @param {string} slug - post slug (filename without .md)
 * @returns {Promise<{html: string, metadata: object}>}
 */
async function fetchPostHtml(slug) {
  const resp = await fetch(`/posts/${slug}.md`);
  if (!resp.ok) throw new Error(`Post fetch failed: ${resp.status}`);
  const md = await resp.text();
  const html = DOMPurify.sanitize(marked.parse(md));
  return { html };
}

/**
 * Render a list of post-entry cards into a container.
 */
function renderPostList(container, posts, page = 1) {
  const start = (page - 1) * POSTS_PER_PAGE;
  const pagePosts = posts.slice(start, start + POSTS_PER_PAGE);

  container.innerHTML = '';

  pagePosts.forEach((post) => {
    const article = document.createElement('article');
    article.className = 'post-entry';

    const tagsHtml = post.tags
      .map((t) => `<a class="post-tag" href="archive.html">${escapeHtml(t)}</a>`)
      .join('\n');

    article.innerHTML = `
      <h3 class="post-title">
        <a href="/post.html?slug=${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a>
      </h3>
      <div class="post-meta">
        <span>${formatDate(post.date)}</span>
        <span class="post-meta-sep">·</span>
        <span>${escapeHtml(post.readTime)} read</span>
        <span class="post-tags">${tagsHtml}</span>
      </div>
      <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
    `;

    container.appendChild(article);
  });

  // Pagination
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  if (totalPages > 1) {
    const pagNav = document.createElement('nav');
    pagNav.className = 'pagination';
    for (let i = 1; i <= totalPages; i++) {
      const a = document.createElement('a');
      a.href = i === 1 ? '/' : `?page=${i}`;
      a.textContent = i;
      if (i === page) a.className = 'active';
      pagNav.appendChild(a);
    }
    if (page < totalPages) {
      const next = document.createElement('a');
      next.href = `?page=${page + 1}`;
      next.textContent = '»';
      pagNav.appendChild(next);
    }
    container.parentElement.appendChild(pagNav);
  }
}

/**
 * Render archive grouped by year.
 */
function renderArchive(container, posts) {
  container.innerHTML = '';

  const byYear = {};
  posts.forEach((post) => {
    const year = post.date.slice(0, 4);
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(post);
  });

  Object.keys(byYear)
    .sort((a, b) => b.localeCompare(a))
    .forEach((year) => {
      const h2 = document.createElement('h2');
      h2.className = 'archive-year';
      h2.textContent = year;
      container.appendChild(h2);

      byYear[year].forEach((post) => {
        const div = document.createElement('div');
        div.className = 'archive-entry';
        div.innerHTML = `
          <span class="archive-date">${formatDateShort(post.date)}</span>
          <a href="/post.html?slug=${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a>
        `;
        container.appendChild(div);
      });
    });
}

/**
 * Render a single post's content and header.
 */
async function renderPost(container, headerEl, slug) {
  const manifest = await fetchManifest();
  const post = manifest.find((p) => p.slug === slug);

  if (!post) {
    container.innerHTML = '<p class="error">Post not found.</p>';
    document.title = 'Post not found — Zhuoqi\'s Blog';
    return;
  }

  // Populate header
  document.title = `${post.title} — Zhuoqi's Blog`;
  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) descMeta.content = post.excerpt;

  const tagsHtml = post.tags
    .map((t) => `<a class="post-tag" href="../archive.html">${escapeHtml(t)}</a>`)
    .join('\n');

  headerEl.innerHTML = `
    <h1 class="post-title">${escapeHtml(post.title)}</h1>
    <div class="post-meta">
      <span>${formatDate(post.date)}</span>
      <span class="post-meta-sep">·</span>
      <span>${escapeHtml(post.readTime)} read</span>
      <span class="post-tags">${tagsHtml}</span>
    </div>
  `;

  // Fetch and render markdown
  try {
    const { html } = await fetchPostHtml(slug);
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<p class="error">Failed to load post content. Please try again.</p>';
    console.error(err);
  }
}

// --- Utility ---

/**
 * Format ISO date to readable form: "Mon DD, YYYY"
 */
function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format ISO date to short form: "Mon DD"
 */
function formatDateShort(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Escape HTML entities to prevent XSS.
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
