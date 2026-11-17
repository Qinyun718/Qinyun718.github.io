export const escapeHtml = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const e = escapeHtml;
export const routes = {home:'index.html', system:'system.html', benchmarks:'benchmarks.html', skills:'skills.html', future:'future.html'};
const link = (page, text, cls = 'text-link', suffix = '') => `<a class="${cls}" href="${routes[page]}${suffix}">${e(text)}</a>`;
const arrow = '<span class="flow-arrow" aria-hidden="true">→</span>';
const heading = (title, body, tag='') => `<header class="page-intro">${tag?`<p class="section-label">${e(tag)}</p>`:''}<h1>${e(title)}</h1><p class="lead">${e(body)}</p></header>`;
export function renderHeader(s, page, lang='zh') {
 return `<a class="skip-link" href="#main">${e(s.labels.skip)}</a><header class="site-header wrap"><a class="wordmark" href="index.html"><span class="brand-symbol" aria-hidden="true">&lt;/&gt;</span>${e(s.brand)}</a><nav aria-label="${e(s.labels.nav)}">${s.navigation.map(n=>`<a href="${routes[n.page]}" ${n.page===page?'aria-current="page"':''}>${e(n.label)}</a>`).join('')}</nav><div class="language-switch" role="group" aria-label="${e(s.labels.language)}"><button data-lang="zh" lang="zh-CN" aria-pressed="${lang==='zh'}">中文</button><button data-lang="en" lang="en" aria-pressed="${lang==='en'}">English</button></div></header>`;
}
export function renderFooter(s) {
 return `<footer class="site-footer wrap"><p>${e(s.labels.footer)}</p>${link('home',s.labels.back)}</footer>`;
}
export function pageTitle(s, page) {return `${({home:s.home.pageTitle,system:s.labels.system,benchmarks:s.labels.benchmarks,skills:s.labels.skills,future:s.labels.future})[page]}${page==='home'?'':` | ${s.brand}`}`;}
export function renderQualityPanel(s, active) {
 const q=s.quality, l=s.labels, step=q.diagram.steps[active];
 return `<div class="handoff-heading"><span class="owner-label ${step.owner}">${e(q.diagram.legend[step.owner])}</span><h3>${e(step.title)}</h3><p>${e(step.summary)}</p><a class="mobile-flow-back" href="#flow-title">${e(l.backFlow)}</a></div><dl class="handoff-content">${step.details.map(d=>`<div><dt>${e(d.label)}</dt><dd>${e(d.text)}</dd></div>`).join('')}</dl>`;
}

