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

// ── Quote clips with timed captions (autoplay muted) ──
(() => {
  const video = document.getElementById('quote-video');
  const captionEl = document.getElementById('quote-caption');
  const screenEl = document.querySelector('.quotes-screen');
  const tabs = document.querySelectorAll('.quotes-tab');
  if (!video || !captionEl || !screenEl || !tabs.length) return;
  const CAPTION_SWAP_DELAY_MS = 140;

  const clips = [
    {
      src: '/quote-definition.mp4',
      captions: [
        [0.5,  4.0,  'גלופ מחפשת תבניות'],
        [4.0,  8.0,  'של רגש, מחשבה, או פעולה — שיש להם היבט פרודוקטיבי'],
        [9.0,  11.0, 'שוב אני חוזר —'],
        [11.0, 15.0, 'תבנית של רגש, מחשבה, או פעולה שיש לה היבט פרודוקטיבי'],
        [16.0, 20.0, 'הגדרה של חוזקה מבחינת גלופ —'],
        [20.0, 23.0, 'ביצוע קרוב למושלם, לאורך זמן'],
        [23.5, 27.5, 'אם משהו שמדי פעם אתה עושה מאוד טוב —'],
        [27.5, 29.0, 'זו עדיין לא חוזקה'],
      ],
    },
    {
      src: '/quote-filters.mp4',
      captions: [
        [0.5,  5.0,  'רוב האנשים חושבים שהפילטר שלהם על העולם'],
        [5.0,  7.5,  'דומה לפילטר של אנשים אחרים'],
        [7.5,  10.5, 'הפילטרים שלנו שונים'],
        [10.5, 14.5, 'חוזקות נותן לנו שפה לדבר על זה'],
      ],
    },
    {
      src: '/quote-magic.mp4',
      captions: [
        [0.5,  4.5,  'הקסם הוא כשאנחנו יושבים בצוות'],
        [4.5,  9.0,  'ופתאום אנשים שומעים משהו שהם הרגישו באופן אינטואיטיבי'],
        [9.5,  14.0, 'פתאום מישהו נתן מילים מדויקות לתאר אותם'],
        [14.0, 17.0, 'יש בזה ערך אדיר'],
      ],
    },
  ];

  let current = 0;
  let lastCaption = '';
  let captionSwapTimer = 0;
  let hoverAudioEnabled = false;

  function applyAudioState(withAudio) {
    video.defaultMuted = !withAudio;
    video.muted = !withAudio;
    video.volume = withAudio ? 1 : 0;
  }

  function playPreview(withAudio) {
    applyAudioState(withAudio);

    return video.play().catch(() => {
      if (!withAudio) return;
      applyAudioState(false);
      return video.play().catch(() => {});
    });
  }

  function setHoverAudio(enabled) {
    hoverAudioEnabled = enabled;
    if (enabled) {
      void playPreview(true);
      return;
    }

    applyAudioState(false);
    if (video.paused) void playPreview(false);
  }

  function showCaption(text) {
    if (text === lastCaption) return;
    lastCaption = text;
    window.clearTimeout(captionSwapTimer);
    const span = captionEl.querySelector('span');
    if (!text) {
      if (span) span.classList.remove('visible');
      return;
    }
    if (span) {
      span.classList.remove('visible');
      captionSwapTimer = window.setTimeout(() => {
        span.textContent = text;
        span.classList.add('visible');
      }, CAPTION_SWAP_DELAY_MS);
    } else {
      const s = document.createElement('span');
      s.textContent = text;
      captionEl.appendChild(s);
      requestAnimationFrame(() => s.classList.add('visible'));
    }
  }

  function clearCaption() {
    lastCaption = '';
    window.clearTimeout(captionSwapTimer);
    const span = captionEl.querySelector('span');
    if (span) { span.classList.remove('visible'); span.textContent = ''; }
  }

  function loadClip(index) {
    current = index;
    video.src = clips[index].src;
    video.load();
    clearCaption();
    void playPreview(hoverAudioEnabled);
    tabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
      tab.setAttribute('aria-selected', i === index);
    });
  }

  video.addEventListener('timeupdate', () => {
    const t = video.currentTime;
    const cap = clips[current].captions.find(([s, e]) => t >= s && t < e);
    showCaption(cap ? cap[2] : '');
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const index = Number(tab.dataset.clip);
      if (index === current) return;
      loadClip(index);
    });
  });

  screenEl.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.quotes-overlay')) return;
    hoverAudioEnabled = true;
    void playPreview(true);
  });
  screenEl.addEventListener('pointerenter', () => setHoverAudio(true));
  screenEl.addEventListener('pointerleave', () => setHoverAudio(false));
  screenEl.addEventListener('focus', () => setHoverAudio(true));
  screenEl.addEventListener('blur', () => setHoverAudio(false));
  screenEl.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    hoverAudioEnabled = true;
    void playPreview(true);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setHoverAudio(false);
  });

  window.addEventListener('blur', () => setHoverAudio(false));
  void playPreview(false);
})();
