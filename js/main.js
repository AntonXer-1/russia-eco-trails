'use strict';

const trails = window.TRAILS;
const filters = document.querySelector('#filters');

if (filters) {
  const items = [...document.querySelectorAll('.route-item')];
  function updateCatalog() {
    const search = filters.elements.search.value.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');
    const difficulty = filters.elements.difficulty.value;
    const distance = filters.elements.distance.value;
    let count = 0;
    items.forEach(item => {
      const matchesText = item.dataset.name.replaceAll('ё', 'е').includes(search);
      const matchesDifficulty = !difficulty || item.dataset.difficulty === difficulty;
      const km = Number(item.dataset.distance);
      const matchesDistance = !distance || (distance === 'short' ? km <= 2 : km > 2);
      item.hidden = !(matchesText && matchesDifficulty && matchesDistance);
      if (!item.hidden) count++;
    });
    document.querySelector('#results-count').textContent = 'Найдено маршрутов: ' + count;
    document.querySelector('#empty-results').hidden = count !== 0;
  }
  filters.addEventListener('input', updateCatalog);
  filters.addEventListener('change', updateCatalog);
  filters.addEventListener('submit', event => event.preventDefault());
  filters.addEventListener('reset', () => setTimeout(updateCatalog, 0));
  filters.querySelectorAll('[disabled]').forEach(control => control.disabled = false);
}

const title = document.querySelector('#route-title');
if (title) {
  const id = new URLSearchParams(location.search).get('id') || 'baduk';
  const trail = trails.find(item => item.id === id);
  const routeName = trail?.name ?? 'Маршрут не найден';
  title.textContent = routeName;
  document.querySelector('.breadcrumb [aria-current="page"]').textContent = routeName;
  document.title = routeName + ' — Экотропы России';
  if (!trail) {
    document.querySelector('#route-error').hidden = false;
  } else {
    const values = {
      'route-region': trail.region,
      'route-level': trail.level,
      'route-description': trail.description,
      'route-text': trail.details,
      'table-region': trail.region,
      'table-park': trail.park,
      'table-length': trail.length,
      'table-time': trail.time,
      'table-level': trail.level
    };
    Object.entries(values).forEach(([id, value]) => {
      document.getElementById(id).textContent = value;
    });
    if (trail.photo) {
      const gallery = document.querySelector('.route-gallery');
      const template = gallery.querySelector('template');
      const photos = [trail.photo, trail.secondPhoto].filter(Boolean);
      photos.forEach(photo => {
        const figure = template.content.firstElementChild.cloneNode(true);
        const image = figure.querySelector('img');
        image.src = 'images/' + photo.file;
        image.alt = photo.title;
        image.width = photo.width;
        image.height = photo.height;
        figure.querySelector('figcaption').textContent = photo.credit;
        gallery.append(figure);
      });
      gallery.classList.toggle('route-gallery--pair', photos.length === 2);
      document.querySelector('#route-photo').hidden = false;
      document.querySelector('[aria-labelledby="route-about"]').classList.add('col-lg-6');
    }
    document.querySelector('#route-source').textContent = trail.park;
    const [longitude, latitude] = trail.start;
    document.querySelector('#route-coordinates').textContent = latitude + ', ' + longitude;
    const point = longitude + ',' + latitude;
    const params = new URLSearchParams({ll: point, pt: point + ',pm2rdm', z: '15', lang: 'ru_RU'});
    document.querySelector('#route-map').src = 'https://yandex.ru/map-widget/v1/?' + params;
    document.querySelector('#route-question').dataset.route = trail.id;
    document.querySelector('[data-favorite]').dataset.favorite = trail.id;
    document.querySelector('#route-details').hidden = false;
  }
}

const form = document.querySelector('#feedback-form');
const result = document.querySelector('#form-result');
if (form) {
  form.addEventListener('submit', event => {
    event.preventDefault(); // Демо: сетевой отправки нет.
    if (!form.reportValidity()) return;
    result.hidden = false;
    result.focus();
  });
  form.addEventListener('input', () => result.hidden = true);
  form.querySelector('[type="submit"]').disabled = false;

  document.querySelector('#feedbackModal').addEventListener('show.bs.modal', event => {
    const id = event.relatedTarget?.dataset.route || '';
    form.elements.route.value = trails.some(trail => trail.id === id) ? id : '';
    result.hidden = true;
  });
}
