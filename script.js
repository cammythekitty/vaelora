document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const themeLink = document.getElementById('theme-link');
  const sunIcon = themeToggle ? themeToggle.querySelector('.sun-icon') : null;
  const moonIcon = themeToggle ? themeToggle.querySelector('.moon-icon') : null;
  const stickyNav = document.getElementById('sticky-nav');
  const copyBtn = document.getElementById('copy-email-btn');
  const btnText = document.getElementById('btn-text');

  // Load saved preference state to align the icons (HTML script handles stylesheet)
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  
  updateIcons(initialTheme);

  // Toggle Action Click Listener
  if (themeToggle && themeLink) {
    themeToggle.addEventListener('click', () => {
      const currentHref = themeLink.getAttribute('href') || '';
      const currentTheme = currentHref.includes('lightmode.css') ? 'light' : 'dark';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      // Force direct, root-relative absolute path
      const targetHref = newTheme === 'dark' ? '/darkmode.css' : '/lightmode.css';
      themeLink.setAttribute('href', targetHref);
      localStorage.setItem('theme', newTheme);
      updateIcons(newTheme);
    });
  }

  // Pure icon visibility helper
  function updateIcons(theme) {
    if (theme === 'dark') {
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
    } else {
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
    }
  }

  // Email Clipboard Copy Handler
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

  // Dynamic Sticky navbar visibility handler
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

  // Restore state on page load
  updateCounter();
  if (promptsLeft === 0) lockChat();

  if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const message = chatInput.value.trim();
      if (!message || promptsLeft <= 0) return;

      // Deduct immediately before the request so they can't spam
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
      typing.className = 'msg msg-bot';
      typing.innerHTML = '<div class="msg-bubble">...</div>';
      chatMessages.appendChild(typing);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        });
        const data = await res.json();
        typing.remove();
        chatMessages.innerHTML += `
          <div class="msg msg-bot">
            <div class="msg-bubble">${data.reply}</div>
          </div>`;
      } catch (err) {
        typing.remove();
        chatMessages.innerHTML += `
          <div class="msg msg-bot">
            <div class="msg-bubble">...tch. Something went wrong. Don't look at me like that.</div>
          </div>`;
      }

      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }
});