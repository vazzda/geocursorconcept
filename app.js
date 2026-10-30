(() => {
'use strict';
const queryFirst = (selectorText, rootElement = document) => rootElement.querySelector(selectorText);
const queryAllElements = (selectorText, rootElement = document) => Array.from(rootElement.querySelectorAll(selectorText));
const escapeHtml = rawTextValue => String(rawTextValue ?? '').replace(/[&<>"']/g, characterFound => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[characterFound]));
const elementFromHtml = htmlMarkup => { const templateElement = document.createElement('template'); templateElement.innerHTML = htmlMarkup.trim(); return templateElement.content.firstElementChild; };
const CURRENT_PROJECT_NAME = 'Верхне-Колпинская площадь';
const ROLE_DEFINITIONS = [
  { name: 'Геолог', desc: 'Роль по умолчанию для любых геологических вопросов общего характера.' },
  { name: 'Геофизик', desc: 'Магнитные, гравиметрические и электроразведочные данные, аномалии, геофизические разрезы и их интерпретация.' },
  { name: 'Геохимик', desc: 'Геохимические пробы, аномалии и ореолы рассеяния элементов, ассоциации, оценка перспективности.' },
  { name: 'Структурный геолог', desc: 'Разломы, складки и трещиноватость, кинематика нарушений, структурный контроль оруденения, тектонические схемы.' },
  { name: 'Агент ДЗЗ', desc: 'Космоснимки и аэрофотосъёмка, спектральные индексы, линеаменты, дешифрирование, мониторинг изменений территории.' }
];
let currentRoleName = 'Геолог';
const currentRoleLabel = () => 'Роль: ' + currentRoleName;

/* ---------- icons and buttons ---------- */
const ICON_MARKUP = {
  tick: '<svg viewBox="0 0 16 16"><path d="M3 8.5l3.5 3.5L13 4.5"></path></svg>',
  cross: '<svg viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8"></path></svg>',
  info: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5"></circle><path d="M8 7.5v4M8 4.6v.2"></path></svg>',
  pencil: '<svg viewBox="0 0 16 16"><path d="M3 13l1-4 7-7 3 3-7 7-4 1z"></path><path d="M10 3l3 3"></path></svg>',
  left: '<svg viewBox="0 0 16 16"><path d="M10 3l-5 5 5 5"></path></svg>',
  right: '<svg viewBox="0 0 16 16"><path d="M6 3l5 5-5 5"></path></svg>',
  book: '<svg viewBox="0 0 16 16"><path d="M8 4.5C6.5 3 4.5 2.5 2 2.5v10c2.5 0 4.5.5 6 2 1.5-1.5 3.5-2 6-2v-10c-2.5 0-4.5.5-6 2z"></path><path d="M8 4.5v10"></path></svg>',
  page: '<svg viewBox="0 0 16 16"><path d="M4 1.5h5l3 3v10H4z"></path><path d="M9 1.5v3h3"></path><path d="M6 8h4M6 10.5h4"></path></svg>'
};
const iconButtonHtml = (iconKeyName, extraClasses = '', extraAttributes = '') => `<a class="push-button size-small icon-button${extraClasses ? ' ' + extraClasses : ''}"${extraAttributes ? ' ' + extraAttributes : ''}>${ICON_MARKUP[iconKeyName]}</a>`;

/* ---------- section and panel builders ---------- */
function buildSection(sectionLabelText, variantList, childNodes, metaInfoText = '') {
  const sectionElement = elementFromHtml('<div class="named-section"></div>');
  sectionElement.appendChild(elementFromHtml(`<span class="section-label">${escapeHtml(sectionLabelText)}</span>`));
  const elementChildren = childNodes.filter(candidateNode => candidateNode.nodeType === 1);
  const metaElement = metaInfoText ? elementFromHtml(`<div class="design-meta">${escapeHtml(metaInfoText)}</div>`) : null;
  if (variantList && variantList.length) {
    const switcherElement = elementFromHtml('<span class="section-switcher"></span>');
    variantList.forEach((variantItem, variantIndex) => {
      if (variantIndex) switcherElement.appendChild(document.createTextNode(' / '));
      switcherElement.appendChild(elementFromHtml(`<a${variantIndex === 0 ? ' class="weight-bold"' : ''} href="#" data-action="variant:${escapeHtml(variantItem.key)}">${escapeHtml(variantItem.name)}</a>`));
    });
    sectionElement.appendChild(switcherElement);
    const bodyWrapper = elementFromHtml('<div class="vertical-stack-8"></div>');
    const variantContainer = elementFromHtml('<div class="variant-container"></div>');
    if (metaElement) bodyWrapper.appendChild(metaElement);
    bodyWrapper.appendChild(variantContainer);
    let isFirstVariant = true;
    elementChildren.forEach(childElement => {
      if (childElement.hasAttribute('data-variant')) { childElement.hidden = !isFirstVariant; isFirstVariant = false; variantContainer.appendChild(childElement); }
      else bodyWrapper.appendChild(childElement);
    });
    sectionElement.appendChild(bodyWrapper);
  } else if (metaElement) {
    const metaWrapper = elementFromHtml('<div class="vertical-stack-8"></div>');
    metaWrapper.appendChild(metaElement);
    elementChildren.forEach(childElement => metaWrapper.appendChild(childElement));
    sectionElement.appendChild(metaWrapper);
  } else {
    elementChildren.forEach(childElement => sectionElement.appendChild(childElement));
  }
  return sectionElement;
}
function buildPanel(panelTitleText, childNodes) {
  const panelElement = elementFromHtml('<div class="padded-box border-thin-dotted vertical-stack-8"></div>');
  panelElement.appendChild(elementFromHtml(`<h2>${escapeHtml(panelTitleText)}</h2>`));
  childNodes.filter(candidateNode => candidateNode.nodeType === 1).forEach(childElement => panelElement.appendChild(childElement));
  return panelElement;
}
const parseVariants = variantsText => variantsText ? variantsText.split(',').map(variantPair => { const [variantName, variantKey] = variantPair.split(':'); return { name: variantName.trim(), key: (variantKey || variantName).trim() }; }) : null;

/* ---------- shared content ---------- */
const listItemHtml = (itemTitleHtml, itemMetaHtml) => `<li><div>${itemTitleHtml}</div><div class="text-small text-secondary">${itemMetaHtml}</div></li>`;
const HIST_COMMON = [
  ['Как устроена работа с геологическими источниками', 'Общий диалог · 8 сообщений · Сегодня'],
  ['Сравнение методов пространственного прогнозирования', 'Общий диалог · 12 сообщений · Сегодня'],
  ['Требования к описанию геологических доказательств', 'Общий диалог · 7 сообщений · Вчера'],
  ['Обзор нормативных и методических материалов', 'Общий диалог · 6 сообщений · Вчера'],
  ['Геологическая интерпретация Северного Таймыра', 'Общий диалог · 10 сообщений · 17.10.2026']
];
const HISTORY_FULL = [
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
const historyListHtml = (variantKey, historyItems) => elementFromHtml(`<div class="vertical-stack-8" data-variant="${variantKey}"><h2>История диалогов</h2><ul class="bullet-list without-bullets">${historyItems.map(historyItem => listItemHtml(historyItem[0], historyItem[1])).join('')}</ul></div>`);
const chatInputHtml = isProsumer => `<div class="padded-box border-thin-dotted min-lines-six flex-column-8"><div class="horizontal-row-8 push-to-bottom justify-between"><div class="horizontal-row-8"><a class="push-button size-small" href="#" data-action="role" data-role-label>${currentRoleLabel()}</a>${isProsumer ? '<span class="push-button size-small">Школа</span><span class="push-button size-small">Модель</span>' : ''}</div><span class="push-button size-small selected-state">Отправить</span></div></div>`;

/* ---------- block templates: (data, placeholder) -> html string or element ---------- */
const blockTemplates = {};
blockTemplates.topbar = () => `<nav class="top-navigation"><a class="brand-title" href="#main">GEOcursor</a><div class="horizontal-row-8"><a class="push-button size-small" href="#corpus">Корпус</a><span class="push-button size-small">Команда</span><span class="push-button size-small">Настройки</span><a class="push-button size-small" href="#login">Выход</a><a class="push-button size-small design-meta" href="#main">Главная</a><a class="push-button size-small design-meta" href="#ui">UI</a></div></nav>`;

blockTemplates.catalogue = ({ state: catalogueState = 'none' }) => {
  if (catalogueState === 'collapsed') return `<div class="flex-column-8">${iconButtonHtml('right', 'selected-state')}</div>`;
  const headerHtml = `<div class="horizontal-row-8 justify-between"><h1>Проекты</h1>${iconButtonHtml('left')}</div>`;
  if (catalogueState === 'empty') return `<div class="padded-box border-thick-solid flex-column-8"><div class="vertical-stack-16">${headerHtml}<a class="push-button align-self-start" href="#" data-action="create">+</a></div></div>`;
  const deadProjectButton = projectName => `<span class="push-button size-small full-width">${projectName}</span>`;
  const currentProjectButton = catalogueState === 'selected' ? `<a class="push-button size-small full-width selected-state">${CURRENT_PROJECT_NAME}</a>` : `<a class="push-button size-small full-width" href="#project">${CURRENT_PROJECT_NAME}</a>`;
  const projectGroupHtml = (groupTitle, groupItems) => `<div class="vertical-stack-8"><h2>${groupTitle}</h2>${groupItems.join('')}</div>`;
  const catalogueLinks = { none: ['Архивные проекты'], selected: ['Архивные проекты'] }[catalogueState] || [];
  const catalogueLinksHtml = catalogueLinks.length ? `<ul class="bullet-list without-bullets">${catalogueLinks.map(linkTitleText => `<li><a class="text-underline">${linkTitleText}</a></li>`).join('')}</ul>` : '';
  return `<div class="padded-box border-thick-solid flex-column-8"><div class="vertical-stack-16">${headerHtml}${projectGroupHtml('Закреплённые', [deadProjectButton('Хибины'), deadProjectButton('Ковдор'), currentProjectButton])}${projectGroupHtml('Командные', [deadProjectButton('Норильск'), deadProjectButton('Удачная'), deadProjectButton('Попигай')])}${projectGroupHtml('Недавние', [deadProjectButton('Путорана'), deadProjectButton('Кузбасс'), deadProjectButton('Ямал'), deadProjectButton('Таймыр')])}</div><div class="flex-column-8 push-to-bottom">${catalogueLinksHtml}<a class="push-button align-self-end" href="#" data-action="create">+</a></div></div>`;
};

const NAVIGATION_MENUS = {
  tech: [['corpus', 'Корпус'], ['collections', 'Коллекции'], ['knowledge', 'База знаний']],
  admin: [['admin', 'Управление корпусом'], ['admin-accounts', 'Управление аккаунтами / подписками']]
};
blockTemplates['navigation-menu'] = ({ menu: menuKeyName = 'tech', current: currentScreenKey = '' }) => `<div class="padded-box border-thick-solid flex-column-8"><ul class="navigation-list">${(NAVIGATION_MENUS[menuKeyName] || []).map(([screenKeyName, entryTitleText]) => screenKeyName === currentScreenKey ? `<li class="selected-state"><a class="text-underline">${entryTitleText}</a></li>` : `<li><a class="text-underline" href="#${screenKeyName}">${entryTitleText}</a></li>`).join('')}</ul></div>`;

blockTemplates['project-head'] = ({ tab: activeTabKey = 'overview' }) => {
  const tabDefinitions = [['overview', 'Обзор', '#project'], ['geotiser', 'Геотизер', '#project-geotiser'], ['map', 'Карта', '#project-map']];
  const tabButtonsHtml = tabDefinitions.map(([tabKeyName, tabTitleText, tabTargetHref]) => tabKeyName === activeTabKey ? `<a class="push-button size-small selected-state">${tabTitleText}</a>` : `<a class="push-button size-small" href="${tabTargetHref}">${tabTitleText}</a>`).join('');
  const editButtonHtml = iconButtonHtml('pencil');
  return `<div class="horizontal-row-8 justify-between"><div class="horizontal-row-8"><h1>${CURRENT_PROJECT_NAME}</h1><a class="push-button size-small selected-state">PUB</a></div><div class="horizontal-row-8">${tabButtonsHtml}${editButtonHtml}</div></div>`;
};

blockTemplates['chat-input'] = () => buildSection('Chat', [{ name: 'clean', key: 'clean' }, { name: 'prosumer', key: 'prosumer' }], [elementFromHtml(`<div data-variant="clean">${chatInputHtml(false)}</div>`), elementFromHtml(`<div data-variant="prosumer">${chatInputHtml(true)}</div>`)]);
blockTemplates['chats-history'] = () => buildSection('Chats history', [{ name: 'common', key: 'common' }, { name: 'full', key: 'full' }], [historyListHtml('common', HIST_COMMON), historyListHtml('full', HISTORY_FULL)]);

blockTemplates.chat = ({ form: chatFormKey = 'main' }, placeholderElement) => {
  const chatBoxElement = elementFromHtml(`<div class="padded-box border-thick-solid ${chatFormKey === 'classic' ? 'chat-column' : 'vertical-stack-16'}"><h1>Здравствуй, кожаный мешок</h1></div>`);
  const placeholderChildren = Array.from(placeholderElement.childNodes).filter(candidateNode => candidateNode.nodeType === 1);
  if (chatFormKey === 'classic') {
    const messagesElement = elementFromHtml('<div class="vertical-stack-8 chat-messages"></div>');
    placeholderChildren.forEach(childElement => messagesElement.appendChild(childElement));
    chatBoxElement.appendChild(buildSection('Conversation', null, [messagesElement]));
    chatBoxElement.appendChild(blockTemplates['chat-input']());
  } else {
    chatBoxElement.appendChild(blockTemplates['chat-input']());
    if (chatFormKey === 'welcome') placeholderChildren.forEach(childElement => chatBoxElement.appendChild(childElement));
    else chatBoxElement.appendChild(blockTemplates['chats-history']());
  }
  return chatBoxElement;
};

blockTemplates.corpustile = tileDataset => `<div class="corpus-tile vertical-stack-8"><div class="text-small clamp-three-lines">${escapeHtml(tileDataset.name)}</div><div class="horizontal-row-8"><div class="file-format-icon"><div class="weight-bold">${escapeHtml(tileDataset.fmt)}</div><div>${escapeHtml(tileDataset.pct)}%</div></div><div><div class="text-small text-secondary clamp-one-line">${escapeHtml(tileDataset.owner)}</div><div class="text-small text-secondary">${escapeHtml(tileDataset.date)}</div></div></div></div>`;
blockTemplates.doctile = tileDataset => `<div class="vertical-stack-8">${blockTemplates.corpustile(tileDataset)}<div class="horizontal-row-8">${iconButtonHtml('tick', tileDataset.checked === '1' ? 'selected-state' : '', 'href="#" data-action="draft:accept"')}${iconButtonHtml('cross', '', 'href="#" data-action="draft:exclude"')}${iconButtonHtml('info', '', 'href="#document"')}</div></div>`;
blockTemplates['literature-tile'] = ({ name: tileNameText = '', icon: tileIconKey = 'page', open: dialogKeyName = '' }) => {
  const tileInnerHtml = `<span class="literature-icon">${ICON_MARKUP[tileIconKey] || ICON_MARKUP.page}</span><span class="text-small clamp-two-lines">${escapeHtml(tileNameText)}</span>`;
  return dialogKeyName ? `<a class="corpus-tile literature-row" href="#" data-action="literature:${escapeHtml(dialogKeyName)}">${tileInnerHtml}</a>` : `<div class="corpus-tile literature-row">${tileInnerHtml}</div>`;
};
function buildProfileCard(cardTitleText, cardSentenceText, placeholderElement) {
  const cardElement = elementFromHtml(`<div class="vertical-stack-8"><h2>${escapeHtml(cardTitleText)}</h2><p>${escapeHtml(cardSentenceText)}</p><div class="tiles-grid"></div></div>`);
  const tilesGridElement = cardElement.lastElementChild;
  Array.from(placeholderElement.childNodes).filter(candidateNode => candidateNode.nodeType === 1).forEach(childElement => tilesGridElement.appendChild(childElement));
  return cardElement;
}
blockTemplates['agent-card'] = ({ agent: agentRoleName = '' }, placeholderElement) => {
  const roleDefinition = ROLE_DEFINITIONS.find(candidateRole => candidateRole.name === agentRoleName);
  return buildProfileCard(agentRoleName, roleDefinition ? roleDefinition.desc : '', placeholderElement);
};
const formatFigure = figureValue => figureValue.toFixed(2).replace('.', ',');
const benchmarkLineText = (benchmarkLabels, figureValues) => 'Бенчмарк: ' + benchmarkLabels.map((benchmarkLabelText, benchmarkLabelIndex) => benchmarkLabelText + ' ' + formatFigure(figureValues[benchmarkLabelIndex])).join(' · ');
const AGENT_BENCHMARK_LABELS = ['точность ответов', 'полнота ссылок', 'отказы вне корпуса'];
const MODEL_BENCHMARK_LABELS = ['совпадение с эталонной разметкой', 'покрытие признаков', 'отказы вне модели'];
const agentOption = (optionKeyName, optionNameText, optionText, figureValues) => ({ key: optionKeyName, name: optionNameText, text: optionText, benchmark: benchmarkLineText(AGENT_BENCHMARK_LABELS, figureValues) });
const modelOption = (optionKeyName, optionNameText, optionText, figureValues) => ({ key: optionKeyName, name: optionNameText, text: optionText, benchmark: benchmarkLineText(MODEL_BENCHMARK_LABELS, figureValues) });
const AGENT_SELECTION_SENTENCE = 'Активная версия агента для всех проектов платформы.';
const MODEL_SELECTION_SENTENCE = 'Активная версия экспертной модели для всех проектов платформы.';
const PLATFORM_SELECTIONS = {
  'main-corpus': {
    title: 'Основной корпус',
    sentence: 'Основной корпус подключается ко всем проектам платформы по умолчанию; смена основного корпуса не затрагивает коллекции и корпуса проектов.',
    options: [
      { key: 'release-2026-1', name: 'Корпус 2026.1', text: 'Основной корпус текущего релиза: методическая литература, нормативы ГКЗ и материалы по 214 объектам; собран 12.10.2026.', benchmark: 'Бенчмарк: 1 842 документа · точность ответов 0,87 · полнота ссылок 0,91 · отказы вне корпуса 0,98' },
      { key: 'release-2025-4', name: 'Корпус 2025.4', text: 'Предыдущий релиз, сохранён для сравнения и воспроизведения отчётов 2025 года.', benchmark: 'Бенчмарк: 1 603 документа · точность ответов 0,82 · полнота ссылок 0,88 · отказы вне корпуса 0,95' },
      { key: 'experimental', name: 'Экспериментальный корпус', text: 'Сборка с расширенной геофизикой и ДЗЗ; не прошла приёмку, подключается только вручную.', benchmark: 'Бенчмарк: 2 310 документов · точность ответов 0,79 · полнота ссылок 0,84 · отказы вне корпуса 0,90' }
    ]
  },
  'agent-geologist': { title: 'Геолог', sentence: AGENT_SELECTION_SENTENCE, selected: 1, options: [
    agentOption('geologist-4-0', 'Геолог 4.0', 'Текущая версия: общие геологические вопросы, стратиграфия и литология, чтение геологических карт и разрезов.', [0.89, 0.92, 0.97]),
    agentOption('geologist-3-2', 'Геолог 3.2', 'Предыдущая версия без чтения разрезов; оставлена для воспроизведения отчётов начала 2026 года.', [0.85, 0.90, 0.96]),
    agentOption('geologist-3-1', 'Геолог 3.1 (архив)', 'Архивная версия 2025 года: отвечает только по тексту отчётов, карты не читает.', [0.80, 0.86, 0.93]),
    agentOption('geologist-maps', 'Экспериментальный: карты и разрезы', 'Сборка с распознаванием условных знаков на картах; не прошла приёмку.', [0.83, 0.84, 0.90])
  ] },
  'agent-geophysicist': { title: 'Геофизик', sentence: AGENT_SELECTION_SENTENCE, options: [
    agentOption('geophysicist-2-3', 'Геофизик 2.3', 'Магнитные, гравиметрические и электроразведочные данные, аномалии и геофизические разрезы.', [0.88, 0.90, 0.96]),
    agentOption('geophysicist-2-2', 'Геофизик 2.2', 'Предыдущая версия без электроразведки; оставлена для сравнения интерпретаций.', [0.84, 0.88, 0.95])
  ] },
  'agent-geochemist': { title: 'Геохимик', sentence: AGENT_SELECTION_SENTENCE, selected: 2, options: [
    agentOption('geochemist-3-0', 'Геохимик 3.0', 'Пробы, аномалии и ореолы рассеяния, ассоциации элементов, оценка перспективности площадей.', [0.88, 0.91, 0.97]),
    agentOption('geochemist-2-5', 'Геохимик 2.5', 'Предыдущая версия с поэлементной статистикой без ассоциаций элементов.', [0.84, 0.89, 0.95]),
    agentOption('geochemist-halos', 'Экспериментальный: ореолы', 'Сборка с автоматическим выделением ореолов по сетке проб; подключается только вручную.', [0.81, 0.85, 0.91])
  ] },
  'agent-structural': { title: 'Структурный геолог', sentence: AGENT_SELECTION_SENTENCE, selected: 1, options: [
    agentOption('structural-1-4', 'Структурный 1.4', 'Разломы, складки и трещиноватость, структурный контроль оруденения, тектонические схемы.', [0.87, 0.89, 0.95]),
    agentOption('structural-kinematics', 'Экспериментальный: кинематика', 'Сборка с оценкой кинематики нарушений по замерам; не прошла приёмку.', [0.80, 0.84, 0.90])
  ] },
  'agent-remote-sensing': { title: 'Агент ДЗЗ', sentence: AGENT_SELECTION_SENTENCE, selected: 2, options: [
    agentOption('remote-2-1', 'ДЗЗ 2.1', 'Космоснимки и аэрофотосъёмка, спектральные индексы, линеаменты, дешифрирование.', [0.87, 0.88, 0.94]),
    agentOption('remote-2-0', 'ДЗЗ 2.0', 'Предыдущая версия без мониторинга изменений территории.', [0.84, 0.86, 0.93]),
    agentOption('remote-1-8', 'ДЗЗ 1.8 (архив)', 'Архивная версия: только спектральные индексы по снимкам Landsat.', [0.78, 0.82, 0.90])
  ] },
  'model-sillitoe': { title: 'Ричард Силлитоу (Richard H. Sillitoe)', sentence: MODEL_SELECTION_SENTENCE, selected: 1, options: [
    modelOption('sillitoe-2010', 'Силлитоу 2010', 'Модель порфировых медных систем по работе 2010 года: зональность, связь с интрузиями, поисковые признаки.', [0.90, 0.87, 0.97]),
    modelOption('sillitoe-2003', 'Силлитоу 2003', 'Модель эпитермальных систем по работе 2003 года: связь с вулканотектонической обстановкой и составом флюидов.', [0.86, 0.84, 0.95]),
    modelOption('sillitoe-extended', 'Расширенная: эпитермальные системы', 'Объединённая модель порфировых и эпитермальных систем; проверка на эталонах не завершена.', [0.82, 0.88, 0.91])
  ] },
  'model-tsniigri': { title: 'ЦНИИГРИ', sentence: MODEL_SELECTION_SENTENCE, options: [
    modelOption('tsniigri-2024', 'ЦНИИГРИ 2024', 'Актуальные прогнозно-поисковые модели геолого-промышленных типов с критериями и признаками для оценки площадей.', [0.89, 0.91, 0.98]),
    modelOption('tsniigri-2019', 'ЦНИИГРИ 2019', 'Предыдущая редакция моделей без типов, добавленных в 2024 году.', [0.86, 0.87, 0.96]),
    modelOption('tsniigri-2012', 'ЦНИИГРИ 2012 (архив)', 'Архивная редакция; сохранена для сопоставления со старыми отчётами.', [0.80, 0.82, 0.93]),
    modelOption('tsniigri-geochem', 'Экспериментальная: прогнозно-геохимическая', 'Сборка с геохимическими признаками в составе моделей; не прошла приёмку.', [0.83, 0.85, 0.90])
  ] }
};
blockTemplates['platform-selection'] = ({ entity: entityKeyName = '' }) => {
  const selectionDefinition = PLATFORM_SELECTIONS[entityKeyName];
  if (!selectionDefinition) return '<div></div>';
  const selectedIndex = selectionDefinition.selected || 0;
  const optionButtonsHtml = selectionDefinition.options.map((optionDefinition, optionIndex) => `<a class="push-button size-small${optionIndex === selectedIndex ? ' selected-state' : ''}" href="#" data-action="pick" data-pick-key="${escapeHtml(optionDefinition.key)}">${escapeHtml(optionDefinition.name)}</a>`).join('');
  const panelsHtml = selectionDefinition.options.map((optionDefinition, optionIndex) => `<div class="padded-box border-thin-dotted vertical-stack-8" data-pick-panel="${escapeHtml(optionDefinition.key)}"${optionIndex === selectedIndex ? '' : ' hidden'}><p>${escapeHtml(optionDefinition.text)}</p><div class="text-small">${escapeHtml(optionDefinition.benchmark)}</div><div class="horizontal-row-8 justify-end"><a class="push-button size-small">Просмотр эмбедов</a></div></div>`).join('');
  return `<div class="vertical-stack-8"><h1>${escapeHtml(selectionDefinition.title)}</h1><p>${escapeHtml(selectionDefinition.sentence)}</p><div class="vertical-stack-8" data-pick-group><div class="horizontal-row-8">${optionButtonsHtml}</div>${panelsHtml}</div></div>`;
};
const TEAM_ACCOUNTS = [
  { name: 'Полярная геологоразведка', members: ['Александр Иванов', 'Мария Петрова', 'Дмитрий Смирнов', 'Анна Морозова', 'Николай Орлов', 'Екатерина Волкова'], paid: true, lastActive: '29.10.2026', gisAccess: true },
  { name: 'Таймырская ГРЭ', members: ['Сергей Кузнецов', 'Ольга Соколова', 'Павел Лебедев', 'Ирина Козлова', 'Андрей Новиков', 'Татьяна Фёдорова', 'Виктор Михайлов', 'Елена Егорова'], paid: true, lastActive: '30.10.2026', gisAccess: true },
  { name: 'Сибгеоконсалт', members: ['Игорь Степанов', 'Наталья Николаева', 'Роман Захаров'], paid: false, lastActive: '17.10.2026', gisAccess: false },
  { name: 'Уралгеолком', members: ['Владимир Семёнов', 'Светлана Павлова', 'Алексей Голубев', 'Юлия Виноградова', 'Константин Богданов'], paid: true, lastActive: '28.10.2026', gisAccess: true },
  { name: 'Кольская ГРЭ', members: ['Михаил Воробьёв', 'Галина Фролова', 'Евгений Беляев', 'Людмила Тарасова', 'Артём Комаров', 'Валентина Киселёва', 'Олег Ильин'], paid: true, lastActive: '26.10.2026', gisAccess: true },
  { name: 'ВостокГео', members: ['Денис Гусев', 'Вера Титова'], paid: false, lastActive: '03.10.2026', gisAccess: false },
  { name: 'Якутская алмазная партия', members: ['Григорий Кузьмин', 'Оксана Кудрявцева', 'Борис Баранов', 'Лариса Куликова'], paid: true, lastActive: '24.10.2026', gisAccess: true },
  { name: 'Геопрогноз-Центр', members: ['Станислав Алексеев'], paid: false, lastActive: '12.09.2026', gisAccess: false },
  { name: 'Амур-Золото ГРП', members: ['Фёдор Макаров', 'Зинаида Андреева', 'Леонид Ковалёв', 'Маргарита Ильина', 'Тимур Гаврилов'], paid: true, lastActive: '21.10.2026', gisAccess: true },
  { name: 'Учебная группа ГКЗ', members: ['Пётр Никитин', 'Алина Щербакова', 'Василий Зайцев', 'Дарья Соловьёва', 'Кирилл Борисов', 'Полина Яковлева', 'Максим Григорьев', 'София Романова'], paid: false, lastActive: '01.09.2026', gisAccess: false }
];
const memberCountWord = memberCount => memberCount === 1 ? 'участник' : (memberCount >= 2 && memberCount <= 4 ? 'участника' : 'участников');
blockTemplates['team-accounts-table'] = () => `<table class="data-table"><thead><tr><th>Команда</th><th>Контакт</th><th>Участники</th><th>Тариф</th><th>Активность</th><th>Доступ к GEOmass ГИС</th></tr></thead><tbody>${TEAM_ACCOUNTS.map(teamAccount => `<tr><td>${escapeHtml(teamAccount.name)}</td><td>${escapeHtml(teamAccount.members[0])}</td><td><div>${teamAccount.members.length} ${memberCountWord(teamAccount.members.length)}</div><div class="text-small">${teamAccount.members.map(escapeHtml).join(', ')}</div></td><td>${teamAccount.paid ? 'Платная' : 'Бесплатная'}</td><td>${escapeHtml(teamAccount.lastActive)}</td><td>${iconButtonHtml('tick', teamAccount.gisAccess ? 'selected-state' : '', 'href="#" data-action="toggle"')}</td></tr>`).join('')}</tbody></table>`;
blockTemplates['profile-card'] = ({ title: cardTitleText = '', text: cardSentenceText = '' }, placeholderElement) => buildProfileCard(cardTitleText, cardSentenceText, placeholderElement);
blockTemplates.section = (blockDataset, placeholderElement) => buildSection(blockDataset.label || '', parseVariants(blockDataset.variants), Array.from(placeholderElement.childNodes), blockDataset.meta || '');
blockTemplates.panel = (blockDataset, placeholderElement) => buildPanel(blockDataset.title || '', Array.from(placeholderElement.childNodes));

function renderBlocks() {
  for (let passNumber = 0; passNumber < 6; passNumber++) {
    const placeholders = queryAllElements('[data-block]');
    if (!placeholders.length) break;
    placeholders.forEach(placeholderElement => {
      if (!placeholderElement.isConnected) return;
      const templateFunction = blockTemplates[placeholderElement.dataset.block];
      if (!templateFunction) return;
      const renderedBlock = templateFunction(placeholderElement.dataset, placeholderElement);
      placeholderElement.replaceWith(typeof renderedBlock === 'string' ? elementFromHtml(renderedBlock) : renderedBlock);
    });
  }
}

/* ---------- map ---------- */
const mapViewState = { mode: 'source', layers: { licence: true, geology: true, faults: true, magnetism: false, ore: true, model: false } };
const FEATURE_INFO = {
  'Лицензионный контур': 'Контур площади · 33,1 км². По нему задаётся расчётная область.',
  'Разрывные нарушения': 'Показаны разломы. В материалах площади учтено 14 линейных объектов.',
  'Магнитное поле': 'В материалах площади — 8 381 точка магнитной съёмки.',
  'Рудная точка': 'Точки опробования используются для обучения.',
  'Модельное наложение': 'Вид представления модельных результатов поверх геологических слоёв.'
};
function drawMapScheme() {
  const mapHostElement = queryFirst('[data-map]');
  if (!mapHostElement) return;
  const layerFlags = mapViewState.layers, showModelOverlay = mapViewState.mode !== 'source' && layerFlags.model;
  const magnetPointsHtml = Array.from({ length: 45 }, (unusedValue, pointIndex) => `<circle cx="${75 + pointIndex * 47 % 470}" cy="${48 + pointIndex * 83 % 242}" r="2" data-feature="Магнитное поле"/>`).join('');
  mapHostElement.innerHTML = `<svg class="map-scheme" id="map-scheme" viewBox="0 0 640 348" role="img" aria-label="Условная схема геологических слоёв" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round">
${layerFlags.geology ? '<g stroke-width="1" stroke-dasharray="0 2" fill="#fff"><path d="M60 40L280 18L327 135L196 210L63 144Z"/><path d="M319 26L550 64L577 201L341 244L218 196L326 134Z"/><path d="M108 238L233 208L335 246L551 219L577 316L117 321Z"/></g>' : ''}
${layerFlags.licence ? '<path data-feature="Лицензионный контур" d="M130 63L424 42L526 142L478 282L203 307L95 201Z" stroke-width="2"/>' : ''}
${layerFlags.faults ? '<g data-feature="Разрывные нарушения" stroke-width="1"><path d="M97 302L221 211L292 160L444 35"/><path d="M204 20L282 113L397 229L500 331"/><path d="M42 174L205 139L376 100L599 75"/></g>' : ''}
${layerFlags.magnetism ? `<g fill="#000" stroke="none">${magnetPointsHtml}</g>` : ''}
${layerFlags.ore ? '<g fill="#fff" stroke-width="2"><circle data-feature="Рудная точка" cx="256" cy="158" r="7"/><circle data-feature="Рудная точка" cx="381" cy="184" r="7"/><circle data-feature="Рудная точка" cx="307" cy="222" r="7"/></g>' : ''}
${showModelOverlay ? '<g stroke-width="2" stroke-dasharray="0 4" pointer-events="all"><rect x="230" y="103" width="52" height="45" data-feature="Модельное наложение"/><rect x="282" y="103" width="52" height="45" data-feature="Модельное наложение"/><rect x="334" y="148" width="52" height="45" data-feature="Модельное наложение"/><rect x="282" y="193" width="52" height="45" data-feature="Модельное наложение"/></g>' : ''}
<text x="12" y="336" fill="#000" stroke="none" font-size="11">ВЕРХНЕ-КОЛПИНСКАЯ ПЛОЩАДЬ · СХЕМА СЛОЁВ</text></svg>`;
  queryAllElements('[data-map-modes] [data-action]').forEach(modeButton => modeButton.classList.toggle('selected-state', modeButton.dataset.action === 'map:' + mapViewState.mode));
  queryAllElements('[data-map-layers] [data-action]').forEach(layerButton => layerButton.classList.toggle('selected-state', !!layerFlags[layerButton.dataset.action.slice(6)]));
}

/* ---------- dialog ---------- */
function openDialog(dialogTitleText, dialogBodyHtml) {
  const backdropElement = elementFromHtml(`<div class="modal-backdrop"><div class="modal-dialog padded-box border-thick-solid vertical-stack-16" role="dialog" aria-modal="true"><div class="horizontal-row-8 justify-between"><h2>${escapeHtml(dialogTitleText)}</h2>${iconButtonHtml('cross', '', 'data-action="dismiss" href="#"')}</div><div class="vertical-stack-16">${dialogBodyHtml}</div></div></div>`);
  backdropElement.addEventListener('click', clickEvent => { if (clickEvent.target === backdropElement) backdropElement.remove(); });
  document.body.appendChild(backdropElement);
}
const closeDialog = () => { const backdropElement = queryFirst('.modal-backdrop'); if (backdropElement) backdropElement.remove(); };
const roleSelect = () => openDialog('Роль', `<div class="two-column-grid equal-height-rows">${ROLE_DEFINITIONS.map(roleDefinition => `<a class="push-button size-small" href="#" data-action="choose-role:${roleDefinition.name}">${roleDefinition.name}</a><span class="text-small text-secondary">${roleDefinition.desc}</span>`).join('')}</div>`);
const createSelect = () => openDialog('Создать', `<div class="horizontal-row-8"><a class="push-button" href="#new-project">Создать проект</a></div><div class="vertical-stack-8"><div>Быстрые ссылки</div><div class="horizontal-row-8"><a class="push-button size-small">Создать коллекцию</a><a class="push-button size-small">Разобрать файлы</a><a class="push-button size-small">…</a></div></div>`);
const LITERATURE_DIALOGS = {
  textbooks: {
    title: 'Учебники',
    intro: 'Учебники — базовые курсы по геологии, геофизике, геохимии и разведке, из которых агент берёт определения, классификации и типовые методы.',
    items: [
      'А. А. Матвеев, А. П. Соловов. Геохимические методы поисков месторождений полезных ископаемых, 2011',
      'В. В. Авдонин и др. Поиски и разведка месторождений полезных ископаемых, 2007',
      'В. И. Смирнов. Геология полезных ископаемых, 1982',
      'А. Б. Каждан. Поиски и разведка месторождений полезных ископаемых, 1984',
      'А. А. Логачев, В. П. Захаров. Магниторазведка, 1979',
      'В. К. Хмелевской. Геофизические методы исследования земной коры, 1997',
      'В. В. Белоусов. Структурная геология, 1986',
      'Н. В. Короновский, А. Ф. Якушова. Основы геологии, 1991',
      'В. Е. Хаин, М. Г. Ломизе. Геотектоника с основами геодинамики, 1995',
      'А. Г. Бетехтин. Курс минералогии, 2008'
    ]
  }
};
const literatureSelect = dialogKeyName => {
  const dialogDefinition = LITERATURE_DIALOGS[dialogKeyName];
  if (!dialogDefinition) return;
  openDialog(dialogDefinition.title, `<p>${escapeHtml(dialogDefinition.intro)}</p><ul class="bullet-list">${dialogDefinition.items.concat(['…']).map(itemTitleText => `<li>${escapeHtml(itemTitleText)}</li>`).join('')}</ul>`);
};

/* ---------- hotspot hint ---------- */
function flashHotspots() {
  const activeScreen = queryFirst('.page-screen:target') || queryFirst('#login');
  const hotspotElements = queryAllElements('[data-action],a[href^="#"]:not([href="#"])', activeScreen).filter(candidateElement => candidateElement.getClientRects().length && getComputedStyle(candidateElement).visibility !== 'hidden' && !candidateElement.classList.contains('design-meta') && !candidateElement.closest('.section-switcher'));
  const navigationBar = queryFirst('.top-navigation');
  if (navigationBar && getComputedStyle(navigationBar).display !== 'none') hotspotElements.push(...queryAllElements('a[href]:not(.design-meta)', navigationBar));
  for (const hotspotElement of new Set(hotspotElements)) { hotspotElement.classList.remove('hotspot-flash'); void hotspotElement.offsetWidth; hotspotElement.classList.add('hotspot-flash'); setTimeout(() => hotspotElement.classList.remove('hotspot-flash'), 350); }
}

/* ---------- logs ---------- */
const scrollLogs = () => queryAllElements('.chat-messages').forEach(messagesElement => { messagesElement.scrollTop = messagesElement.scrollHeight; });

/* ---------- gate ---------- */
const PASSWORD_HASH = '439c75e45e331b78fcc41a9304d4e8b6de8aa650824c759a43dbfa26e86dad42';
const UNLOCK_STORAGE_KEY = 'geocursor.unlock', UNLOCK_TTL_MILLISECONDS = 60 * 24 * 3600 * 1000;
const unlockStore = { get() { try { return Number(localStorage.getItem(UNLOCK_STORAGE_KEY) || 0); } catch (storageError) { return 0; } }, set() { try { localStorage.setItem(UNLOCK_STORAGE_KEY, String(Date.now())); } catch (storageError) {} } };
const isGateLocked = () => { const unlockTimestamp = unlockStore.get(); return !(unlockTimestamp && Date.now() - unlockTimestamp < UNLOCK_TTL_MILLISECONDS); };
async function tryUnlockGate() {
  const passwordInput = queryFirst('#gate-pass'), errorElement = queryFirst('#gate-error');
  if (!passwordInput) return;
  let digestHexString = '';
  try {
    const digestBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(passwordInput.value));
    digestHexString = Array.from(new Uint8Array(digestBuffer)).map(digestByte => digestByte.toString(16).padStart(2, '0')).join('');
  } catch (digestError) { digestHexString = ''; }
  if (digestHexString === PASSWORD_HASH) { unlockStore.set(); document.body.classList.remove('gate-locked'); errorElement.hidden = true; passwordInput.value = ''; scrollLogs(); }
  else { errorElement.hidden = false; passwordInput.select(); }
}

/* ---------- events ---------- */
document.addEventListener('click', clickEvent => {
  const actionElement = clickEvent.target.closest('[data-action]');
  if (actionElement) {
    clickEvent.preventDefault();
    const actionName = actionElement.dataset.action;
    if (actionName.startsWith('variant:')) {
      const variantKey = actionName.slice(8), sectionElement = actionElement.closest('.named-section');
      if (sectionElement) { queryAllElements('.section-switcher a', sectionElement).forEach(switcherLink => switcherLink.classList.toggle('weight-bold', switcherLink === actionElement)); queryAllElements('[data-variant]', sectionElement).forEach(variantElement => { variantElement.hidden = variantElement.dataset.variant !== variantKey; }); }
    }
    else if (actionName === 'role') roleSelect();
    else if (actionName === 'create') createSelect();
    else if (actionName.startsWith('choose-role:')) { currentRoleName = actionName.slice(12); closeDialog(); queryAllElements('[data-role-label]').forEach(labelElement => { labelElement.textContent = currentRoleLabel(); }); }
    else if (actionName === 'dismiss') closeDialog();
    else if (actionName.startsWith('expand:')) {
      const summaryElement = actionElement.closest('[data-summary-section]');
      if (summaryElement) { summaryElement.classList.toggle('is-expanded'); const isExpanded = summaryElement.classList.contains('is-expanded'); actionElement.textContent = isExpanded ? (actionElement.dataset.collapse || 'Свернуть') : (actionElement.dataset.expand || 'Развернуть'); }
    }
    else if (actionName.startsWith('map:')) { mapViewState.mode = actionName.slice(4); mapViewState.layers.model = mapViewState.mode !== 'source'; drawMapScheme(); }
    else if (actionName.startsWith('layer:')) { const layerKeyName = actionName.slice(6); mapViewState.layers[layerKeyName] = !mapViewState.layers[layerKeyName]; if (layerKeyName === 'model' && mapViewState.layers.model && mapViewState.mode === 'source') mapViewState.mode = 'combined'; drawMapScheme(); }
    else if (actionName.startsWith('draft:')) { const tileButtonRow = actionElement.closest('.horizontal-row-8'); const acceptButton = tileButtonRow && queryFirst('[data-action="draft:accept"]', tileButtonRow); if (acceptButton) acceptButton.classList.toggle('selected-state', actionName === 'draft:accept'); }
    else if (actionName.startsWith('literature:')) literatureSelect(actionName.slice(11));
    else if (actionName === 'pick') {
      const pickGroupElement = actionElement.closest('[data-pick-group]');
      if (pickGroupElement) {
        queryAllElements('[data-action="pick"]', pickGroupElement).forEach(optionElement => optionElement.classList.toggle('selected-state', optionElement === actionElement));
        queryAllElements('[data-pick-panel]', pickGroupElement).forEach(panelElement => { panelElement.hidden = panelElement.dataset.pickPanel !== actionElement.dataset.pickKey; });
      }
    }
    else if (actionName === 'toggle') actionElement.classList.toggle('selected-state');
    else if (actionName === 'unlock') tryUnlockGate();
    return;
  }
  const featureElement = clickEvent.target.closest('#map-scheme [data-feature]');
  if (featureElement) { const captionElement = queryFirst('#map-feature'); if (captionElement) captionElement.textContent = featureElement.dataset.feature + ' — ' + (FEATURE_INFO[featureElement.dataset.feature] || 'Элемент схематичной карты'); return; }
  const hashTargetLink = clickEvent.target.closest('a[href^="#"]:not([href="#"])');
  if (hashTargetLink) { if (hashTargetLink.closest('.modal-backdrop') && hashTargetLink.getAttribute('href') === location.hash) closeDialog(); return; }
  if (clickEvent.target.closest('.modal-backdrop, .password-gate')) return;
  flashHotspots();
}, true);
document.addEventListener('keydown', keyboardEvent => {
  if (keyboardEvent.key === 'Escape') closeDialog();
  if (keyboardEvent.key === 'Enter' && keyboardEvent.target && keyboardEvent.target.id === 'gate-pass') { keyboardEvent.preventDefault(); tryUnlockGate(); }
});
window.addEventListener('hashchange', () => { closeDialog(); scrollLogs(); });
window.addEventListener('load', scrollLogs);

/* ---------- init ---------- */
renderBlocks();
drawMapScheme();
if (isGateLocked()) { document.body.classList.add('gate-locked'); const passwordInput = queryFirst('#gate-pass'); if (passwordInput) passwordInput.focus(); }
scrollLogs();
})();
