// ========================================
// Personal Homepage — Zhuoqi Fu (Allen)
// ========================================

/**
 * Typing animation — types out text char by char with a blinking cursor.
 */
(function initTyping() {
  const el = document.querySelector("[data-typing]");
  const cursor = document.querySelector(".cursor");
  if (!el || !cursor) return;

  const text = el.getAttribute("data-typing");
  el.textContent = "";
  cursor.classList.remove("done");

  let i = 0;
  const speed = 55;          // ms per character
  const startDelay = 400;    // pause before typing begins

  function type() {
    if (i < text.length) {
      el.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed + Math.random() * 25); // slight human-like variance
    } else {
      cursor.classList.add("done");
    }
  }

  setTimeout(type, startDelay);
})();

/**
 * Intersection Observer — reveals timeline items on scroll.
 */
(function initScrollReveal() {
  const items = document.querySelectorAll("[data-animate]");
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -30px 0px" }
  );

  items.forEach((item) => observer.observe(item));
})();

/**
 * Set current year in footer.
 */
document.getElementById("year").textContent = new Date().getFullYear();
