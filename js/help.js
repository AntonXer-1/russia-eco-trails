'use strict';

(() => {
  const topics = [
    {
      label: 'Нужен ли пропуск?',
      keywords: /пропуск|билет|разрешени|стоит|стоимость|цен[ауе]|оплат|входн.*плат|платн/iu,
      answer: 'Правила зависят от парка и даты поездки. Уточните на сайте парка, нужен ли пропуск, где его оформить и сколько стоит вход.'
    },
    {
      label: 'Где начало тропы?',
      keywords: /начал|старт|добрат|координат|парков|остановк|карт[аеуы]|где.*вход|откуда/iu,
      answer: 'Откройте маршрут в каталоге. В разделе «Начало маршрута на карте» есть точка старта и её координаты.',
      link: ['catalog.html', 'Открыть каталог'],
      usesRouteStart: true
    },
    {
      label: 'Что взять с собой?',
      keywords: /взят|собой|рюкзак|снаряж|одежд|подготов|обув|аптеч|воду/iu,
      answer: 'Возьмите воду, удобную обувь, одежду по погоде, заряженный телефон и сохранённую схему. Полный список можно отметить галочками на странице подготовки.',
      link: ['preparation.html', 'Подготовка к прогулке']
    },
    {
      keywords: /открыт|закрыт|доступ[еа]|сезон|когда.*(?:идти|посетить)|режим|работает.*парк/iu,
      answer: 'На сайте есть описания троп. Актуальную доступность маршрута и режим посещения уточняйте у национального парка перед выездом.'
    },
    {
      keywords: /сколько.*(?:идти|врем|занима|км|час|минут)|долго|длительност|километр|расстояни|длин[ауе]|протяж/iu,
      answer: 'В карточке указаны длина и время посещения по данным парка. Напишите название маршрута, например «Сколько идти до Шумки?».',
      link: ['catalog.html', 'Открыть каталог'],
      usesRouteTime: true
    },
    {
      keywords: /избран|сердеч/iu,
      answer: 'Войдите в кабинет и нажмите сердечко в каталоге или в карточке. Сохранённый маршрут появится в вашем списке.',
      link: ['favorites.html', 'Открыть избранное']
    },
    {
      keywords: /добав.*маршрут|личн.*маршрут|сво[йе].*маршрут/iu,
      answer: 'В кабинете откройте мастер маршрута, введите сведения и описание, затем проверьте предпросмотр и сохраните.',
      link: ['account.html', 'Открыть кабинет']
    },
    {
      keywords: /войти|зарегистр|кабинет|парол|профил/iu,
      answer: 'Зарегистрируйте профиль в кабинете и входите по логину и паролю. Данные сохраняются в этом браузере.',
      link: ['account.html', 'Открыть кабинет']
    },
    {
      keywords: /автор|админ|почт|связаться|контакт|напиш|оператор/iu,
      answer: 'Вопрос автору сайта можно отправить по почте.',
      link: ['mailto:antonmister6@gmail.com', 'Написать автору']
    }
  ];

  const routeNames = {
    baduk: /бадук/iu,
    shumka: /шумк/iu,
    sculptor: /скульптор|скал[аеуы]? перь/iu,
    laleto: /лалетинск|лалетино/iu,
    book: /книг[ауеи] природ/iu,
    white: /бел(?:ая|ую|ой|ые) троп/iu
  };

  const widget = document.createElement('div');
  widget.innerHTML = `
    <button class="btn btn-success help-open rounded-pill" id="help-open" type="button"
      aria-haspopup="dialog" aria-controls="help-dialog" aria-label="Открыть помощника">
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
        <path d="M21 11a8 8 0 0 1-8 8H4l2-4a8 8 0 1 1 15-4Z" stroke-linejoin="round"/>
        <path d="M9 10h8m-8 4h5" stroke-linecap="round"/>
      </svg>
    </button>
    <dialog class="help-dialog border rounded-3 shadow bg-body text-body" id="help-dialog" aria-labelledby="help-title">
      <div class="d-flex justify-content-between align-items-center gap-2 border-bottom p-3">
        <h2 class="h6 mb-0" id="help-title">Помощник по маршрутам</h2>
        <form method="dialog"><button class="btn-close" type="submit" aria-label="Закрыть помощника"></button></form>
      </div>
      <div class="help-log p-3" id="help-log" role="log" aria-label="Диалог" aria-live="polite"></div>
      <div class="help-controls border-top p-3">
        <div class="d-flex flex-wrap gap-1 mb-3" id="help-quick" aria-label="Быстрые вопросы" role="group"></div>
        <form id="help-form" class="d-flex gap-2">
          <label class="visually-hidden" for="help-input">Ваш вопрос</label>
          <input class="form-control form-control-sm" id="help-input" placeholder="Ваш вопрос" maxlength="300" required>
          <button class="btn btn-success btn-sm" type="submit">Отправить</button>
        </form>
      </div>
    </dialog>`;
  document.body.append(widget);

  const open = widget.querySelector('#help-open');
  const dialog = widget.querySelector('dialog');
  const log = widget.querySelector('#help-log');
  const input = widget.querySelector('#help-input');
  let currentTrail = window.TRAILS.find(trail => location.pathname.endsWith('/route.html')
    && trail.id === (new URLSearchParams(location.search).get('id') || 'baduk'));

  function addMessage(text, fromUser = false, link) {
    const message = document.createElement('div');
    message.className = fromUser ? 'help-message help-message--user' : 'help-message';
    const speaker = document.createElement('span');
    speaker.className = 'visually-hidden';
    speaker.textContent = fromUser ? 'Вы: ' : 'Помощник: ';
    message.append(speaker, document.createTextNode(text));
    if (link) {
      const anchor = document.createElement('a');
      anchor.className = 'd-block mt-1 link-success';
      [anchor.href, anchor.textContent] = link;
      message.append(anchor);
    }
    log.append(message);
    log.scrollTop = log.scrollHeight;
  }

  function reply(question) {
    addMessage(question, true);
    const normalized = question.toLocaleLowerCase('ru').replaceAll('ё', 'е');
    const namedTrail = window.TRAILS.find(trail => routeNames[trail.id].test(normalized));
    if (namedTrail) currentTrail = namedTrail;
    const topic = topics.find(item => item.keywords.test(normalized));
    const trail = namedTrail || currentTrail;
    const routeLink = trail && ['route.html?id=' + trail.id, trail.name];

    if (topic?.usesRouteTime && trail) {
      addMessage('Длина: ' + trail.length + '. Время: ' + trail.time + '.', false, routeLink);
    } else if (topic?.usesRouteStart && trail) {
      const [longitude, latitude] = trail.start;
      addMessage('Координаты начала: ' + latitude + ', ' + longitude + '. Точка отмечена на карте в карточке.', false, routeLink);
    } else if (topic) {
      addMessage(topic.answer, false, topic.link || routeLink);
    } else if (namedTrail) {
      addMessage(namedTrail.description + ' Длина: ' + namedTrail.length + '. Время: ' + namedTrail.time + '.', false, routeLink);
    } else {
      addMessage('Я пока не нашёл ответ. Попробуйте спросить про пропуск, начало тропы или снаряжение. Другие вопросы можно отправить автору по почте.',
        false, ['mailto:antonmister6@gmail.com', 'Написать автору']);
    }
  }

  topics.filter(topic => topic.label).forEach(topic => {
    const button = document.createElement('button');
    button.className = 'btn btn-sm btn-outline-success';
    button.type = 'button';
    button.textContent = topic.label;
    button.addEventListener('click', () => reply(topic.label));
    widget.querySelector('#help-quick').append(button);
  });

  addMessage('Здравствуйте! Я отвечаю на частые вопросы о маршрутах и подготовке. Выберите вопрос ниже или напишите свой.');
  widget.querySelector('#help-form').addEventListener('submit', event => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    reply(question);
    input.value = '';
  });

  open.addEventListener('click', () => dialog.showModal());
  dialog.addEventListener('close', () => open.focus());
})();
