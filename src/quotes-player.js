// Quote clips with timed captions (autoplay muted).
// The data source of truth is the tab buttons themselves:
//   <button class="quotes-tab" data-src="quote-x.mp4">
//     <script type="application/json">[[s, e, "text"], ...]</script>
//     label
//   </button>
// We prefix data-src with Vite's BASE_URL at runtime so the HTML stays free
// of deploy-environment concerns (the site is served from a GitHub Pages subpath).

const CAPTION_SWAP_DELAY_MS = 140;
const BASE = import.meta.env.BASE_URL;

function readClipsFromTabs(tabs) {
  const clips = [];
  for (const tab of tabs) {
    const src = tab.dataset.src;
    if (!src) continue;
    const jsonNode = tab.querySelector('script[type="application/json"]');
    let captions = [];
    if (jsonNode && jsonNode.textContent.trim()) {
      try {
        captions = JSON.parse(jsonNode.textContent);
      } catch (err) {
        console.error('[quotes-player] failed to parse captions for', src, err);
        captions = [];
      }
    }
    clips.push({ tab, src: `${BASE}${src}`, captions });
  }
  return clips;
}

export function initQuotesPlayer() {
  const video = document.getElementById('quote-video');
  const captionEl = document.getElementById('quote-caption');
  const screenEl = document.querySelector('.quotes-screen');
  const tabs = document.querySelectorAll('.quotes-tab');
  if (!video || !captionEl || !screenEl || !tabs.length) return;

  const clips = readClipsFromTabs(tabs);
  if (!clips.length) return;

  let current = 0;
  let lastCaption = '';
  let captionSwapTimer = 0;
  let hoverAudioEnabled = false;
  let firstHoverForClip = true;

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
    const wasEnabled = hoverAudioEnabled;
    hoverAudioEnabled = enabled;
    if (enabled) {
      if (!wasEnabled && firstHoverForClip) {
        // First time hovering this clip — restart from beginning
        firstHoverForClip = false;
        try { video.currentTime = 0; } catch (_) {}
        clearCaption();
      }
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
    firstHoverForClip = true;
    video.src = clips[index].src;
    video.load();
    clearCaption();
    void playPreview(hoverAudioEnabled);
    clips.forEach((clip, i) => {
      clip.tab.classList.toggle('active', i === index);
      clip.tab.setAttribute('aria-selected', i === index);
    });
  }

  video.addEventListener('timeupdate', () => {
    const t = video.currentTime;
    const cap = clips[current].captions.find(([s, e]) => t >= s && t < e);
    showCaption(cap ? cap[2] : '');
  });

  clips.forEach((clip, index) => {
    clip.tab.addEventListener('click', (e) => {
      e.preventDefault();
      if (index === current) return;
      loadClip(index);
    });
  });

  screenEl.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.quotes-overlay')) return;
    // On touch, this is the user gesture that authorizes audio playback.
    // If pointerenter already enabled hover, just (re)try playing with audio.
    if (!hoverAudioEnabled) setHoverAudio(true);
    else void playPreview(true);
  });
  screenEl.addEventListener('pointerenter', () => setHoverAudio(true));
  screenEl.addEventListener('pointerleave', () => setHoverAudio(false));
  screenEl.addEventListener('focus', () => setHoverAudio(true));
  screenEl.addEventListener('blur', () => setHoverAudio(false));
  screenEl.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (!hoverAudioEnabled) setHoverAudio(true);
    else void playPreview(true);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setHoverAudio(false);
  });

  window.addEventListener('blur', () => setHoverAudio(false));

  // Initialize: point the video at the first clip through BASE_URL
  // (the HTML's src attribute doesn't have the BASE prefix).
  video.src = clips[0].src;
  video.load();
  void playPreview(false);
}
