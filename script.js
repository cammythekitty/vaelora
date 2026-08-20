document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const themeLink = document.getElementById('theme-link');
  const sunIcon = themeToggle ? themeToggle.querySelector('.sun-icon') : null;
  const moonIcon = themeToggle ? themeToggle.querySelector('.moon-icon') : null;
  const stickyNav = document.getElementById('sticky-nav');
  const copyBtn = document.getElementById('copy-email-btn');
  const btnText = document.getElementById('btn-text');

  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  updateIcons(initialTheme);

  if (themeToggle && themeLink) {
    themeToggle.addEventListener('click', () => {
      const currentHref = themeLink.getAttribute('href') || '';
      const currentTheme = currentHref.includes('lightmode.css') ? 'light' : 'dark';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      const targetHref = newTheme === 'dark' ? '/darkmode.css' : '/lightmode.css';
      themeLink.setAttribute('href', targetHref);
      localStorage.setItem('theme', newTheme);
      updateIcons(newTheme);
    });
  }

  function updateIcons(theme) {
    if (theme === 'dark') {
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
    } else {
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
    }
  }

  if (copyBtn && btnText) {
    copyBtn.addEventListener('click', () => {
      const email = copyBtn.getAttribute('data-email');
      navigator.clipboard.writeText(email).then(() => {
        btnText.textContent = "Copied to clipboard!";
        copyBtn.classList.add('copied');
        setTimeout(() => {
          btnText.textContent = email;
          copyBtn.classList.remove('copied');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    });
  }

  if (stickyNav) {
    const isScrollable = document.documentElement.scrollHeight > window.innerHeight;
    if (!isScrollable) {
      stickyNav.classList.add('visible');
    } else {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 150) {
          stickyNav.classList.add('visible');
        } else {
          stickyNav.classList.remove('visible');
        }
      });
    }
  }

  // Chat Demo Handler
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const promptCounter = document.getElementById('prompt-counter');
  const sendBtn = document.getElementById('send-btn');

  const MAX_PROMPTS = 3;
  const STORAGE_KEY = 'seraphine_prompts_used';

  let promptsUsed = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  let promptsLeft = Math.max(0, MAX_PROMPTS - promptsUsed);

  function updateCounter() {
    promptCounter.textContent = `${promptsLeft} prompt${promptsLeft !== 1 ? 's' : ''} left`;
  }

  function lockChat() {
    sendBtn.disabled = true;
    chatInput.disabled = true;
    chatInput.placeholder = "You've used all your prompts.";
  }

  updateCounter();
  if (promptsLeft === 0) lockChat();

  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const message = chatInput.value.trim();
      if (!message || promptsLeft <= 0) return;

      promptsUsed++;
      promptsLeft--;
      localStorage.setItem(STORAGE_KEY, promptsUsed);
      updateCounter();
      if (promptsLeft === 0) lockChat();

      chatMessages.innerHTML += `
        <div class="msg msg-user">
          <div class="msg-bubble">${message}</div>
        </div>`;
      chatInput.value = '';
      chatMessages.scrollTop = chatMessages.scrollHeight;

      const typing = document.createElement('div');
      typing.className = 'msg msg-bot typing-wrap';
      typing.innerHTML = `
        <div class="msg-bubble typing-indicator">
          <span></span><span></span><span></span>
        </div>`;
      chatMessages.appendChild(typing);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      const ws = new WebSocket('wss://vaelora.dev/api/chat');

      ws.onopen = () => {
        ws.send(JSON.stringify({ prompt: message }));
      };

      let reply = '';

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'done') {
            ws.close();
            typing.remove();
            chatMessages.innerHTML += `
              <div class="msg msg-bot">
                <div class="msg-bubble">${reply}</div>
              </div>`;
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
          // ignore model_info and other typed frames
        } catch {
          // not JSON, it's a raw token
          reply += event.data;
        }
      };

      ws.onerror = () => {
        typing.remove();
        chatMessages.innerHTML += `
          <div class="msg msg-bot">
            <div class="msg-bubble">...tch. Something went wrong. Don't look at me like that.</div>
          </div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
      };
    });
  }

  // ── Scroll-reveal ─────────────────────────────────────────
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
        if (entry.isIntersecting) {
          navLinks.forEach(a => a.classList.remove('active'));
          const active = document.querySelector(`.nav-links a[href*="#${entry.target.id}"]`);
          if (active) active.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => activeObserver.observe(s));
  }
});