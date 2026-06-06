// ========================================
// Blog — Zhuoqi Fu
// ========================================

/**
 * Set current year in footer.
 */
(function setFooterYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();

/**
 * Smooth scroll for "Back to top" links.
 */
(function initBackToTop() {
  document.querySelectorAll('a[href="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
})();
