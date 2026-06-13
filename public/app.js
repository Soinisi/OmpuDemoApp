// Scroll reveal
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

function observeReveal() {
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

// Price counter animation
function animatePrices() {
  document.querySelectorAll(".drink-price[data-price]").forEach((el) => {
    const target = parseFloat(el.dataset.price);
    if (el.dataset.animated === "true") return;
    el.dataset.animated = "true";

    let current = 0;
    const duration = 400;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      current = target * eased;
      el.textContent = "€" + (current % 1 === 0 ? current : current.toFixed(1));
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = "€" + target;
    }

    requestAnimationFrame(step);
  });
}

// Run on page load
observeReveal();
animatePrices();

// Re-run after htmx content swaps
document.body.addEventListener("htmx:afterSwap", () => {
  observeReveal();
  animatePrices();
});
