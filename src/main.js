import { initQuotesPlayer } from './quotes-player.js';

// Scroll reveal (IntersectionObserver fallback for Safari)
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15, rootMargin: '0px 0px -15% 0px' }
);
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// Contact form
document.getElementById('contact-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  e.target.closest('.form-row').hidden = true;
  document.getElementById('contact-success').hidden = false;
});

initQuotesPlayer();
