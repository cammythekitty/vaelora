document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const themeLink = document.getElementById('theme-link');
  const sunIcon = themeToggle.querySelector('.sun-icon');
  const moonIcon = themeToggle.querySelector('.moon-icon');
  const stickyNav = document.getElementById('sticky-nav');
  const copyBtn = document.getElementById('copy-email-btn');
  const btnText = document.getElementById('btn-text');
  // Determine initial theme: priority goes to LocalStorage, then System Preference, default to Light
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  setTheme(initialTheme);

  // Toggle Action Click Listener
  themeToggle.addEventListener('click', () => {
    const currentTheme = themeLink.getAttribute('href') === 'lightmode.css' ? 'light' : 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  });



if (copyBtn && btnText) {
  copyBtn.addEventListener('click', () => {
    const email = copyBtn.getAttribute('data-email');
    
    navigator.clipboard.writeText(email).then(() => {
      // Visual feedback
      btnText.textContent = "Copied to clipboard!";
      copyBtn.classList.add('copied'); // You can style this state in CSS if you want!
      
      // Reset after 2 seconds
      setTimeout(() => {
        btnText.textContent = email;
        copyBtn.classList.remove('copied');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  });
}
  // Smooth theme swapper
  function setTheme(theme) {
    if (theme === 'dark') {
      themeLink.setAttribute('href', 'darkmode.css');
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
      localStorage.setItem('theme', 'dark');
    } else {
      themeLink.setAttribute('href', 'lightmode.css');
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
      localStorage.setItem('theme', 'light');
    }
  }

  // Sticky navbar scroll threshold handler
  window.addEventListener('scroll', () => {
    if (window.scrollY > 150) {
      stickyNav.classList.add('visible');
    } else {
      stickyNav.classList.remove('visible');
    }
  });
});