function home(s) {
 const l=s.labels, blocks=s.home.blocks;
 const path=[{page:'system',title:l.system,body:blocks[1].body},{page:'benchmarks',title:l.benchmarks,body:blocks[2].sections[0].body},{page:'skills',title:l.skills,body:blocks[2].sections[1].body}];
 return `<section class="home-intro"><div><p class="section-label">Coding Agent Evaluation</p><h1>${e(blocks[0].title)}</h1><p class="lead">${e(blocks[0].body)}</p></div><aside class="experience" aria-label="${e(l.experience)}"><h2>${e(l.experience)}</h2>${blocks[0].items.map((item,i)=>`<div class="experience-item"><span class="experience-dot" aria-hidden="true"></span><h3>${e(item.label)}</h3><p>${e(item.text)}</p>${i===1?link('benchmarks','RepoSim / RepoMasterEval','small-link','?group=trae'):''}</div>`).join('')}</aside></section><section class="home-path section-space"><div class="section-heading"><h2>${e(l.pathTitle)}</h2><p>${e(l.pathIntro)}</p></div><div class="path-grid">${path.map((p,i)=>`<article class="path-item"><span class="sequence">${i+1}</span><h3>${link(p.page,p.title,'path-title')}</h3><p>${e(p.body)}</p>${link(p.page,l.read,'path-link')}${i<2?arrow:''}</article>`).join('')}</div></section><section class="future-teaser"><div><p class="section-label">${e(l.future)}</p><h2>${e(l.futureTitle)}</h2><p>${e(l.futureBody)}</p></div>${link('future',l.futureLink,'button')}</section>`;
}
function system(s) {
 const l=s.labels, blocks=s.system.blocks, map=blocks[1].map;
 return `${heading(l.programTitle,l.programSubtitle)}<section class="coverage-section"><div class="section-heading"><h2>${e(l.coverage)}</h2><p>${e(l.coverageNote)}</p></div><div class="scope-map"><div class="lifecycle">${map.lifecycle.map((area,i)=>`<div class="scope-area"><h3>${e(area.title)}</h3><ul>${area.items.map(x=>`<li>${e(x)}</li>`).join('')}</ul>${i<4?arrow:''}</div>`).join('')}</div><div class="understanding-band"><strong>${e(map.crossCutting.title)}</strong><p>${e(map.crossCutting.body)}</p>${link('benchmarks','RepoProbe','small-link','#paper-repoprobe')}</div><div class="domain-band"><div><h3>${e(map.separateDomain.title)} <span>${e(map.separateDomain.subtitle)}</span></h3><p>${e(map.separateDomain.body)}</p></div></div></div></section><section class="section-space building-section"><div><h2>${e(blocks[0].title)}</h2><p>${e(blocks[0].body)}</p></div><ol class="building-list">${blocks[0].steps.map((x,i)=>`<li><span class="sequence">${i+1}</span>${e(x)}</li>`).join('')}</ol></section><section class="next-section"><h2>${e(l.practiceTitle)}</h2><p>${e(blocks[2].body)}</p><div class="inline-links">${link('benchmarks',l.benchmarks,'button','?group=tencent')}${link('skills',l.skills,'text-link')}</div></section>`;
}
function benchmarks(s,papers,filter,openIds) {
 const l=s.labels;
 return `${heading(l.benchTitle,l.benchIntro)}<section class="benchmark-section"><div class="research-toolbar"><div class="filters" role="group" aria-label="${e(l.filter)}">${['all','tencent','trae'].map(g=>`<button data-filter="${g}" aria-pressed="${g===filter}">${e(l[g])}<span>${g==='all'?papers.length:papers.filter(p=>p.group===g).length}</span></button>`).join('')}</div><p id="filter-status" role="status">${filter==='all'?papers.length:papers.filter(p=>p.group===filter).length} ${e(l.workCount)}</p></div><div class="paper-list">${papers.map(p=>{
 const c=s.papers[p.id], x=c.example;
 return `<article class="paper" id="paper-${p.id}" data-group="${p.group}" ${filter!=='all'&&filter!==p.group?'hidden':''}><div class="paper-main"><div class="paper-identity"><p class="paper-category">${e(l[p.group])} / ${e(c.category)}</p><h2>${e(p.name)}</h2>${c.venue?`<span class="venue">${e(c.venue)}</span>`:''}<div class="paper-links">${p.links.map(([label,url])=>`<a href="${e(url)}" target="_blank" rel="noreferrer">${e(label)}</a>`).join('')}</div></div><div class="paper-summary"><h3>${e(c.tagline)}</h3><p>${e(c.summary)}</p><p class="insight"><strong>${e(l.insight)}</strong>${e(c.insight)}</p></div></div><details class="case" ${openIds.includes(p.id)?'open':''}><summary>${e(l.example)}<span aria-hidden="true">+</span></summary><div class="case-content"><p class="case-origin">${e(x.origin)}</p><div class="case-request"><strong>${e(l.request)}</strong><p>${e(x.request)}</p></div><ol class="case-steps">${x.steps.map((step,i)=>`<li><span class="sequence">${i+1}</span><h4>${e(step.title)}</h4><p>${e(step.body)}</p></li>`).join('')}</ol><div class="case-conclusion"><p><strong>${e(l.takeaway)}</strong>${e(x.takeaway)}</p><a href="${e(c.sourceUrl)}" target="_blank" rel="noreferrer">${e(l.caseSource)}</a></div></div></details></article>`;
 }).join('')}</div></section>`;
}
function qualityCases(d) {
 return `<section class="quality-cases" aria-labelledby="quality-case-title">
 <header class="quality-case-heading"><h2 id="quality-case-title"><span id="deep-cases-title">${e(d.title)}</span></h2><p class="deep-intro">${e(d.intro)}</p><p>${e(d.origin)}</p></header>
 <div class="deep-case-list">${d.cases.map(c=>`<details class="deep-case" id="${e(c.id)}">
  <summary><span class="deep-case-tag">${e(c.tag)}</span><h3>${e(c.title)}</h3><p>${e(c.summary)}</p><span class="deep-case-action">${e(d.detailLabel)} <span aria-hidden="true">+</span></span></summary>
  <div class="deep-case-content">
   <header class="deep-example-heading"><p>${e(d.exampleLabel)}</p><h4>${e(c.exampleTitle)}</h4><p>${e(c.exampleIntro)}</p></header>
   <div class="deep-request"><strong>${e(d.requestLabel)}</strong><div><p>${e(c.request)}</p>${c.sample?`<div class="quality-task-data case-input"><div><span>${e(c.sample.inputLabel)}</span><pre>${e(c.sample.input)}</pre></div><span class="data-arrow" aria-hidden="true">→</span><div><span>${e(c.sample.expectedLabel)}</span><pre>${e(c.sample.expected)}</pre></div></div>`:''}</div></div>
   <ol class="deep-steps">${c.steps.map((step,i)=>`<li><span class="sequence" aria-hidden="true">${i+1}</span><div><h4>${e(step.title)}</h4><p>${e(step.body)}</p>${i===0&&c.codeExample?`<p class="signal-path">${e(c.signalPath)}</p><div class="test-change"><div><h5>${e(c.codeExample.beforeLabel)}</h5><pre><code>${e(c.codeExample.before)}</code></pre></div><div><h5>${e(c.codeExample.afterLabel)}</h5><pre><code>${e(c.codeExample.after)}</code></pre></div></div>`:''}${i===0&&c.branches?`<div class="branch-map"><p class="branch-map-label">${e(c.branchLabel)}</p><div class="speculative-branches">${c.branches.map(branch=>`<article><h5>${e(branch.guess)}</h5><p>${e(branch.change)}</p></article>`).join('')}</div></div>`:''}${i===1?`<div class="review-probes">${c.probes.map(probe=>`<div class="probe-row"><h5>${e(probe.action)}</h5><dl><div><dt>${e(d.expectedLabel)}</dt><dd>${e(probe.expected)}</dd></div><div><dt>${e(d.observedLabel)}</dt><dd>${e(probe.observed)}</dd></div></dl></div>`).join('')}</div>`:''}</div></li>`).join('')}</ol>
   <div class="deep-decision"><strong>${e(d.decisionLabel)}</strong><p>${e(c.decision)}</p></div>${c.boundary?`<p class="deep-boundary">${e(c.boundary)}</p>`:''}
  </div>
 </details>`).join('')}</div></section>`;
}
function skills(s,active) {
 const l=s.labels,q=s.quality;
 return `${heading(l.qualityTitle,l.qualityIntro)}
 <section class="quality-overview" aria-label="${e(l.principles)}">${q.principles.map(p=>`<article><h2>${e(p.title)}</h2><p>${e(p.text)}</p></article>`).join('')}</section>
 ${qualityCases(q.examples)}
 <section class="quality-flow section-space" aria-labelledby="flow-title"><div class="section-heading"><h2 id="flow-title">${e(q.diagram.title)}</h2><p>${e(q.diagram.description)}</p></div><div class="flow-meta"><p>${e(l.chooseStep)}</p><div class="legend"><span class="owner-label automation">${e(q.diagram.legend.automation)}</span><span class="owner-label human">${e(q.diagram.legend.human)}</span></div></div><ol class="review-flow">${q.diagram.steps.map((step,i)=>`<li><button data-step="${i}" class="flow-node ${step.owner}" aria-pressed="${i===active}" aria-controls="handoff-panel"><span class="flow-node-top"><span class="sequence">${i+1}</span><span>${e(q.diagram.legend[step.owner])}</span></span><strong>${e(step.title)}</strong><span class="flow-node-brief">${e(step.brief)}</span></button>${i<5?arrow:''}</li>`).join('')}</ol><div class="review-loop"><span aria-hidden="true">↶</span><button data-return="3">${e(l.loop)}</button></div><div id="handoff-panel" class="handoff-panel ${q.diagram.steps[active].owner}" aria-live="polite">${renderQualityPanel(s,active)}</div><p class="flow-note">${e(l.resetBaseline)}</p><aside class="judge-iteration" aria-labelledby="judge-iteration-title"><div><p class="iteration-label">${e(q.calibration.label)}</p><h3 id="judge-iteration-title">${e(q.calibration.title)}</h3></div><div><p>${e(q.calibration.trigger)}</p><p>${e(q.calibration.action)}</p><p class="iteration-path">${e(q.calibration.path)}</p></div></aside></section>`;
}

