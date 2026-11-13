'use strict';

(() => {
  const key = 'eco-trails-theme';
  const root = document.documentElement;
  let theme = 'light';
  try {
    if (localStorage.getItem(key) === 'dark') theme = 'dark';
  } catch {
    // The site still works when storage is disabled.
  }
  root.dataset.bsTheme = theme;

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('#theme-toggle');
    const icon = button.querySelector('span');

    function updateButton() {
      const dark = root.dataset.bsTheme === 'dark';
      const label = dark ? 'Светлая тема' : 'Тёмная тема';
      button.setAttribute('aria-label', label);
      button.title = label;
      icon.textContent = dark ? '☀' : '☾';
    }

    updateButton();
    button.disabled = false;
    button.addEventListener('click', () => {
      root.classList.add('theme-transition');
      root.dataset.bsTheme = root.dataset.bsTheme === 'dark' ? 'light' : 'dark';
      updateButton();
      try {
        localStorage.setItem(key, root.dataset.bsTheme);
      } catch {
        // A temporary theme selection still works.
      }
    });
  });
})();
