/* routing, page header, filters, search, theme, startup */
'use strict';
const ROUTES={overview:renderOverview,heatmaps:renderHeatmaps,recordings:renderRecordings,funnels:renderFunnels,journeys:renderJourneys,frustration:renderFrustration,trends:renderTrends,findings:renderFindings};
const ROUTE_NAMES={overview:'Обзор',heatmaps:'Тепловые карты',recordings:'Записи сессий',funnels:'Воронки',journeys:'Пути',frustration:'Фрустрация',trends:'Тренды',findings:'Выводы'};
let ROUTE='overview';
function render(){
  const h=location.hash.slice(1);ROUTE=ROUTES[h]?h:'overview';
  if(typeof stopPlay==='function'&&ROUTE!=='recordings')stopPlay();
  $$('#mods a,#mob-mods a').forEach(a=>{const on=a.dataset.r===ROUTE;a.classList.toggle('on',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  hideTip();closeDrawerSilently();
  ROUTES[ROUTE]();
  hoistHead();
  $('#fbar').classList.toggle('dim',ROUTE==='findings');
}
// move the module's title and description into the page header; other controls stay at the top of the content
function hoistHead(){
  const h=$('#view > .head');const t=$('#pg-title'),p=$('#pg-sub');
  if(!h){if(!$('#view h1')){t.textContent=ROUTE_NAMES[ROUTE];p.textContent='';$('#ph-extra').innerHTML=''}return}
  if(!h.querySelector('h1'))return;
  const x=$('#ph-extra');x.innerHTML='';
  const h1=h.querySelector('h1'),pp=h.querySelector('p');
  t.textContent=h1?h1.textContent:ROUTE_NAMES[ROUTE];p.innerHTML=pp?pp.innerHTML:'';
  const box=h1?h1.parentElement:null;if(box&&box!==h)box.remove();else{if(h1)h1.remove();if(pp)pp.remove()}
  while(h.firstElementChild)x.appendChild(h.firstElementChild);h.remove();
  document.title=(ROUTE==='overview'?'':ROUTE_NAMES[ROUTE]+' · ')+'Slottica Insights';
}
function closeDrawerSilently(){$('#dw').hidden=true;$('#scrim').hidden=true}
function updateCounts(){
  const n=ACT.length;$('#f-count').innerHTML=`<b>${fmt(n)}</b> ${plural(n,'сессия','сессии','сессий')} · <b>${fmt(uniqUsers(ACT))}</b> польз.`;
  let fr=0;for(const s of ACT)if(S_sc[s]>=3)fr++;$('#frus-bdg').textContent=fr?fmt(fr):'';$('#btn-bell .dot').hidden=!fr;
  $('#dp-label').textContent=rangeText();
  $('#f-reset').hidden=F.d0===0&&F.d1===LAST&&F.dev==='all'&&F.au==='all'&&F.co==='all'&&F.sr==='all';
}
function syncFilterUI(){$('#f-dev').value=F.dev;$('#f-au').value=F.au;$('#f-co').value=F.co;$('#f-sr').value=F.sr}
function refreshAll(){applyFilters();updateCounts();render()}

/* date picker: 26.10–15.11, days without an export are disabled */
const DAYS_ALL=['2026-10-26','2026-10-27','2026-10-28','2026-10-29','2026-10-30','2026-10-31','2026-11-01','2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-07','2026-11-08','2026-11-09','2026-11-10','2026-11-11','2026-11-12','2026-11-13','2026-11-14','2026-11-15'];
let pend=null;
const PRE=()=>[['Весь период',0,LAST],['26–28 окт',0,2],['2–4 ноя',3,5],['6–9 ноя',6,9],['11–15 ноя',10,14],['26.10–9.11',0,9]];
function drawPicker(){
  const [a,b]=pend||[F.d0,F.d1];
  $('#dp-pre').innerHTML=PRE().map(([l,x,y])=>`<button type="button" data-a="${x}" data-b="${y}" aria-pressed="${a===x&&b===y}">${l}</button>`).join('');
  $('#dp-grid').innerHTML=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=>`<span class="wd">${d}</span>`).join('')+DAYS_ALL.map(ds=>{const i=DAYS.indexOf(ds),[y,m,d]=ds.split('-');const dd=+d;
    if(i<0)return `<button type="button" disabled title="${dd}.${m}: нет выгрузки">${dd}</button>`;
    const cls=[i>a&&i<b?'in':'',i===a?'a':'',i===b?'b':''].join(' ');
    return `<button type="button" class="${cls}" data-i="${i}" aria-label="${dd}.${m}.2026" aria-pressed="${i>=a&&i<=b}">${dd}${dd===1||dd===26?`<small>${m==='10'?'окт':'ноя'}</small>`:''}</button>`}).join('');
  const n=b-a+1;$('#dp-sel').textContent=pend&&pend.half?'Выберите последний день':`${a===b?DAYL[a]:DAYL[a]+' – '+DAYL[b]} · ${n} ${plural(n,'день','дня','дней')} с данными`;
  $('#dp-apply').disabled=!!(pend&&pend.half);
}
function openPicker(open){$('#dp-pop').hidden=!open;$('#dp-btn').setAttribute('aria-expanded',open);if(open){pend=null;drawPicker()}}
function setRange(a,b){F.d0=a;F.d1=b;openPicker(false);refreshAll()}

/* theme */
function effTheme(){const t=document.documentElement.dataset.theme;return t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}
function setTheme(t){document.documentElement.dataset.theme=t;try{localStorage.setItem('si-theme',t)}catch(e){}
  $('#btn-theme').innerHTML=t==='dark'?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  $('#btn-theme').setAttribute('aria-label',t==='dark'?'Светлая тема':'Тёмная тема');
  if(ACT&&(ROUTE==='heatmaps'||ROUTE==='overview'||ROUTE==='trends'||ROUTE==='funnels'))render()}

/* search: sections, pages, elements, signals */
let QIDX=null,QSEL=0,QRES=[];
function buildIndex(){
  const out=[];
  for(const [r,n] of Object.entries(ROUTE_NAMES))out.push({g:'Разделы',l:n,m:'',go:()=>{location.hash=r}});
  for(const g of SIGNALS)out.push({g:'Сигналы',l:g.name,m:'фрустрация',go:()=>{FRSEL=g.id;location.hash='frustration'}});
  PRESETS.forEach((p,i)=>out.push({g:'Воронки',l:p[0],m:'воронка',go:()=>{FN.preset=i;FN.steps=p[1].slice();location.hash='funnels'}}));
  const pv=new Map();for(let e=0;e<NE;e++)if(E_k[e]===0){const g=P_grp[E_p[e]];pv.set(g,(pv.get(g)||0)+1)}
  [...pv.entries()].sort((a,b)=>b[1]-a[1]).slice(0,60).forEach(([g,n])=>{const k=GRP[g].key,hm=k==='/'?'home':k==='/games/all'?'cat':k==='/promo'?'promo':'';
    out.push({g:'Страницы',l:GRP[g].label,m:fmt(n)+' просм.',go:()=>{if(hm){HM.page=hm;HM.other=null}else HM.other=g;HM.mode='click';location.hash='heatmaps'}})});
  const ec=new Int32Array(EL.length);for(let e=0;e<NE;e++)ec[E_z[e]]++;
  EL.forEach((e,z)=>{if(!z||!ec[z]||e[4]===15||e[4]===16)return;out.push({g:'Элементы',l:e[1],m:fmt(ec[z])+' соб.',go:()=>{const ss=[];for(const s of ACT){const a=S_e0[s],b=a+S_en[s];for(let i=a;i<b;i++)if(E_z[i]===z){ss.push(s);break}}openRecordingsFor({label:e[1],sessions:ss,focusEl:z})}})});
  // games
  const gc=new Map();for(let e=0;e<NE;e++)if(E_k[e]===0&&P_cat[E_p[e]]===3)gc.set(E_p[e],(gc.get(E_p[e])||0)+1);
  [...gc.entries()].sort((a,b)=>b[1]-a[1]).slice(0,300).forEach(([p,n])=>out.push({g:'Игры',l:pageLabel(p),m:fmt(n)+' запусков',go:()=>{const ss=[];for(const s of ACT){const a=S_e0[s],b=a+S_en[s];for(let i=a;i<b;i++)if(E_p[i]===p&&E_k[i]===0){ss.push(s);break}}openRecordingsFor({label:'игра '+pageLabel(p),sessions:ss})}}));
  return out;
}
const norm=s=>s.toLowerCase().replace(/ё/g,'е');
function runSearch(){
  const q=norm($('#q').value.trim()),box=$('#q-res');
  if(!q){box.hidden=true;$('#q').setAttribute('aria-expanded','false');return}
  if(!QIDX)QIDX=buildIndex();
  const words=q.split(/\s+/);QRES=QIDX.filter(it=>{const s=norm(it.l+' '+it.g);return words.every(w=>s.includes(w))});
  const groups={};QRES.forEach(it=>(groups[it.g]||(groups[it.g]=[])).push(it));
  QRES=[];let html='';for(const [g,arr] of Object.entries(groups)){html+=`<h5>${g}</h5>`;arr.slice(0,6).forEach(it=>{html+=`<button type="button" role="option" data-i="${QRES.length}"><span>${esc(it.l)}</span><small>${esc(it.m)}</small></button>`;QRES.push(it)})}
  box.innerHTML=html||'<div class="none">Ничего не найдено</div>';QSEL=0;markSel();box.hidden=false;$('#q').setAttribute('aria-expanded','true');
}
function markSel(){$$('#q-res button').forEach((b,i)=>{b.classList.toggle('on',i===QSEL);if(i===QSEL)b.scrollIntoView({block:'nearest'})})}
function pickSearch(i){const it=QRES[i];if(!it)return;$('#q').value='';$('#q-res').hidden=true;$('#q').blur();it.go()}

/* methodology */
function openMethod(){
  openDrawer(`<div class="dw-h"><div><h3 id="dw-t">Как считаем</h3><p>Источник — выгрузки GA4 / GTM из папки Analytics</p></div><button type="button" class="xbtn" aria-label="Закрыть">×</button></div>
  <dl>
   <dt>Данные</dt><dd>26–28.10, 2–4.11, 6–9.11 и 11–15.11.2026 (9.11 — до 17:00 UTC, 15.11 — до 19:57 UTC). 29.10–1.11, 5.11 и 10.11 в выгрузках нет. Только домен slottica.com, все языки, бренд Slottica: ${fmt(NS)} сессий, ${fmt(NE)} событий.</dd>
   <dt>Сессия и пользователь</dt><dd>Сессия — user_pseudo_id + session_id. «Игрок в аккаунте» — если user_id есть хотя бы у одного события сессии, «гость» — если нет ни у одного.</dd>
   <dt>Клики</dt><dd>Все события взаимодействия (game_item_click, navigation_click, banner_click и др.), кроме page_view, cashbox_deposit и возвратов с оплаты. Одинаковые события чаще, чем раз в 0,1 с, считаются дублем трекинга и убраны.</dd>
   <dt>Оплата</dt><dd>Возврат с оплаты — page_view с параметром success=true/false, пришедший с платёжного шлюза (по page_referrer, а в 6–9.11 — по traffic_source_event).</dd>
   <dt>Сигналы фрустрации</dt><dd>Rage — 3+ одинаковых клика за ≤5 с; повтор — 2 клика с паузой ≤2,5 с; U-turn — A → B → A, на B ≤7 с; быстрый выход из игры — страница игры ≤10 с; страница ошибки — /error/*; отказ от регистрации — закрытие формы или окна прерывания; поиск без выбора — search_close; быстрый уход — одна страница, ни одного клика, меньше 10 с. Оценка 1–5 — взвешенная сумма сигналов сессии.</dd>
   <dt>Тепловые карты и скролл</dt><dd>Зоны на скриншотах — элементы, которые отправляют события в GTM. Скролл восстановлен по самому нижнему блоку с кликом: это нижняя оценка глубины.</dd>
   <dt>Ограничения выгрузок</dt><dd>6–9.11: нет событий кассы, окон регистрации, фильтров, промо-блока, турниров, вкладок поиска и first_visit; нет ОС, города и реферера. 11–15.11: у cashbox_deposit нет source, у filters_tag_select нет выбранного значения, источник трафика в 60% сессий «(not set)»; session_start и sign_up_submit не используются (дублируют начало сессии и отправку формы).</dd>
  </dl>`);
}

function initUI(){
  const sel=(id,key)=>$('#'+id).addEventListener('change',e=>{F[key]=e.target.value;refreshAll()});
  sel('f-dev','dev');sel('f-au','au');
  const co={};for(let s=0;s<NS;s++)co[S_co[s]]=(co[S_co[s]]||0)+1;
  $('#f-co').innerHTML='<option value="all">Все страны</option>'+Object.entries(co).filter(([c])=>+c>=0).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`<option value="${c}">${esc(coName(+c))} · ${fmt(n)}</option>`).join('');
  const sr={};for(let s=0;s<NS;s++)sr[S_sr[s]]=(sr[S_sr[s]]||0)+1;
  $('#f-sr').innerHTML='<option value="all">Все источники</option>'+Object.entries(sr).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`<option value="${c}">${esc(DB.src[+c])} · ${fmt(n)}</option>`).join('');
  sel('f-co','co');sel('f-sr','sr');
  $('#f-reset').onclick=()=>{Object.assign(F,{d0:0,d1:LAST,dev:'all',au:'all',co:'all',sr:'all'});syncFilterUI();refreshAll()};
  $('#dp-btn').addEventListener('click',e=>{e.stopPropagation();openPicker($('#dp-pop').hidden)});
  $('#dp-pop').addEventListener('click',e=>{e.stopPropagation();
    const pb=e.target.closest('#dp-pre button');if(pb){setRange(+pb.dataset.a,+pb.dataset.b);return}
    const db=e.target.closest('#dp-grid button[data-i]');if(db){const i=+db.dataset.i;if(!pend||!pend.half){pend=[i,i];pend.half=true}else{const a=pend[0];pend=[Math.min(a,i),Math.max(a,i)]}drawPicker();return}
    if(e.target.closest('#dp-apply')){const r=pend||[F.d0,F.d1];setRange(r[0],r[1])}});
  document.addEventListener('click',e=>{if(!$('#dp-pop').hidden)openPicker(false);if(!e.target.closest('#search'))$('#q-res').hidden=true});
  document.addEventListener('keydown',e=>{
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#q').focus();$('#q').select();return}
    if(e.key==='Escape'){if(!$('#q-res').hidden){$('#q-res').hidden=true;return}if(!$('#dp-pop').hidden){openPicker(false);$('#dp-btn').focus()}else if(!$('#dw').hidden)closeDrawer()}});
  $('#q').addEventListener('input',runSearch);$('#q').addEventListener('focus',()=>{if($('#q').value)runSearch()});
  $('#q').addEventListener('keydown',e=>{if($('#q-res').hidden)return;
    if(e.key==='ArrowDown'){e.preventDefault();QSEL=Math.min(QRES.length-1,QSEL+1);markSel()}
    else if(e.key==='ArrowUp'){e.preventDefault();QSEL=Math.max(0,QSEL-1);markSel()}
    else if(e.key==='Enter'){e.preventDefault();pickSearch(QSEL)}});
  $('#q-res').addEventListener('click',e=>{const b=e.target.closest('button[data-i]');if(b)pickSearch(+b.dataset.i)});
  $('#scrim').addEventListener('click',closeDrawer);
  $('#btn-method').onclick=openMethod;
  $('#btn-theme').onclick=()=>setTheme(effTheme()==='dark'?'light':'dark');
  let saved=null;try{saved=localStorage.getItem('si-theme')}catch(e){}if(saved)setTheme(saved);
  {const b=$('.brand').cloneNode(true);b.classList.add('top-brand');b.querySelector('clipPath').id='lg-clip2';b.querySelector('g[clip-path]').setAttribute('clip-path','url(#lg-clip2)');$('.topbar').prepend(b)}
  $('#mob-mods').innerHTML=$$('#mods a').map(a=>`<a href="${a.getAttribute('href')}" data-r="${a.dataset.r}">${a.querySelector('span').textContent}</a>`).join('');
  $('#src-n').textContent=`${fmt(NS)} сессий · ${fmt(NE)} событий`;
}
addEventListener('hashchange',render);
// modules re-render themselves (tabs, widget changes): keep the title in the page header
new MutationObserver(()=>{const h=$('#view > .head');if(h&&h.querySelector('h1'))hoistHead()}).observe(document.getElementById('view'),{childList:true});
(async()=>{
  try{await loadData()}catch(err){$('#loading').innerHTML=`<b>Не удалось загрузить данные.</b><span>Обновите страницу. (${esc(err.message)})</span>`;return}
  initUI();refreshAll();
})();
