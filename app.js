(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const PROJECT = 'Верхне-Колпинская площадь';

/* ---------- icons and buttons ---------- */
const ICON = {
  tick: '<svg viewBox="0 0 16 16"><path d="M3 8.5l3.5 3.5L13 4.5"></path></svg>',
  cross: '<svg viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8"></path></svg>',
  info: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5"></circle><path d="M8 7.5v4M8 4.6v.2"></path></svg>',
  pencil: '<svg viewBox="0 0 16 16"><path d="M3 13l1-4 7-7 3 3-7 7-4 1z"></path><path d="M10 3l3 3"></path></svg>',
  left: '<svg viewBox="0 0 16 16"><path d="M10 3l-5 5 5 5"></path></svg>',
  right: '<svg viewBox="0 0 16 16"><path d="M6 3l5 5-5 5"></path></svg>'
};
const iconBtn = (icon, cls = '', attrs = '') => `<a class="btn small icon${cls ? ' ' + cls : ''}"${attrs ? ' ' + attrs : ''}>${ICON[icon]}</a>`;

/* ---------- section and panel builders ---------- */
function buildSection(label, variants, children) {
  const sec = el('<div class="section"></div>');
  sec.appendChild(el(`<span class="sec-l">${esc(label)}</span>`));
  const nodes = children.filter(c => c.nodeType === 1);
  if (variants && variants.length) {
    const r = el('<span class="sec-r"></span>');
    variants.forEach((v, i) => {
      if (i) r.appendChild(document.createTextNode(' / '));
      r.appendChild(el(`<a${i === 0 ? ' class="b"' : ''} href="#" data-action="variant:${esc(v.key)}">${esc(v.name)}</a>`));
    });
    sec.appendChild(r);
    const wrap = el('<div class="stack-8"></div>');
    const vs = el('<div class="variants"></div>');
    wrap.appendChild(vs);
    let first = true;
    nodes.forEach(c => {
      if (c.hasAttribute('data-variant')) { c.hidden = !first; first = false; vs.appendChild(c); }
      else wrap.appendChild(c);
    });
    sec.appendChild(wrap);
  } else {
    nodes.forEach(c => sec.appendChild(c));
  }
  return sec;
}
function buildPanel(title, children) {
  const p = el('<div class="box bd-1d stack-8"></div>');
  p.appendChild(el(`<h2 class="t-m b">${esc(title)}</h2>`));
  children.filter(c => c.nodeType === 1).forEach(c => p.appendChild(c));
  return p;
}
const parseVariants = s => s ? s.split(',').map(p => { const [name, key] = p.split(':'); return { name: name.trim(), key: (key || name).trim() }; }) : null;

/* ---------- shared content ---------- */
const li = (t, m) => `<li><div>${t}</div><div class="t-s sec">${m}</div></li>`;
const HIST_COMMON = [
  ['Как устроена работа с геологическими источниками', 'Общий диалог · 8 сообщений · Сегодня'],
  ['Сравнение методов пространственного прогнозирования', 'Общий диалог · 12 сообщений · Сегодня'],
  ['Требования к описанию геологических доказательств', 'Общий диалог · 7 сообщений · Вчера'],
  ['Обзор нормативных и методических материалов', 'Общий диалог · 6 сообщений · Вчера'],
  ['Геологическая интерпретация Северного Таймыра', 'Общий диалог · 10 сообщений · 17.10.2026']
];
const HIST_FULL = [
  ['Как устроена работа с геологическими источниками', 'Общий диалог · 8 сообщений · Сегодня'],
  ['Сравнение методов пространственного прогнозирования', 'Общий диалог · 12 сообщений · Сегодня'],
  ['Карта Верхне-Колпинской площади: разломы и рудные точки', 'Верхне-Колпинская площадь · 11 сообщений · Сегодня'],
  ['Требования к описанию геологических доказательств', 'Общий диалог · 7 сообщений · Вчера'],
  ['Согласование ролей геопространственных слоёв', 'Верхне-Колпинская площадь · 9 сообщений · Вчера'],
  ['Обзор нормативных и методических материалов', 'Общий диалог · 6 сообщений · Вчера'],
  ['Контроль разрешения расчётной сетки', 'Верхне-Колпинская площадь · 12 сообщений · 19.10.2026'],
  ['Геологическая интерпретация Северного Таймыра', 'Общий диалог · 10 сообщений · 17.10.2026'],
  ['Атрибутивная структура геотизера', 'Лекын-Тальбейская площадь · 8 сообщений · 14.10.2026']
];
const histList = (key, items) => el(`<div class="stack-8" data-variant="${key}"><h2 class="t-m b">История диалогов</h2><ul class="list plain">${items.map(i => li(i[0], i[1])).join('')}</ul></div>`);
const inputBox = pro => `<div class="box bd-1d lines-6 col-8"><div class="row-8 bottom between"><div class="row-8"><a class="btn small" href="#" data-action="agent">Агент</a>${pro ? '<span class="btn small">Школа</span><span class="btn small">Модель</span>' : ''}</div><span class="btn small sel">Отправить</span></div></div>`;

/* ---------- block templates: (data, placeholder) -> html string or element ---------- */
const T = {};
T.topbar = () => `<nav class="topbar"><a class="title" href="#main">GEOcursor</a><div class="row-8"><span class="btn small">Корпус</span><span class="btn small">Команда</span><span class="btn small">Настройки</span><a class="btn small" href="#login">Выход</a><a class="btn small meta" href="#main">Главная</a><a class="btn small meta" href="#ui">UI</a></div></nav>`;

T.catalogue = ({ state = 'none' }) => {
  if (state === 'collapsed') return `<div class="col-8">${iconBtn('right', 'sel')}</div>`;
  const head = `<div class="row-8 between"><h1 class="t-l b">Проекты</h1>${iconBtn('left')}</div>`;
  if (state === 'empty') return `<div class="box bd-2s col-8"><div class="stack-16">${head}<a class="btn start" href="#new-project">+</a></div></div>`;
  const dead = n => `<span class="btn wide">${n}</span>`;
  const cur = state === 'selected' ? `<a class="btn wide sel">${PROJECT}</a>` : `<a class="btn wide" href="#project">${PROJECT}</a>`;
  const group = (t, items) => `<div class="stack-8"><h2 class="t-m b">${t}</h2>${items.join('')}</div>`;
  return `<div class="box bd-2s col-8"><div class="stack-16">${head}${group('Закреплённые', [dead('Хибины'), dead('Ковдор'), cur])}${group('Командные', [dead('Норильск'), dead('Удачная'), dead('Попигай')])}${group('Недавние', [dead('Путорана'), dead('Кузбасс'), dead('Ямал'), dead('Таймыр')])}</div><a class="btn bottom self-end" href="#new-project">+</a></div>`;
};

T['project-head'] = ({ tab = 'overview' }) => {
  const tabs = [['overview', 'Обзор', '#project'], ['geotiser', 'Геотизер', '#project-geotiser'], ['map', 'Карта', '#project-map']];
  const t = tabs.map(([k, n, h]) => k === tab ? `<a class="btn small sel">${n}</a>` : `<a class="btn small" href="${h}">${n}</a>`).join('');
  const e = tab === 'edit' ? iconBtn('pencil', 'sel') : iconBtn('pencil', '', 'href="#project-edit"');
  return `<div class="row-8 between"><div class="row-8"><h1 class="t-l b">${PROJECT}</h1><a class="btn small sel">PUB</a></div><div class="row-8">${t}${e}</div></div>`;
};

T['chat-input'] = () => buildSection('Chat', [{ name: 'clean', key: 'clean' }, { name: 'prosumer', key: 'prosumer' }], [el(`<div data-variant="clean">${inputBox(false)}</div>`), el(`<div data-variant="prosumer">${inputBox(true)}</div>`)]);
T['chats-history'] = () => buildSection('Chats history', [{ name: 'common', key: 'common' }, { name: 'full', key: 'full' }], [histList('common', HIST_COMMON), histList('full', HIST_FULL)]);

T.chat = ({ form = 'main' }, ph) => {
  const box = el(`<div class="box bd-2s ${form === 'classic' ? 'chatcol' : 'stack-16'}"><h1 class="t-l b">Здравствуй, кожаный мешок</h1></div>`);
  const kids = Array.from(ph.childNodes).filter(k => k.nodeType === 1);
  if (form === 'classic') {
    const log = el('<div class="stack-8 chatlog"></div>');
    kids.forEach(k => log.appendChild(k));
    box.appendChild(buildSection('Conversation', null, [log]));
    box.appendChild(T['chat-input']());
  } else {
    box.appendChild(T['chat-input']());
    if (form === 'welcome') kids.forEach(k => box.appendChild(k));
    else box.appendChild(T['chats-history']());
  }
  return box;
};

T.corpustile = d => `<div class="corpus stack-8"><div class="t-s clamp-3">${esc(d.name)}</div><div class="row-8"><div class="fileicon"><div class="b">${esc(d.fmt)}</div><div>${esc(d.pct)}%</div></div><div><div class="t-s sec clamp-1">${esc(d.owner)}</div><div class="t-s sec">${esc(d.date)}</div></div></div></div>`;
T.doctile = d => `<div class="stack-8">${T.corpustile(d)}<div class="row-8">${iconBtn('tick', d.checked === '1' ? 'sel' : '', 'href="#" data-action="draft:accept"')}${iconBtn('cross', '', 'href="#" data-action="draft:exclude"')}${iconBtn('info', '', 'href="#document"')}</div></div>`;
T.section = (d, ph) => buildSection(d.label || '', parseVariants(d.variants), Array.from(ph.childNodes));
T.panel = (d, ph) => buildPanel(d.title || '', Array.from(ph.childNodes));

function render() {
  for (let pass = 0; pass < 6; pass++) {
    const list = $$('[data-block]');
    if (!list.length) break;
    list.forEach(ph => {
      if (!ph.isConnected) return;
      const fn = T[ph.dataset.block];
      if (!fn) return;
      const out = fn(ph.dataset, ph);
      ph.replaceWith(typeof out === 'string' ? el(out) : out);
    });
  }
}

/* ---------- map ---------- */
const map = { mode: 'source', layers: { licence: true, geology: true, faults: true, magnetism: false, ore: true, model: false } };
const FEATURE_INFO = {
  'Лицензионный контур': 'Контур площади · 33,1 км². По нему задаётся расчётная область.',
  'Разрывные нарушения': 'Показаны разломы. В материалах площади учтено 14 линейных объектов.',
  'Магнитное поле': 'В материалах площади — 8 381 точка магнитной съёмки.',
  'Рудная точка': 'Точки опробования используются для обучения.',
  'Модельное наложение': 'Вид представления модельных результатов поверх геологических слоёв.'
};
function drawMap() {
  const host = $('[data-map]');
  if (!host) return;
  const s = map.layers, model = map.mode !== 'source' && s.model;
  const points = Array.from({ length: 45 }, (_, i) => `<circle cx="${75 + i * 47 % 470}" cy="${48 + i * 83 % 242}" r="2" data-feature="Магнитное поле"/>`).join('');
  host.innerHTML = `<svg class="map" id="map-scheme" viewBox="0 0 640 348" role="img" aria-label="Условная схема геологических слоёв" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round">
${s.geology ? '<g stroke-width="1" stroke-dasharray="0 2" fill="#fff"><path d="M60 40L280 18L327 135L196 210L63 144Z"/><path d="M319 26L550 64L577 201L341 244L218 196L326 134Z"/><path d="M108 238L233 208L335 246L551 219L577 316L117 321Z"/></g>' : ''}
${s.licence ? '<path data-feature="Лицензионный контур" d="M130 63L424 42L526 142L478 282L203 307L95 201Z" stroke-width="2"/>' : ''}
${s.faults ? '<g data-feature="Разрывные нарушения" stroke-width="1"><path d="M97 302L221 211L292 160L444 35"/><path d="M204 20L282 113L397 229L500 331"/><path d="M42 174L205 139L376 100L599 75"/></g>' : ''}
${s.magnetism ? `<g fill="#000" stroke="none">${points}</g>` : ''}
${s.ore ? '<g fill="#fff" stroke-width="2"><circle data-feature="Рудная точка" cx="256" cy="158" r="7"/><circle data-feature="Рудная точка" cx="381" cy="184" r="7"/><circle data-feature="Рудная точка" cx="307" cy="222" r="7"/></g>' : ''}
${model ? '<g stroke-width="2" stroke-dasharray="0 4" pointer-events="all"><rect x="230" y="103" width="52" height="45" data-feature="Модельное наложение"/><rect x="282" y="103" width="52" height="45" data-feature="Модельное наложение"/><rect x="334" y="148" width="52" height="45" data-feature="Модельное наложение"/><rect x="282" y="193" width="52" height="45" data-feature="Модельное наложение"/></g>' : ''}
<text x="12" y="336" fill="#000" stroke="none" font-size="11">ВЕРХНЕ-КОЛПИНСКАЯ ПЛОЩАДЬ · СХЕМА СЛОЁВ</text></svg>`;
  $$('[data-map-modes] [data-action]').forEach(a => a.classList.toggle('sel', a.dataset.action === 'map:' + map.mode));
  $$('[data-map-layers] [data-action]').forEach(a => a.classList.toggle('sel', !!s[a.dataset.action.slice(6)]));
}

/* ---------- dialog ---------- */
function pop(title, body) {
  const d = el(`<div class="pop"><div class="dialog box bd-2s stack-16" role="dialog" aria-modal="true"><div class="row-8 between"><h2 class="t-m b">${esc(title)}</h2><a class="btn small" data-action="dismiss" href="#">Закрыть</a></div><div class="stack-8">${body}</div></div></div>`);
  d.addEventListener('click', e => { if (e.target === d) d.remove(); });
  document.body.appendChild(d);
}
const closePop = () => { const p = $('.pop'); if (p) p.remove(); };
const agentSelect = () => pop('Выбор агента', `<p>Выберите предметного агента для работы с материалами и диалогами.</p><div class="stack-8">${['Геолог', 'Геофизик', 'Геохимик', 'Структурный геолог', 'Агент ДЗЗ'].map(a => `<a class="btn" href="#" data-action="choose-agent:${a}">${a}</a>`).join('')}</div>`);

/* ---------- hotspot hint ---------- */
function flashHint() {
  const s = $('.screen:target') || $('#login');
  const active = $$('[data-action],a[href^="#"]:not([href="#"])', s).filter(x => x.getClientRects().length && getComputedStyle(x).visibility !== 'hidden' && !x.classList.contains('meta') && !x.closest('.sec-r'));
  const bar = $('.topbar');
  if (bar && getComputedStyle(bar).display !== 'none') active.push(...$$('a[href]:not(.meta)', bar));
  for (const x of new Set(active)) { x.classList.remove('flash'); void x.offsetWidth; x.classList.add('flash'); setTimeout(() => x.classList.remove('flash'), 350); }
}

/* ---------- logs ---------- */
const scrollLogs = () => $$('.chatlog').forEach(l => { l.scrollTop = l.scrollHeight; });

/* ---------- gate ---------- */
const HASH = '439c75e45e331b78fcc41a9304d4e8b6de8aa650824c759a43dbfa26e86dad42';
const KEY = 'geocursor.unlock', TTL = 60 * 24 * 3600 * 1000;
const store = { get() { try { return Number(localStorage.getItem(KEY) || 0); } catch (e) { return 0; } }, set() { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} } };
const isLocked = () => { const v = store.get(); return !(v && Date.now() - v < TTL); };
async function unlock() {
  const inp = $('#gate-pass'), err = $('#gate-error');
  if (!inp) return;
  let hex = '';
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(inp.value));
    hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) { hex = ''; }
  if (hex === HASH) { store.set(); document.body.classList.remove('locked'); err.hidden = true; inp.value = ''; scrollLogs(); }
  else { err.hidden = false; inp.select(); }
}

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-action]');
  if (t) {
    e.preventDefault();
    const a = t.dataset.action;
    if (a.startsWith('variant:')) {
      const v = a.slice(8), sec = t.closest('.section');
      if (sec) { $$('.sec-r a', sec).forEach(x => x.classList.toggle('b', x === t)); $$('[data-variant]', sec).forEach(x => { x.hidden = x.dataset.variant !== v; }); }
    }
    else if (a === 'agent') agentSelect();
    else if (a.startsWith('choose-agent:')) { const n = a.slice(13); closePop(); $$('[data-action="agent"]').forEach(x => { x.textContent = 'Агент: ' + n; }); }
    else if (a === 'dismiss') closePop();
    else if (a.startsWith('expand:')) {
      const sec = t.closest('[data-summary-section]');
      if (sec) { sec.classList.toggle('is-expanded'); const on = sec.classList.contains('is-expanded'); t.textContent = on ? (t.dataset.collapse || 'Свернуть') : (t.dataset.expand || 'Развернуть'); }
    }
    else if (a.startsWith('map:')) { map.mode = a.slice(4); map.layers.model = map.mode !== 'source'; drawMap(); }
    else if (a.startsWith('layer:')) { const id = a.slice(6); map.layers[id] = !map.layers[id]; if (id === 'model' && map.layers.model && map.mode === 'source') map.mode = 'combined'; drawMap(); }
    else if (a.startsWith('gis:')) {
      const n = a.slice(4), g = t.closest('[data-gis]');
      if (g) { $$('[data-action]', g).forEach(x => x.classList.toggle('sel', x === t)); const c = $('[data-gis-caption]', g.parentElement); if (c) c.textContent = 'Источник: ' + n; }
    }
    else if (a.startsWith('draft:')) { const row = t.closest('.row-8'); const tick = row && $('[data-action="draft:accept"]', row); if (tick) tick.classList.toggle('sel', a === 'draft:accept'); }
    else if (a === 'unlock') unlock();
    return;
  }
  const f = e.target.closest('#map-scheme [data-feature]');
  if (f) { const c = $('#map-feature'); if (c) c.textContent = f.dataset.feature + ' — ' + (FEATURE_INFO[f.dataset.feature] || 'Элемент схематичной карты'); return; }
  if (e.target.closest('a[href^="#"]:not([href="#"])')) return;
  if (e.target.closest('.pop, .gate')) return;
  flashHint();
}, true);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePop();
  if (e.key === 'Enter' && e.target && e.target.id === 'gate-pass') { e.preventDefault(); unlock(); }
});
window.addEventListener('hashchange', scrollLogs);
window.addEventListener('load', scrollLogs);

/* ---------- init ---------- */
render();
drawMap();
if (isLocked()) { document.body.classList.add('locked'); const inp = $('#gate-pass'); if (inp) inp.focus(); }
scrollLogs();
})();
