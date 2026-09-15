try {
  if (localStorage.getItem('qtable-theme') === 'dark') {
    document.documentElement.classList.add('theme-dark');
    document.documentElement.style.colorScheme = 'dark';
  }
} catch (error) {}
