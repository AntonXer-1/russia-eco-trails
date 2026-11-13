'use strict';

(() => {
  const storageKey = 'eco-trails-profiles-v1';
  const sessionKey = 'eco-trails-active-profile';
  const feedback = document.querySelector('#account-message');

  function loadProfiles() {
    return JSON.parse(localStorage.getItem(storageKey) ?? '{}');
  }

  function saveProfiles(profiles) {
    localStorage.setItem(storageKey, JSON.stringify(profiles));
  }

  function activeProfile() {
    const login = sessionStorage.getItem(sessionKey);
    const profiles = loadProfiles();
    return login && Object.hasOwn(profiles, login) ? profiles[login] : null;
  }

  function updateProfile(change) {
    const login = sessionStorage.getItem(sessionKey);
    const profiles = loadProfiles();
    if (!login || !Object.hasOwn(profiles, login)) throw new Error('No active profile');
    change(profiles[login]);
    saveProfiles(profiles);
  }

  async function passwordHash(password, salt) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const hash = await crypto.subtle.deriveBits({
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 600000,
      hash: 'SHA-256'
    }, key, 256);
    return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  const auth = document.querySelector('#account-auth');
  const panel = document.querySelector('#account-profile');
  const wizard = document.querySelector('#personal-wizard');
  const personalList = document.querySelector('#personal-list');
  const favoriteList = document.querySelector('#favorite-list');

  function renderAccount() {
    const profile = activeProfile();
    auth.hidden = Boolean(profile);
    panel.hidden = !profile;
    if (!profile) return;
    panel.querySelector('#profile-name').textContent = profile.name;
    document.querySelector('#personal-empty').hidden = profile.routes.length > 0;
    const template = document.querySelector('#personal-template');
    personalList.replaceChildren(...profile.routes.map(route => {
      const card = template.content.firstElementChild.cloneNode(true);
      card.querySelector('h3').textContent = route.title;
      card.querySelector('[data-personal-meta]').textContent = route.region + ' · ' + route.distance.toLocaleString('ru') + ' км';
      card.querySelector('[data-personal-description]').textContent = route.description;
      card.querySelector('button').addEventListener('click', () => {
        updateProfile(current => {
          current.routes = current.routes.filter(item => item.id !== route.id);
        });
        renderAccount();
      });
      return card;
    }));
  }

  function favoriteLabel(trail, saved) {
    return (saved ? 'Убрать из избранного: ' : 'В избранное: ') + trail.name;
  }

  function syncFavorite(button, profile) {
    const trail = window.TRAILS.find(item => item.id === button.dataset.favorite);
    if (!trail) return;
    const saved = Boolean(profile?.favorites.includes(trail.id));
    button.textContent = saved ? '♥ В избранном' : '♡ В избранное';
    button.setAttribute('aria-label', favoriteLabel(trail, saved));
    button.setAttribute('aria-pressed', String(saved));
  }

  function renderFavorites() {
    const profile = activeProfile();
    document.querySelector('#favorites-login').hidden = Boolean(profile);
    const trails = window.TRAILS.filter(trail => profile?.favorites.includes(trail.id));
    document.querySelector('#favorites-empty').hidden = !profile || trails.length > 0;
    const template = document.querySelector('#favorite-template');
    favoriteList.replaceChildren(...trails.map(trail => {
      const card = template.content.firstElementChild.cloneNode(true);
      card.querySelector('img').src = 'images/' + trail.photo.file;
      card.querySelector('img').alt = trail.photo.title;
      card.querySelector('h2').textContent = trail.name;
      card.querySelector('p').textContent = trail.region + ' · ' + trail.length;
      card.querySelector('a').href = 'route.html?id=' + trail.id;
      card.querySelector('button').dataset.favorite = trail.id;
      syncFavorite(card.querySelector('button'), profile);
      return card;
    }));
  }

  try {
    const profile = activeProfile();
    if (auth) renderAccount();
    if (favoriteList) renderFavorites();
    document.querySelectorAll('[data-favorite]').forEach(button => {
      if (button.dataset.favorite) {
        syncFavorite(button, profile);
        button.disabled = false;
      }
    });
  } catch {
    document.querySelectorAll('[data-favorite]').forEach(button => button.disabled = true);
    if (auth) {
      auth.hidden = true;
      feedback.textContent = 'Разрешите браузеру сохранять данные сайта, чтобы пользоваться кабинетом.';
    }
    return;
  }

  if (auth) {
    const loginForm = auth.querySelector('form');
    loginForm.addEventListener('submit', async event => {
      event.preventDefault();
      const register = event.submitter?.value === 'register';
      const login = loginForm.elements.login.value.trim().toLowerCase();
      const name = loginForm.elements.displayName.value.trim();
      const password = loginForm.elements.password.value;
      if (register && !name) {
        feedback.textContent = 'Укажите имя для нового профиля.';
        loginForm.elements.displayName.focus();
        return;
      }
      loginForm.querySelectorAll('button').forEach(button => button.disabled = true);
      feedback.textContent = '';
      try {
        const profiles = loadProfiles();
        const exists = Object.hasOwn(profiles, login);
        if (register) {
          if (exists) {
            feedback.textContent = 'Этот логин уже занят в данном браузере.';
            return;
          }
          const salt = crypto.randomUUID();
          const hash = await passwordHash(password, salt);
          const latestProfiles = loadProfiles();
          if (Object.hasOwn(latestProfiles, login)) {
            feedback.textContent = 'Этот логин уже занят в данном браузере.';
            return;
          }
          latestProfiles[login] = {name, salt, hash, favorites: [], routes: []};
          saveProfiles(latestProfiles);
        } else if (!exists || await passwordHash(password, profiles[login].salt) !== profiles[login].hash) {
          feedback.textContent = 'Проверьте логин и пароль.';
          return;
        }
        sessionStorage.setItem(sessionKey, login);
        loginForm.reset();
        renderAccount();
      } catch {
        feedback.textContent = 'Вход недоступен. Откройте сайт по HTTPS и проверьте настройки браузера.';
      } finally {
        loginForm.querySelectorAll('button').forEach(button => button.disabled = false);
      }
    });

    panel.querySelector('#account-logout').addEventListener('click', () => {
      sessionStorage.removeItem(sessionKey);
      wizard.reset();
      showStep(0);
      renderAccount();
    });

    const steps = [...wizard.querySelectorAll('fieldset')];
    const stepLabel = document.querySelector('#wizard-step');
    const names = ['Сведения о маршруте', 'Описание', 'Предпросмотр'];
    function showStep(index) {
      steps.forEach((step, i) => {
        step.hidden = i !== index;
        step.disabled = i !== index;
      });
      stepLabel.textContent = (index + 1) + ' / 3 · ' + names[index];
    }

    wizard.querySelector('[data-next]').addEventListener('click', () => {
      if (wizard.reportValidity()) showStep(1);
    });
    wizard.querySelectorAll('[data-previous]').forEach(button => {
      button.addEventListener('click', () => showStep(Number(button.dataset.previous)));
    });
    wizard.querySelector('[data-preview]').addEventListener('click', () => {
      if (!wizard.reportValidity()) return;
      const route = readRoute();
      wizard.querySelector('[data-preview-title]').textContent = route.title;
      wizard.querySelector('[data-preview-meta]').textContent = route.region + ' · ' + route.distance.toLocaleString('ru') + ' км';
      wizard.querySelector('[data-preview-description]').textContent = route.description;
      showStep(2);
    });

    function readRoute() {
      return {
        title: wizard.elements.title.value.trim(),
        region: wizard.elements.region.value.trim(),
        distance: Number(wizard.elements.distance.value),
        description: wizard.elements.description.value.trim()
      };
    }

    wizard.querySelectorAll('input[type="text"], textarea').forEach(field => {
      field.addEventListener('input', () => {
        field.setCustomValidity(field.value && !field.value.trim() ? 'Введите текст.' : '');
      });
    });

    wizard.addEventListener('submit', event => {
      event.preventDefault();
      if (steps[2].hidden) {
        const button = steps[0].hidden ? '[data-preview]' : '[data-next]';
        wizard.querySelector(button).click();
        return;
      }
      const route = readRoute();
      const status = document.querySelector('#personal-status');
      try {
        updateProfile(current => current.routes.push({id: crypto.randomUUID(), ...route}));
        wizard.reset();
        showStep(0);
        renderAccount();
        status.textContent = 'Маршрут сохранён.';
      } catch {
        status.textContent = 'Не удалось сохранить маршрут в браузере.';
      }
    });
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-favorite]');
    if (!button || !window.TRAILS.some(trail => trail.id === button.dataset.favorite)) return;
    const id = button.dataset.favorite;
    try {
      if (!activeProfile()) {
        location.href = 'account.html';
        return;
      }
      updateProfile(profile => {
        profile.favorites = profile.favorites.includes(id)
          ? profile.favorites.filter(savedId => savedId !== id)
          : [...profile.favorites, id];
      });
      if (favoriteList) {
        renderFavorites();
        document.querySelector('#favorites-title').focus();
      } else {
        const profile = activeProfile();
        document.querySelectorAll('[data-favorite]').forEach(item => syncFavorite(item, profile));
      }
    } catch {
      window.alert('Не удалось обновить избранное в браузере.');
    }
  });
})();
