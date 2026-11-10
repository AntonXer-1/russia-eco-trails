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
      const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.jpg':'image/jpeg'};
      res.setHeader('Content-Type', mime[path.extname(file)] || 'text/plain');
      res.end(await fs.readFile(file));
    } catch {res.writeHead(404).end('Not found');}
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = process.env.SITE_URL || `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch();
});
after(async () => {await browser?.close(); await new Promise(resolve => server?.close(resolve));});

for (const file of ['index.html','catalog.html','route.html','preparation.html']) {
  test(`${file}: resources, links, responsive layout and sticky header`, async () => {
    const page = await browser.newPage(); const errors = [], external = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', req => {if (!req.url().startsWith(base)) external.push(req.url());});
    await page.goto(base + file);
    assert.equal(await page.locator('main').count(), 1);
    assert.equal(await page.locator('h1').count(), 1);
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
      await page.evaluate(()=>scrollTo(0,0));
    }
    assert.deepEqual(errors,[]); assert.deepEqual(external,[]);
    if (process.env.SCREENSHOT_DIR) await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,file+'.png'),fullPage:true});
    await page.close();
  });
}

test('search, combined filters, no results and reset', async () => {
  const p=await browser.newPage(); await p.goto(base+'catalog.html');
  assert.equal(await p.locator('.route-item:visible').count(),6);
  await p.locator('#search').fill('  БАДУК  ');
  assert.equal(await p.locator('.route-item:visible').count(),1);
  await p.locator('#difficulty').selectOption('easy');
  assert.equal(await p.locator('#empty-results').isVisible(),true);
  await p.getByRole('button',{name:'Сбросить'}).click();
  await p.waitForFunction(()=>[...document.querySelectorAll('.route-item')].every(n=>!n.hidden));
  assert.equal(await p.locator('.route-item:visible').count(),6);
  await p.locator('#distance').selectOption('short');
  assert.equal(await p.locator('.route-item:visible').count(),3);
  await p.locator('#difficulty').selectOption('easy');
  assert.equal(await p.locator('.route-item:visible').count(),3);
  await p.locator('#search').fill('несуществующий маршрут');
  assert.equal(await p.locator('#empty-results').isVisible(),true);
  await p.close();
});

test('each catalog link opens its own route and unknown id is handled', async () => {
  const p=await browser.newPage(); await p.goto(base+'catalog.html');
  const links=await p.locator('.route-item a').evaluateAll(ns=>ns.map(n=>({href:n.getAttribute('href'),title:n.closest('article').querySelector('h2').textContent})));
  for(const link of links){await p.goto(base+link.href);assert.equal(await p.locator('h1').textContent(),link.title);}
  await p.goto(base+'route.html?id=unknown');
  assert.equal(await p.locator('#route-error').isVisible(),true);
  assert.equal(await p.locator('#route-details').isVisible(),false);
  await p.close();
});

test('modal preselects route, validates form, reports demo success without sending', async () => {
  const p=await browser.newPage(); const sent=[];
  p.on('request',r=>{if(r.method()!=='GET')sent.push(r.url());});
  await p.goto(base+'route.html?id=laleto');
  await p.getByRole('button',{name:'Задать вопрос о маршруте'}).click();
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
  assert.equal(await p.getByRole('button',{name:'Задать вопрос о маршруте'}).evaluate(e=>e===document.activeElement),true);
  await p.getByRole('button',{name:'Задать вопрос о маршруте'}).click();
  await p.waitForFunction(()=>document.activeElement?.id==='feedbackModal');
  assert.equal(await p.locator('#form-result').isVisible(),false);
  assert.deepEqual(sent,[]);await p.close();
});

test('mobile menu, FAQ and packing checklist respond to input', async () => {
  const p=await browser.newPage({viewport:{width:375,height:750}});await p.goto(base);
  await p.getByRole('button',{name:'Открыть меню'}).click();
  await p.locator('#site-menu.show').waitFor();
  assert.equal(await p.getByRole('link',{name:'Каталог',exact:true}).first().isVisible(),true);
  await p.getByRole('button',{name:'Нужно ли проверять доступность маршрута?'}).click();
  await p.locator('#faq-one.show').waitFor();
  await p.goto(base+'preparation.html');
  await p.getByRole('checkbox',{name:'Вода и перекус'}).check();
  assert.equal(await p.getByRole('checkbox',{name:'Вода и перекус'}).isChecked(),true);
  await p.close();
});

test('without JavaScript content remains and submit stays disabled', async () => {
  const context=await browser.newContext({javaScriptEnabled:false}); const p=await context.newPage();
  await p.goto(base+'catalog.html');assert.equal(await p.locator('.route-item').count(),6);
  await p.goto(base+'route.html?id=laleto');assert.equal(await p.locator('noscript').isVisible(),true);
  assert.equal(await p.locator('[type=submit]').isDisabled(),true);await context.close();
});
