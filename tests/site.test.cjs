const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
let browser, server, base;
before(async () => {
  const root = path.resolve(__dirname, '..');
  server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)));
      if (!file.startsWith(root + path.sep)) {res.writeHead(403).end(); return;}
      const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.jpg':'image/jpeg','.svg':'image/svg+xml'};
      res.setHeader('Content-Type', mime[path.extname(file)] || 'text/plain');
      res.end(await fs.readFile(file));
    } catch {res.writeHead(404).end('Not found');}
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = process.env.SITE_URL || `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch();
});
after(async () => {await browser?.close(); await new Promise(resolve => server?.close(resolve));});

const mapWidget = 'https://yandex.ru/map-widget/v1/';
const mockMap = page => page.route(mapWidget + '**', route => route.fulfill({body: 'Map'}));
const breadcrumbs = {
  'index.html': [],
  'catalog.html': ['Главная', 'Каталог'],
  'route.html': ['Главная', 'Каталог', 'Бадукские озёра'],
  'preparation.html': ['Главная', 'Подготовка'],
  'about.html': ['Главная', 'О проекте'],
  'account.html': ['Главная', 'Личный кабинет'],
  'favorites.html': ['Главная', 'Избранное']
};

for (const [file, expectedCrumbs] of Object.entries(breadcrumbs)) {
  test(`${file}: resources, links, responsive layout and sticky header`, async () => {
    const page = await browser.newPage(); const errors = [], external = [];
    await mockMap(page);
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', req => {if (!req.url().startsWith(base)) external.push(req.url());});
    await page.goto(base + file);
    assert.equal(await page.locator('main').count(), 1);
    assert.equal(await page.locator('h1').count(), 1);
    const crumbs = page.locator('main .breadcrumb');
    assert.deepEqual(await crumbs.locator('li').allTextContents(), expectedCrumbs);
    if (expectedCrumbs.length) {
      assert.equal(await crumbs.locator('a').first().getAttribute('href'), 'index.html');
      assert.equal(await crumbs.locator('li').last().getAttribute('aria-current'), 'page');
      assert.equal(await crumbs.locator('li').last().locator('a').count(), 0);
    }
    assert.equal(await page.locator('footer .footer-brand img').count(), 1);
    assert.equal(await page.locator('footer').getByText('Экотропы. Открой природу пешком.', {exact: true}).count(), 1);
    assert.equal(await page.locator('footer a[href="mailto:antonmister6@gmail.com"]').count(), 1);
    assert.equal(await page.locator('footer a[href="tel:+79582009066"]').count(), 1);
    const outside = await page.locator('a[href]').evaluateAll(links =>
      links.filter(link => /^https?:$/.test(link.protocol) && link.origin !== location.origin).map(link => link.href));
    assert.deepEqual(outside, [], 'site navigation stays on the site');
    assert.equal(await page.locator('footer span.contact-item').filter({hasText: 'Telegram @AntonXer'}).count(), 1);
    assert.equal(await page.locator('footer .contact-icon').count(), 4);
    assert.equal(await page.locator('footer').getByText('Часы связи: 09:00–20:00 (МСК)').count(), 1);
    await page.waitForFunction(() => [...document.querySelectorAll('footer .contact-icon use')]
      .every(icon => icon.getBBox().width > 0));
    assert.equal(await page.locator('footer').getByText('© 2026 Экотропы России · Все права защищены', {exact: true}).count(), 1);
    assert.deepEqual(await page.locator('header .nav-link').evaluateAll(links => links.map(link => link.getAttribute('href'))),
      ['index.html', 'catalog.html', 'preparation.html', 'about.html', 'favorites.html', 'account.html']);
    await page.locator('img').evaluateAll(nodes => nodes.forEach(n => n.loading = 'eager'));
    await page.waitForFunction(() => [...document.images].every(n => n.complete && n.naturalWidth > 0));
    const resources = await page.locator('img').evaluateAll(nodes => nodes.map(n => n.complete && n.naturalWidth > 0));
    assert.ok(resources.every(Boolean), 'all photographs load');
    for (const href of await page.locator('a[href],link[href],script[src]').evaluateAll(ns=>ns.map(n=>n.getAttribute('href') || n.getAttribute('src')))) {
      const url = new URL(href, base + file); if (!url.href.startsWith(base)) continue;
      assert.equal((await page.request.get(url.href)).status(), 200, href);
    }
    for (const width of [375,768,1280]) {
      await page.setViewportSize({width,height:600});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `overflow at ${width}`);
      await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
      assert.equal(await page.locator('header').evaluate(e=>Math.round(e.getBoundingClientRect().top)),0);
      await page.getByRole('link', {name: 'Наверх', exact: true}).click();
      await page.waitForFunction(() => scrollY === 0);
    }
    for (const selector of ['header .navbar-nav', '.footer-navigation']) {
      const box = await page.locator(selector).boundingBox();
      assert.ok(Math.abs(box.x + box.width / 2 - 640) <= 1, selector + ' is centered');
    }
    assert.deepEqual(errors, []);
    assert.equal(external.length, file === 'route.html' ? 1 : 0);
    assert.ok(external.every(url => url.startsWith(mapWidget)));
    if (process.env.SCREENSHOT_DIR) await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,file+'.png'),fullPage:true});
    await page.close();
  });
}

test('search, combined filters, no results and reset', async () => {
  const p=await browser.newPage(); await p.goto(base+'catalog.html');
  assert.equal(await p.locator('.route-item:visible').count(),9);
  await p.locator('#search').fill('  БАДУК  ');
  assert.equal(await p.locator('.route-item:visible').count(),1);
  await p.locator('#difficulty').selectOption('easy');
  assert.equal(await p.locator('#empty-results').isVisible(),true);
  await p.getByRole('button',{name:'Сбросить'}).click();
  await p.waitForFunction(()=>[...document.querySelectorAll('.route-item')].every(n=>!n.hidden));
  assert.equal(await p.locator('.route-item:visible').count(),9);
  await p.locator('#distance').selectOption('short');
  assert.equal(await p.locator('.route-item:visible').count(),5);
  await p.locator('#difficulty').selectOption('easy');
  assert.equal(await p.locator('.route-item:visible').count(),5);
  await p.locator('#search').fill('несуществующий маршрут');
  assert.equal(await p.locator('#empty-results').isVisible(),true);
  await p.close();
});

test('each catalog link opens its own route and unknown id is handled', async () => {
  const p=await browser.newPage(); await mockMap(p); await p.goto(base+'catalog.html');
  const links=await p.locator('.route-item a').evaluateAll(ns=>ns.map(n=>({href:n.getAttribute('href'),title:n.closest('article').querySelector('h2').textContent})));
  for (const link of links) {
    await p.goto(base + link.href);
    assert.equal(await p.locator('h1').textContent(), link.title);
    assert.equal(await p.locator('.breadcrumb [aria-current="page"]').textContent(), link.title);
  }
  await p.locator('.breadcrumb').getByRole('link', {name: 'Каталог'}).click();
  assert.equal(p.url(), base + 'catalog.html');
  await p.goto(base+'route.html?id=unknown');
  assert.equal(await p.locator('#route-error').isVisible(),true);
  assert.equal(await p.locator('#route-details').isVisible(),false);
  await p.close();
});

test('maps open automatically and mark the start of each route', async () => {
  const page = await browser.newPage({viewport: {width: 375, height: 800}});
  const starts = {
    baduk: '41.693075,43.375845',
    shumka: '41.730317,43.409851',
    sculptor: '92.73015,55.917567',
    laleto: '92.745867,55.951967',
    book: '92.7416,55.942233',
    white: '92.723167,55.916917',
    kazachiy: '41.285188,43.56018',
    siberia: '92.723667,55.916533',
    climate: '92.7768,55.946417'
  };
  await mockMap(page);
  for (const [id, start] of Object.entries(starts)) {
    await page.goto(base + 'route.html?id=' + id);
    const map = page.locator('#route-map');
    assert.equal(await page.locator('#show-map').count(), 0);
    const url = new URL(await map.getAttribute('src'));
    assert.equal(url.origin + url.pathname, mapWidget);
    assert.equal(url.searchParams.get('ll'), start);
    assert.equal(url.searchParams.get('pt'), start + ',pm2rdm');
    assert.equal(await map.isVisible(), true);
    const gallery = page.locator('.route-gallery');
    const photoCount = ['baduk', 'kazachiy', 'siberia', 'climate'].includes(id) ? 1 : 2;
    assert.equal(await gallery.locator('img').count(), photoCount);
    assert.equal(await gallery.locator('figcaption').count(), photoCount);
    await gallery.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await page.close();
});

test('modal preselects route, validates form, reports demo success without sending', async () => {
  const p=await browser.newPage(); const sent=[];
  await mockMap(p);
  p.on('request',r=>{if(r.method()!=='GET')sent.push(r.url());});
  await p.goto(base+'route.html?id=laleto');
  assert.equal(await p.locator('#route-about').textContent(), 'О маршруте');
  assert.equal(await p.locator('main #route-question').count(), 1);
  await p.locator('#route-question').click();
  await p.waitForFunction(()=>document.activeElement?.id==='feedbackModal');
  assert.equal(await p.locator('[name=route]').inputValue(),'laleto');
  await p.locator('[name=name]').fill('Антон');
  await p.locator('[name=email]').fill('wrong');
  await p.locator('[name=phone]').fill('9001234567');
  await p.getByRole('button',{name:'Проверить обращение'}).click();
  assert.equal(await p.locator('[name=email]').evaluate(e=>e.validity.typeMismatch),true);
  assert.equal(await p.locator('#form-result').isVisible(),false);
  await p.locator('[name=email]').fill('student@example.com');
  await p.getByRole('button',{name:'Проверить обращение'}).click();
  assert.equal(await p.locator('#form-result').isVisible(),false);
  await p.locator('[name=consent]').check();
  await p.getByRole('button',{name:'Проверить обращение'}).click();
  assert.match(await p.locator('#form-result').textContent(),/не отправлены/);
  await p.keyboard.press('Escape');
  await p.locator('#feedbackModal').waitFor({state:'hidden'});
  await p.waitForFunction(()=>document.activeElement?.id==='route-question');
  assert.equal(await p.locator('#route-question').evaluate(e=>e===document.activeElement),true);
  await p.locator('#route-question').click();
  await p.waitForFunction(()=>document.activeElement?.id==='feedbackModal');
  assert.equal(await p.locator('#form-result').isVisible(),false);
  assert.deepEqual(sent,[]);await p.close();
});

test('mobile menu, FAQ and packing checklist respond to input', async () => {
  const p=await browser.newPage({viewport:{width:375,height:750}});await p.goto(base);
  await p.getByRole('button',{name:'Открыть меню'}).click();
  await p.locator('#site-menu.show').waitFor();
  assert.equal(await p.getByRole('link',{name:'Каталог',exact:true}).first().isVisible(),true);
  const questions = p.locator('#faq button');
  assert.equal(await questions.count(), 8);
  for (const question of await questions.all()) {
    await question.click();
    const answer = await question.getAttribute('aria-controls');
    await p.locator('#' + answer + '.show').waitFor();
  }
  await p.goto(base+'preparation.html');
  await p.getByRole('checkbox',{name:'Вода и перекус'}).check();
  assert.equal(await p.getByRole('checkbox',{name:'Вода и перекус'}).isChecked(),true);
  await p.close();
});

test('without JavaScript content remains and submit stays disabled', async () => {
  const context=await browser.newContext({javaScriptEnabled:false}); const p=await context.newPage();
  await p.goto(base+'catalog.html');assert.equal(await p.locator('.route-item').count(),9);
  await p.goto(base+'route.html?id=laleto');assert.equal(await p.locator('noscript').isVisible(),true);
  assert.equal(await p.locator('[type=submit]').isDisabled(),true);await context.close();
});

test('theme persists and local accounts keep their own favorites and routes', async () => {
  const p = await browser.newPage({viewport: {width: 1280, height: 800}});
  await p.goto(base + 'index.html');
  await p.getByRole('button', {name: 'Тёмная тема'}).click();
  assert.equal(await p.locator('html').getAttribute('data-bs-theme'), 'dark');
  await p.goto(base + 'account.html');
  assert.equal(await p.locator('html').getAttribute('data-bs-theme'), 'dark');
  await p.locator('#account-name').fill('Походник');
  await p.locator('#account-login').fill('walker');
  await p.locator('#account-password').fill('DemoPassword123');
  await p.getByRole('button', {name: 'Создать профиль'}).click();
  await p.locator('#account-profile').waitFor();
  await p.goto(base + 'catalog.html');
  await p.getByRole('button', {name: 'В избранное: Казачий водопад', exact: true}).click();
  await p.goto(base + 'favorites.html');
  assert.equal(await p.locator('#favorite-list h2').textContent(), 'Казачий водопад');
  await p.goto(base + 'account.html');
  await p.locator('#personal-title').fill('Моя тропа');
  await p.locator('#personal-region').fill('Подмосковье');
  await p.locator('#personal-distance').fill('4.5');
  await p.getByRole('button', {name: 'Далее'}).click();
  await p.locator('#personal-description').fill('Прогулка вдоль лесной реки.');
  await p.getByRole('button', {name: 'Предпросмотр'}).click();
  await p.getByRole('button', {name: 'Сохранить маршрут'}).click();
  await p.reload();
  assert.equal(await p.locator('#personal-list h3').textContent(), 'Моя тропа');
  await p.getByRole('button', {name: 'Выйти'}).click();
  await p.goto(base + 'favorites.html');
  assert.equal(await p.locator('#favorites-login').isVisible(), true);
  await p.goto(base + 'account.html');
  await p.locator('#account-name').fill('Другой профиль');
  await p.locator('#account-login').fill('another_walker');
  await p.locator('#account-password').fill('AnotherPassword123');
  await p.getByRole('button', {name: 'Создать профиль'}).click();
  await p.locator('#account-profile').waitFor();
  assert.equal(await p.locator('#personal-empty').isVisible(), true);
  await p.goto(base + 'favorites.html');
  assert.equal(await p.locator('#favorites-empty').isVisible(), true);
  await p.goto(base + 'account.html');
  await p.getByRole('button', {name: 'Выйти'}).click();
  await p.locator('#account-login').fill('walker');
  await p.locator('#account-password').fill('WrongPassword');
  await p.getByRole('button', {name: 'Войти', exact: true}).click();
  await p.getByText('Проверьте логин и пароль.').waitFor();
  await p.locator('#account-password').fill('DemoPassword123');
  await p.getByRole('button', {name: 'Войти', exact: true}).click();
  await p.locator('#account-profile').waitFor();
  await p.goto(base + 'favorites.html');
  await p.getByRole('button', {name: 'Убрать из избранного: Казачий водопад', exact: true}).click();
  assert.equal(await p.locator('#favorites-empty').isVisible(), true);
  await p.close();
});

test('site help answers quick questions and free text without sending messages', async () => {
  const page = await browser.newPage({viewport: {width: 375, height: 600}});
  const external = [];
  page.on('request', request => {
    if (!request.url().startsWith(base)) external.push(request.url());
  });
  await page.goto(base + 'catalog.html');
  const toggle = page.getByRole('button', {name: 'Открыть помощника'});
  await toggle.click();
  const dialog = page.getByRole('dialog', {name: 'Помощник по маршрутам'});
  await dialog.getByRole('button', {name: 'Что взять с собой?', exact: true}).click();
  assert.equal(await dialog.getByRole('link', {name: 'Подготовка к прогулке'}).getAttribute('href'), 'preparation.html');

  const input = dialog.getByRole('textbox', {name: 'Ваш вопрос'});
  await input.fill('Нужен ли билет на Шумку?');
  await input.press('Enter');
  assert.equal(await dialog.getByRole('link', {name: 'Водопад Шумка'}).last().getAttribute('href'), 'route.html?id=shumka');
  await input.fill('А сколько идти?');
  await input.press('Enter');
  assert.equal(await dialog.getByText(/Время: 1 ч 30 мин на посещение/).count(), 1);

  await input.fill('Сколько идти по Заповедной Сибири?');
  await input.press('Enter');
  assert.equal(await dialog.getByRole('link', {name: 'Заповедная Сибирь'}).getAttribute('href'), 'route.html?id=siberia');
  assert.equal(await dialog.getByText(/Время: 40 мин/).count(), 1);

  await input.fill('<img src=x onerror=alert(1)>');
  await input.press('Enter');
  assert.equal(await dialog.locator('img').count(), 0);
  assert.equal(await dialog.getByRole('link', {name: 'Написать автору'}).getAttribute('href'), 'mailto:antonmister6@gmail.com');
  assert.deepEqual(external, []);

  await page.keyboard.press('Escape');
  await dialog.waitFor({state: 'hidden'});
  await page.waitForFunction(() => document.activeElement.id === 'help-open');
  await page.close();
});
