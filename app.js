const { locales, papers } = window.SITE_CONTENT;
let language = 'zh';
let activeFilter = 'all';
let activeStage = 'development';
const stagePapers = { plan: ['swe-plan'], development: ['untilitpasses', 'featureloop', 'featurearc'], maintenance: ['userswe'], quality: [], operations: [], understand: ['repoprobe'], data: [] };
const list = document.querySelector('#paper-list');
const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

function renderPapers() {
  const locale = locales[language];
  const isChinese = language === 'zh';
  list.innerHTML = papers.map(p => {
    const text = locale.papers[p.id];
    const group = p.group === 'tencent' ? locale.copy.company : locale.copy.traeCompany;
    const links = p.links.map(([label, url]) => {
      const display = label === 'Venue' && isChinese ? '会议页面' : label;
      const aria = `${p.name} ${display}${isChinese ? '（在新标签页打开）' : ' (opens in a new tab)'}`;
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(aria)}">${display}</a>`;
    }).join('');
    return `<article class="paper-row" id="paper-${p.id}" data-group="${p.group}" aria-labelledby="title-${p.id}"><div class="paper-category">${escapeHtml(text.category)}<span>${escapeHtml(group)}</span></div><div class="paper-content"><h3 id="title-${p.id}">${escapeHtml(p.name)}</h3><p class="paper-title">${escapeHtml(text.title)}</p><p class="paper-summary">${escapeHtml(text.summary)}</p></div><div class="paper-meta">${text.venue ? `<span class="venue">${escapeHtml(text.venue)}</span>` : ''}<p class="paper-year">${p.year}</p><div class="paper-links">${links}</div></div></article>`;
  }).join('');
  setFilter(activeFilter);
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('.filters button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
  let count = 0;
  document.querySelectorAll('.paper-row').forEach(row => {
    row.hidden = filter !== 'all' && row.dataset.group !== filter;
    if (!row.hidden) count++;
  });
  const group = filter === 'all' ? '' : filter === 'tencent' ? locales[language].copy.company : 'Trae';
  document.querySelector('#filter-status').textContent = language === 'zh'
    ? `显示${group || '全部'} ${count} 篇论文。`
    : `Showing ${count}${group ? ` ${group}` : ''} papers.`;
}

function selectStage(stage) {
  activeStage = stage;
  document.querySelectorAll('.coverage-node').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.stage === stage)));
  document.querySelector('#map-question').textContent = locales[language].stages[stage].description;
  const linkedPapers = stagePapers[stage];
  document.querySelector('#map-paper-links').innerHTML = linkedPapers.map(id => {
    const paper = papers.find(p => p.id === id);
    return `<a href="#paper-${id}">${escapeHtml(paper.name)}</a>`;
  }).join('');
  document.querySelector('#map-research').hidden = linkedPapers.length === 0;
}

function setLanguage(nextLanguage) {
  if (!locales[nextLanguage]) return;
  language = nextLanguage;
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  const copy = locales[language].copy;
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = copy[element.dataset.i18n]; });
  document.querySelectorAll('[data-i18n-aria]').forEach(element => { element.setAttribute('aria-label', copy[element.dataset.i18nAria]); });
  document.querySelectorAll('[data-i18n-content]').forEach(element => { element.setAttribute('content', copy[element.dataset.i18nContent]); });
  document.querySelectorAll('[data-lang]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === language)));
  renderPapers();
  selectStage(activeStage);
}

document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
document.querySelectorAll('.filters button,.experience-filter').forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
document.querySelectorAll('.coverage-node').forEach(button => button.addEventListener('click', () => selectStage(button.dataset.stage)));
document.querySelector('#map-paper-links').addEventListener('click', event => {
  if (event.target.closest('a')) setFilter('tencent');
});
function showLinkedPaper() {
  const target = document.getElementById(location.hash.slice(1));
  if (target?.classList.contains('paper-row')) {
    if (target.hidden) setFilter('all');
    target.scrollIntoView({ block: 'start' });
  }
}
window.addEventListener('hashchange', showLinkedPaper);
// Every fresh visit starts in Chinese. Switching languages preserves the
// selected capability and publication filter for the current visit.
setLanguage('zh');
if (location.hash.startsWith('#paper-')) showLinkedPaper();
