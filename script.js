document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const themeLink = document.getElementById('theme-link');
  const sunIcon = themeToggle ? themeToggle.querySelector('.sun-icon') : null;
  const moonIcon = themeToggle ? themeToggle.querySelector('.moon-icon') : null;
  const stickyNav = document.getElementById('sticky-nav');
  const copyBtn = document.getElementById('copy-email-btn');
  const btnText = document.getElementById('btn-text');

  // Load saved preference on startup
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  
  if (themeLink) {
    // Only update DOM on startup if the preferred theme is different from the default markup
    const targetHref = initialTheme === 'dark' ? '/darkmode.css' : '/lightmode.css';
    if (themeLink.getAttribute('href') !== targetHref) {
      themeLink.setAttribute('href', targetHref);
    }
    updateIcons(initialTheme);
  }

  // Toggle Action Click Listener
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

  // Pure icon helper to prevent attribute rewrites
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
});