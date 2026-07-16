document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const themeLink = document.getElementById('theme-link');
  const sunIcon = themeToggle ? themeToggle.querySelector('.sun-icon') : null;
  const moonIcon = themeToggle ? themeToggle.querySelector('.moon-icon') : null;
  const stickyNav = document.getElementById('sticky-nav');
  const copyBtn = document.getElementById('copy-email-btn');
  const btnText = document.getElementById('btn-text');

  // Determine initial theme: priority goes to LocalStorage, then System Preference, default to Light
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  
  if (themeLink) {
    setTheme(initialTheme);
  }

  // Toggle Action Click Listener
  if (themeToggle && themeLink) {
    themeToggle.addEventListener('click', () => {
      const currentHref = themeLink.getAttribute('href') || '';
      const currentTheme = currentHref.includes('lightmode.css') ? 'light' : 'dark';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
    });
  }

  // Smooth theme swapper using secure absolute paths
  function setTheme(theme) {
    if (!themeLink) return;

    // Force strict root-relative absolute paths to bypass directory nesting issues
    const targetHref = theme === 'dark' ? '/darkmode.css' : '/lightmode.css';

    // CRITICAL: Only update the link attribute if it actually changed.
    // This prevents the browser from triggering a recursive 404 look-up loop.
    if (themeLink.getAttribute('href') !== targetHref) {
      themeLink.setAttribute('href', targetHref);
    }

    // Toggle icons and save preference to browser storage
    if (theme === 'dark') {
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
      localStorage.setItem('theme', 'dark');
    } else {
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
      localStorage.setItem('theme', 'light');
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
    // Check if the current page has space to scroll.
    // If it is static/locked (100vh on product pages), show navigation instantly.
    const isScrollable = document.documentElement.scrollHeight > window.innerHeight;

    if (!isScrollable) {
      stickyNav.classList.add('visible');
    } else {
      // If it is the scrollable landing page, apply the scroll listener threshold
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