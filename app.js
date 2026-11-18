import {renderPage,renderHeader,renderFooter,renderQualityPanel,pageTitle} from './render.js?v=01fdea041f5a';
const {locales,papers}=window.SITE_CONTENT;
const page=document.body.dataset.page;
let language='zh',activeStep=2;
let filter=new URLSearchParams(location.search).get('group')||'all';
if(!['all','tencent','trae'].includes(filter)) filter='all';
const content=()=>locales[language];
const main=document.getElementById('main');
function render(){
 const openIds=[...document.querySelectorAll('.paper:has(details[open])')].map(p=>p.id.slice(6));
 const openQualityIds=[...document.querySelectorAll('.deep-case[open]')].map(detail=>detail.id);
 const s=content();
 document.documentElement.lang=language==='zh'?'zh-CN':'en';
 document.title=pageTitle(s,page);
 document.querySelector('meta[name="description"]').content=s.home.description;
 document.getElementById('site-header').innerHTML=renderHeader(s,page,language);
 main.innerHTML=renderPage(s,papers,page,{filter,activeStep,openIds});
 openQualityIds.forEach(id=>{const detail=document.getElementById(id);if(detail)detail.open=true;});
 document.getElementById('site-footer').innerHTML=renderFooter(s);
}
function selectStep(index){
 activeStep=index;
 document.querySelectorAll('[data-step]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.step)===index)));
 const panel=document.getElementById('handoff-panel');
 panel.className=`handoff-panel ${content().quality.diagram.steps[index].owner}`;
 panel.innerHTML=renderQualityPanel(content(),index);
 if(matchMedia('(max-width:800px)').matches) panel.scrollIntoView({block:'start',behavior:'instant'});
}
document.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button) return;
 if(button.dataset.lang){language=button.dataset.lang;render();document.querySelector(`[data-lang="${language}"]`).focus({preventScroll:true});}
 if(button.dataset.filter){
  filter=button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
  document.querySelectorAll('.paper').forEach(p=>p.hidden=filter!=='all'&&p.dataset.group!==filter);
  const count=[...document.querySelectorAll('.paper')].filter(p=>!p.hidden).length;
  document.getElementById('filter-status').textContent=`${count} ${content().labels.workCount}`;
  const url=new URL(location.href);filter==='all'?url.searchParams.delete('group'):url.searchParams.set('group',filter);url.hash='';history.replaceState(null,'',url);
 }
 if(button.dataset.step!==undefined) selectStep(Number(button.dataset.step));
 if(button.dataset.return!==undefined){selectStep(Number(button.dataset.return));document.querySelector(`[data-step="${activeStep}"]`).focus({preventScroll:true});}
});
function revealLinkedPaper(){
 if(!location.hash.startsWith('#paper-'))return;
 if(page!=='benchmarks'){location.replace(`benchmarks.html${location.hash}`);return;}
 const paper=document.getElementById(location.hash.slice(1));if(!paper)return;
 if(paper.hidden){filter='all';render();}
 const target=document.getElementById(location.hash.slice(1));target.querySelector('details').open=true;target.scrollIntoView({block:'start'});
}
render();revealLinkedPaper();
window.addEventListener('hashchange',revealLinkedPaper);