function future(s) {
 const l=s.labels,blocks=s.future.blocks,d=blocks[2].diagram;
 return `${heading(l.futurePageTitle,l.futurePageIntro,l.planLabel)}<section class="directions-grid">${blocks.slice(0,2).map((b,i)=>`<article class="direction"><p class="direction-label">${i===0?'Coding':'Working'}</p><h2>${e(i===0?l.coding:l.working)}</h2><p>${e(b.body)}</p><ul>${b.questions.map(q=>`<li>${e(q)}</li>`).join('')}</ul></article>`).join('')}</section><section class="section-space working-process"><div class="section-heading"><h2>${e(blocks[2].title)}</h2><p>${e(blocks[2].body)}</p></div><ol class="working-flow">${d.nodes.map((n,i)=>`<li><span class="sequence">${i+1}</span><h3>${e(n.title)}</h3><p>${e(n.detail)}</p>${i<4?arrow:''}</li>`).join('')}</ol><p class="working-loop"><span aria-hidden="true">↶</span>${e(l.futureLoop)}</p><div class="foundation"><strong>${e(l.foundation)}</strong><p>${e(d.foundation.detail)}</p></div></section>`;
}
export function renderPage(s,papers,page,{filter='all',activeStep=2,openIds=[]}={}) {
 return ({home:()=>home(s),system:()=>system(s),benchmarks:()=>benchmarks(s,papers,filter,openIds),skills:()=>skills(s,activeStep),future:()=>future(s)})[page]();
}
