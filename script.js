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

    // Force clean, absolute root paths to bypass server subdirectory confusion
    const resolvedHref = theme === 'dark' ? '/darkmode.css' : '/lightmode.css';

    themeLink.setAttribute('href', resolvedHref);

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
    // If the page has no scrollability (like our fixed 100vh product pages),
    // we force the navbar to be visible instantly.
    const isScrollable = document.documentElement.scrollHeight > window.innerHeight;

    if (!isScrollable) {
      stickyNav.classList.add('visible');
    } else {
      // If it is the main landing page, use your classic scroll threshold
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