document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // localStorage can throw (private mode, blocked storage), so never touch it directly.
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* ignore */ } },
  };

  // ── Theme ─────────────────────────────────────────────────
  const themeToggle = document.getElementById('theme-toggle');
  const themeLink = document.getElementById('theme-link');
  const sunIcon = themeToggle ? themeToggle.querySelector('.sun-icon') : null;
  const moonIcon = themeToggle ? themeToggle.querySelector('.moon-icon') : null;
  const THEME_KEY = 'theme';

  function getStoredTheme() {
    const stored = store.get(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  }

  function currentTheme() {
    const href = themeLink ? themeLink.getAttribute('href') || '' : '';
    return href.includes('lightmode.css') ? 'light' : 'dark';
  }

  function updateIcons(theme) {
    if (sunIcon) sunIcon.style.display = theme === 'dark' ? 'block' : 'none';
    if (moonIcon) moonIcon.style.display = theme === 'dark' ? 'none' : 'block';
    if (themeToggle) themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
  }

  function applyTheme(theme, persist) {
    if (!themeLink) return;
    themeLink.setAttribute('href', theme === 'light' ? '/lightmode.css' : '/darkmode.css');
    if (persist) store.set(THEME_KEY, theme);
    updateIcons(theme);
  }

  // The inline script in <head> already picked the right stylesheet; just sync the icons.
  updateIcons(currentTheme());

  if (themeToggle && themeLink) {
    themeToggle.addEventListener('click', () => {
      applyTheme(currentTheme() === 'light' ? 'dark' : 'light', true);
    });
  }

  // Keep other open tabs in sync.
  window.addEventListener('storage', (event) => {
    if (event.key !== THEME_KEY) return;
    const stored = getStoredTheme();
    if (stored) applyTheme(stored, false);
  });

  // ── Mobile nav ────────────────────────────────────────────
  const nav = document.getElementById('site-nav');
  const navToggle = document.getElementById('nav-toggle');
  const navLinksEl = document.getElementById('nav-links');

  function setNavOpen(open) {
    if (!nav || !navToggle) return;
    nav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (nav && navToggle && navLinksEl) {
    navToggle.addEventListener('click', () => setNavOpen(!nav.classList.contains('open')));
    navLinksEl.addEventListener('click', (e) => { if (e.target.closest('a')) setNavOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNavOpen(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 680) setNavOpen(false); });
  }

  // ── Footer year ───────────────────────────────────────────
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ── Typewriter (home page) ────────────────────────────────
  const typedEl = document.getElementById('typed-text');
  if (typedEl) {
    const phrases = [
      'a Rust inference engine.',
      'a self-hosted AI persona.',
      'a custom Linux distro.',
      'built from scratch, for fun.',
    ];
    if (reducedMotion) {
      typedEl.textContent = phrases[0];
    } else {
      let pi = 0, ci = 0, deleting = false;
      const type = () => {
        const phrase = phrases[pi];
        if (!deleting) {
          typedEl.textContent = phrase.slice(0, ++ci);
          if (ci === phrase.length) {
            deleting = true;
            setTimeout(type, 1800);
            return;
          }
          setTimeout(type, 55);
        } else {
          typedEl.textContent = phrase.slice(0, --ci);
          if (ci === 0) {
            deleting = false;
            pi = (pi + 1) % phrases.length;
            setTimeout(type, 300);
            return;
          }
          setTimeout(type, 28);
        }
      };
      setTimeout(type, 800);
    }
  }

  // ── Copy email ────────────────────────────────────────────
  const copyBtn = document.getElementById('copy-email-btn');
  const btnText = document.getElementById('btn-text');
  if (copyBtn && btnText) {
    copyBtn.addEventListener('click', () => {
      const email = copyBtn.getAttribute('data-email');
      const done = () => {
        btnText.textContent = 'Copied to clipboard!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          btnText.textContent = email;
          copyBtn.classList.remove('copied');
        }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done).catch(() => { window.location.href = `mailto:${email}`; });
      } else {
        window.location.href = `mailto:${email}`;
      }
    });
  }

  // ── Chat demo ─────────────────────────────────────────────
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const promptCounter = document.getElementById('prompt-counter');
  const sendBtn = document.getElementById('send-btn');

  if (chatForm && chatInput && chatMessages && promptCounter && sendBtn) {
    const MAX_PROMPTS = 3;                       // Client-side only: enforce the real limit on the server.
    const STORAGE_KEY = 'seraphine_prompts';
    const WINDOW_MS = 24 * 60 * 60 * 1000;       // The allowance resets 24 hours after the first message.
    const CHAT_URL = 'wss://vaelora.dev/api/chat';

    // Stored as {used, since}. Anything unreadable (including the old plain-number format) starts fresh.
    const loadUsage = () => {
      try {
        const data = JSON.parse(store.get(STORAGE_KEY));
        if (data && Number.isInteger(data.used) && typeof data.since === 'number' &&
            Date.now() - data.since < WINDOW_MS) {
          return data;
        }
      } catch { /* fall through */ }
      return { used: 0, since: Date.now() };
    };

    let usage = loadUsage();
    let promptsLeft = Math.max(0, MAX_PROMPTS - usage.used);
    let busy = false;

    const updateCounter = () => {
      promptCounter.textContent = `${promptsLeft} prompt${promptsLeft !== 1 ? 's' : ''} left`;
    };

    let lockNoticeShown = false;
    const lockChat = () => {
      sendBtn.disabled = true;
      chatInput.disabled = true;
      chatInput.placeholder = 'Come back tomorrow for more.';
      if (!lockNoticeShown) {
        lockNoticeShown = true;
        const hours = Math.max(1, Math.ceil((usage.since + WINDOW_MS - Date.now()) / 3600000));
        addMessage('bot', `That's all ${MAX_PROMPTS} of your messages. My GPU needs a break. Come back in about ${hours} hour${hours !== 1 ? 's' : ''}, or email me if you'd like to talk properly.`);
      }
    };

    // Messages are built with textContent so neither user input nor model output is parsed as HTML.
    const addMessage = (who, text) => {
      const msg = document.createElement('div');
      msg.className = `msg msg-${who}`;
      const bubble = document.createElement('div');
      bubble.className = 'msg-bubble';
      bubble.textContent = text;
      msg.appendChild(bubble);
      chatMessages.appendChild(msg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return bubble;
    };

    const addTyping = () => {
      const wrap = document.createElement('div');
      wrap.className = 'msg msg-bot typing-wrap';
      const bubble = document.createElement('div');
      bubble.className = 'msg-bubble typing-indicator';
      bubble.innerHTML = '<span></span><span></span><span></span>';
      wrap.appendChild(bubble);
      chatMessages.appendChild(wrap);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return wrap;
    };

    updateCounter();
    if (promptsLeft === 0) lockChat();

    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const message = chatInput.value.trim();
      if (!message || promptsLeft <= 0 || busy) return;

      busy = true;
      sendBtn.disabled = true;

      addMessage('user', message);
      chatInput.value = '';
      const typing = addTyping();

      let replyBubble = null;
      let finished = false;

      const finish = (errorText) => {
        if (finished) return;
        finished = true;
        typing.remove();
        if (errorText && !replyBubble) addMessage('bot', errorText);
        busy = false;
        if (promptsLeft === 0) lockChat(); else sendBtn.disabled = false;
      };

      const appendToken = (token) => {
        if (!replyBubble) {
          // Only count the prompt once the server actually starts answering,
          // so a failed connection doesn't use one up.
          if (usage.used === 0) usage.since = Date.now();
          usage.used++;
          promptsLeft = Math.max(0, MAX_PROMPTS - usage.used);
          store.set(STORAGE_KEY, JSON.stringify(usage));
          updateCounter();
          typing.remove();
          replyBubble = addMessage('bot', '');
        }
        replyBubble.textContent += token;
        chatMessages.scrollTop = chatMessages.scrollHeight;
      };

      let ws;
      try {
        ws = new WebSocket(CHAT_URL);
      } catch {
        finish("...tch. I can't reach the server right now. Try again in a bit.");
        return;
      }

      ws.onopen = () => ws.send(JSON.stringify({ prompt: message }));

      ws.onmessage = (event) => {
        let frame = null;
        try { frame = JSON.parse(event.data); } catch { /* raw token */ }

        // Control frames are JSON objects with a string "type". Anything else is token text,
        // including tokens that happen to be valid JSON such as "42" or "true".
        if (frame && typeof frame === 'object' && typeof frame.type === 'string') {
          if (frame.type === 'done') {
            finish();
            ws.close();
          }
          return; // model_info and other typed frames are ignored
        }
        appendToken(event.data);
      };

      ws.onerror = () => finish("...tch. Something went wrong. Don't look at me like that.");
      ws.onclose = () => finish(replyBubble ? '' : '...tch. The connection dropped before I could answer.');
    });
  }

  // ── Count-up numbers ──────────────────────────────────────
  // <span data-count="47">47</span> shows the final value without JS and animates with it.
  if (!reducedMotion) {
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      if (Number.isNaN(target)) return;
      el.textContent = '0';
      const duration = 1800;
      const run = () => {
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          el.textContent = String(Math.round((1 - Math.pow(1 - progress, 4)) * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      };
      const io = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) { io.disconnect(); run(); }
      }, { threshold: 0.4 });
      io.observe(el);
    });
  }

  // ── Scroll reveal ─────────────────────────────────────────
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => revealObserver.observe(el));
  }

  // ── Nav active link highlight on scroll ───────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  if (sections.length && navLinks.length) {
    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => a.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href$="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => activeObserver.observe(s));
  }
});
