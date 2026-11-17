/* heatmaps: click, rage and scroll maps on page screenshots */
'use strict';
// zone geometry on screenshots (from the Slottica.com Heatmap dashboard): [key,x,y,w,h,type,label]
const DS=.625;const dz=(k,x,y,w,h,t,l)=>[k,x*DS,y*DS,w*DS,h*DS,t,l];
const LZ={
 m_page:{img:'img/m_page.jpg',W:375,H:5205,fold:690,z:[['sidebar_total',8,6,40,40,'','Бургер-меню'],['search',319,6,40,40,'','Поиск'],['slider',295,322,48,48,'','Главный слайдер · кнопка баннера'],
  ['g_recent',16,523,343,149,'cards','Juegos recientes · Недавние игры'],['g_favorite',16,732,343,149,'cards','Favoritos · Избранное'],['g_popular',16,940,343,149,'cards','Juegos populares · Популярные'],['g_new',16,1149,343,149,'cards','Nuevos juegos · Новые'],
  ['promo',16,1528,343,130,'','Promociones · промо-блок'],['g_extra_section',16,1716,343,149,'cards','Juegos con bonificación activa · доп. подборка'],['g_all',16,1924,343,149,'cards','Todos los juegos · Все игры'],['g_live_casino',16,2570,343,149,'cards','En vivo · Live-казино'],
  ['wins',88,2834,200,32,'','Mejores ganancias · фильтр периода'],['tour',16,3140,320,530,'','Torneos · Турниры'],['prov',16,4381,343,380,'','Proveedores · футер']]},
 m_bar:{img:'img/m_bar.jpg',W:375,H:72,bar:1,z:[['hdr_cashbox_deposit',6,16,185,40,'up','Нижняя панель · Депозит'],['hdr_games_all',222,16,40,40,'up','Нижняя панель · Игры'],['hdr_bonuses',309,16,40,40,'up','Нижняя панель · Бонусы']]},
 d_page:{img:'img/d_page.jpg',W:790,H:3489,fold:450,z:[dz('hdr_games_all',212,20,53,24,'','Меню · Juegos'),dz('hdr_live_casino',281,20,87,24,'','Меню · Live Dealers'),dz('hdr_sports_book',384,20,65,24,'','Меню · Deportes'),dz('hdr_esports',465,20,55,24,'','Меню · Esports'),
  dz('hdr_crashgames',536,20,120,24,'','Меню · Juegos de Crash'),dz('hdr_promo',672,20,128,24,'','Меню · Promociones'),dz('hdr_application',816,20,118,24,'','Меню · Приложение'),
  dz('hdr_bonuses',960,12,90,40,'','Шапка · Бонусы'),dz('hdr_cashbox_deposit',1063,12,84,40,'','Шапка · Депозит'),dz('hdr_player_menu',1155,12,70,40,'','Шапка · Профиль'),
  dz('slider',88,321,140,48,'','Главный слайдер · кнопка'),dz('g_recent',32,672,1201,210,'cards','Juegos recientes · Недавние'),dz('g_favorite',32,956,1201,210,'cards','Favoritos · Избранное'),
  dz('g_popular',32,1348,1201,175,'cards','Juegos populares · Популярные'),dz('g_new',32,1627,1201,175,'cards','Nuevos juegos · Новые'),dz('promo',70,2070,1120,110,'','Promociones · промо-блок'),
  dz('g_extra_section',32,2284,1201,175,'cards','Juegos con bonificación activa'),dz('g_all',32,2564,1201,175,'cards','Todos los juegos · Все игры'),dz('g_live_casino',32,3395,1201,175,'cards','En vivo · Live'),
  dz('wins',1032,3657,200,32,'','Mejores ganancias · фильтр периода'),dz('tour',32,4064,1201,450,'','Torneos · Турниры'),dz('prov',24,5028,1217,248,'','Proveedores · футер')]}
};
{const sh=(arr,cut,dy,drop)=>arr.filter(a=>!drop.includes(a[0])).map(a=>a[2]>cut?[a[0],a[1],a[2]-dy,...a.slice(3)]:a);
 LZ.m_page_g={img:'img/m_page_guest.jpg',W:375,H:4788,fold:690,z:sh(LZ.m_page.z,479,417,['g_recent','g_favorite'])};
 LZ.m_bar_g={img:'img/m_bar.jpg',W:375,H:72,bar:1,z:[['hdr_games_all',222,16,40,40,'up','Нижняя панель · Игры'],['hdr_promo',309,16,40,40,'up','Нижняя панель · Акции']]};
 LZ.d_page_g={img:'img/d_page_guest.jpg',W:790,H:3000,fold:450,z:sh(LZ.d_page.z,320,489.4,['g_recent','g_favorite','hdr_bonuses','hdr_cashbox_deposit','hdr_player_menu'])};
 const HD=LZ.d_page.z.filter(a=>a[0].startsWith('hdr_')),noAuth=z=>z.filter(a=>!['hdr_bonuses','hdr_cashbox_deposit','hdr_player_menu'].includes(a[0]));
 LZ.c_m_page={img:'img/m_cat.jpg',W:375,H:4420,fold:690,z:[['sidebar_total',8,6,40,40,'','Бургер-меню'],['search',319,6,40,40,'','Поиск'],['flt_all',16,164,343,40,'','Кнопка «Filtros» (все клики в фильтрах)'],['g_game_catalogue_all',16,236,352,2560,'grid','Сетка игр'],['prov',16,3628,343,380,'','Proveedores · футер']]};
 LZ.c_m_page_g=LZ.c_m_page;
 LZ.c_m_flt={img:'img/m_cat_flt.jpg',W:330,H:580,panel:1,z:[['flt_close',270,18,44,36,'','Фильтры · Закрыть'],['flt_sort',20,92,284,48,'','Фильтры · Сортировка'],['flt_active_bonus',20,160,284,53,'','Фильтры · С активным бонусом'],['flt_bonus_buy',20,233,284,53,'','Фильтры · Bonus Buy'],['flt_clear',210,328,94,32,'up','Фильтры · Сбросить'],['flt_game_provider_types',20,372,284,200,'','Фильтры · Провайдеры']]};
 const cd=[...HD,dz('search',1028,184,40,40,'','Поиск'),dz('flt_all',1073,184,160,40,'','Кнопка «Filtros» (все клики в фильтрах)'),dz('g_game_catalogue_all',32,248,1201,2097,'grid','Сетка игр'),dz('prov',24,3023,1217,340,'','Proveedores · футер')];
 LZ.c_d_page={img:'img/d_cat.jpg',W:790,H:2274,fold:450,z:cd};LZ.c_d_page_g={img:'img/d_cat.jpg',W:790,H:2274,fold:450,z:noAuth(cd)};
 LZ.c_d_flt={img:'img/d_cat_flt.jpg',W:196,H:562,panel:1,z:[['flt_close',168,8,24,26,'','Фильтры · Закрыть'],['flt_sort',12,54,178,34,'','Фильтры · Сортировка'],['flt_active_bonus',12,106,178,30,'','Фильтры · С активным бонусом'],['flt_bonus_buy',12,152,178,30,'','Фильтры · Bonus Buy'],['flt_clear',128,203,58,22,'up','Фильтры · Сбросить'],['flt_game_provider_types',12,232,178,262,'','Фильтры · Провайдеры'],['flt_game_feature_types',12,528,178,30,'up','Фильтры · Характеристики']]};
 LZ.p_m_page={img:'img/m_promo.jpg',W:375,H:4043,fold:690,z:[['sidebar_total',8,6,40,40,'','Бургер-меню'],['search',319,6,40,40,'','Поиск'],['promo',0,68,375,298,'','Карточки разделов: Season\'s Battle, Lotería, Torneos, Bonos'],['g_promo_custom_tournament_card',16,426,343,500,'','Season\'s Battle · карточка турнира'],['tour',16,1456,320,480,'','Torneos · карточки турниров'],['g_promo_tournament_card',16,1940,320,46,'','Torneos · «Juegos de torneo»'],['prov',16,3260,343,380,'','Proveedores · футер']]};
 LZ.p_m_page_g=LZ.p_m_page;
 const pd=[...HD,dz('pr_calendar',45,256,261,109,'','Карточка «Season\'s Battle»'),dz('pr_lotteries',363,256,247,109,'','Карточка «Lotería»'),dz('pr_tournaments',654,256,261,109,'','Карточка «Torneos»'),dz('pr_offers',960,256,261,109,'','Карточка «Bonos»'),
   dz('g_promo_custom_tournament_card',32,456,1201,526,'','Season\'s Battle · карточка турнира'),dz('tour',32,1500,1201,380,'','Torneos · карточки турниров'),dz('g_promo_tournament_card',32,1880,1201,34,'','Torneos · «Juegos de torneo»'),dz('prov',24,3110,1217,260,'','Proveedores · футер')];
 LZ.p_d_page={img:'img/d_promo.jpg',W:790,H:2319,fold:450,z:pd};LZ.p_d_page_g={img:'img/d_promo.jpg',W:790,H:2319,fold:450,z:noAuth(pd)};
}
// layers per page/device: [main, ...others]; guest variant picks *_g where it exists
const HMP={home:{name:'Главная',url:'slottica.com/es',m:['m_page','m_bar'],d:['d_page']},cat:{name:'Каталог игр',url:'slottica.com/es/games/all',m:['c_m_page','m_bar'],d:['c_d_page'],pm:'c_m_flt',pd:'c_d_flt'},promo:{name:'Акции',url:'slottica.com/es/promo',m:['p_m_page','m_bar'],d:['p_d_page']}};
function layerName(n,guest){return guest&&LZ[n+'_g']?n+'_g':n}
// resolve element index -> zone key within a layer (cached)
const ZC={};
function zoneOf(layer,z){
  const c=ZC[layer]||(ZC[layer]={});if(z in c)return c[z];
  const L=LZ[layer],keys=new Set(L.z.map(a=>a[0]));const e=EL[z];let r=null;
  if(keys.has(e[0]))r=e[0];else if(e[3]&&keys.has(e[3]))r=e[3];
  else if(e[0].startsWith('pr_')&&keys.has('promo'))r='promo';
  return c[z]=r;
}
function zoneRect(layer,key){const a=LZ[layer].z.find(q=>q[0]===key);return a?{x:a[1],y:a[2],w:a[3],h:a[4],t:a[5],l:a[6]}:null}

/* palette: deep blue → red, the usual heat convention */
const PAL=(()=>{const st=[[0,[30,42,160]],[.18,[31,123,255]],[.36,[39,225,232]],[.54,[87,227,90]],[.7,[247,234,58]],[.85,[255,138,31]],[1,[232,24,30]]];const out=new Uint8ClampedArray(256*3);
  for(let i=0;i<256;i++){const t=i/255;let j=0;while(j<st.length-2&&t>st[j+1][0])j++;const[a,ca]=st[j],[b,cb]=st[j+1],f=(t-a)/(b-a);for(let k=0;k<3;k++)out[i*3+k]=ca[k]+(cb[k]-ca[k])*f}return out})();
function heatRGB(t){const i=Math.max(0,Math.min(255,Math.round(t*255)))*3;return [PAL[i],PAL[i+1],PAL[i+2]]}
function rng(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return((h^=h>>>16)>>>0)/4294967296}}

const HM={page:'home',mode:'click',dev:0,other:null,all:false};
let HMDATA=null;
function hmDev(){return F.dev==='all'?HM.dev:+F.dev}
function hmGuest(){return F.au==='0'}
// aggregate clicks per element on the chosen page
function hmAggregate(){
  const dev=hmDev(),cnt={},rage={},sess={},users={};let pv=0,clicks=0;const sessWithClick=new Set(),sessPV=new Set();
  const want=HM.other!==null?(p=>P_grp[p]===HM.other):(p=>P_hm[p]===HM.page);
  for(const s of ACT){if(S_dv[s]!==dev)continue;const a=S_e0[s],b=a+S_en[s];
    for(let e=a;e<b;e++){if(!want(E_p[e]))continue;const k=E_k[e];
      if(k===0){pv++;sessPV.add(s);continue}
      if(!isClickK(k))continue;const z=E_z[e];clicks++;sessWithClick.add(s);
      cnt[z]=(cnt[z]||0)+1;if(E_f[e]&(FL.RAGE|FL.REP))rage[z]=(rage[z]||0)+1;
      (sess[z]||(sess[z]=new Set())).add(s)}}
  return {dev,cnt,rage,sess,pv,clicks,sessWithClick:sessWithClick.size,sessPV:sessPV.size};
}
function layerValues(layer,src){const v={};for(const z in src){const k=zoneOf(layer,+z);if(k)v[k]=(v[k]||0)+src[z]}return v}

function renderHeatmaps(){
  const view=$('#view');
  const others=hmOtherPages();
  view.innerHTML=`
  <div class="head"><div><h1>Тепловые карты</h1><p>Куда нажимают игроки на скриншотах реальных страниц. Каждая зона — элемент, который отправляет событие в GTM; цвет и подпись — доля всех кликов на странице. Переключите вид: клики, rage-клики или карта скролла.</p></div></div>
  ${gapWarn('зоны фильтров, промо-блока и турниров за эти дни пустые')}
  <div class="hm-tools">
    <div class="seg" role="group" aria-label="Страница" id="hm-page">${Object.entries(HMP).map(([k,v])=>`<button type="button" data-v="${k}" aria-pressed="${HM.other===null&&HM.page===k}">${v.name}</button>`).join('')}</div>
    <select class="sel" id="hm-other" aria-label="Другая страница"><option value="">Другие страницы…</option>${others.map(o=>`<option value="${o.g}" ${HM.other===o.g?'selected':''}>${esc(o.label)} · ${fmt(o.n)} кл.</option>`).join('')}</select>
    <div class="seg" role="group" aria-label="Вид карты" id="hm-mode"><button type="button" data-v="click" aria-pressed="${HM.mode==='click'}">Клики</button><button type="button" data-v="rage" aria-pressed="${HM.mode==='rage'}">Rage и повторы</button><button type="button" data-v="scroll" aria-pressed="${HM.mode==='scroll'}">Скролл</button></div>
    ${F.dev==='all'?`<div class="seg" role="group" aria-label="Устройство карты" id="hm-dev"><button type="button" data-v="0" aria-pressed="${HM.dev===0}">Mobile</button><button type="button" data-v="1" aria-pressed="${HM.dev===1}">Desktop</button></div>`:''}
  </div>
  <div class="hm-stage" id="hm-stage"></div>`;
  $$('#hm-page button').forEach(b=>b.onclick=()=>{HM.page=b.dataset.v;HM.other=null;renderHeatmaps()});
  $('#hm-other').onchange=e=>{HM.other=e.target.value===''?null:+e.target.value;renderHeatmaps()};
  $$('#hm-mode button').forEach(b=>b.onclick=()=>{HM.mode=b.dataset.v;renderHeatmaps()});
  $$('#hm-dev button').forEach(b=>b.onclick=()=>{HM.dev=+b.dataset.v;renderHeatmaps()});
  HMDATA=hmAggregate();
  const st=$('#hm-stage');
  if(HM.other!==null){st.innerHTML=`<div class="hm-side" style="max-width:760px">${hmStats()}${hmElements()}</div>`;bindHmSide();return}
  const P=HMP[HM.page],dev=HMDATA.dev,guest=hmGuest(),names=(dev?P.d:P.m).map(n=>layerName(n,guest));
  const main=names[0],url=P.url;
  const layersHtml=names.map(n=>`<div class="lv-layer${LZ[n].bar?' lv-bar':''}" data-layer="${n}"><img src="${LZ[n].img}" alt="" width="${LZ[n].W}" height="${LZ[n].H}"><canvas></canvas></div>`).join('');
  const frame=dev?`<div class="browser"><div class="chrome"><i></i><i></i><i></i><span>${url}</span></div><div class="lv-scroll" tabindex="0" aria-label="${P.name}, десктоп">${layersHtml}</div></div>`
                 :`<div class="phone"><div class="lv-scroll" tabindex="0" aria-label="${P.name}, мобильная версия">${layersHtml}</div></div>`;
  const pn=dev?P.pd:P.pm;
  const panel=pn&&HM.mode!=='scroll'?`<div class="panel-card"><h3>Панель «Filtros»</h3><p>Открывается кнопкой «Filtros»</p><div class="lv-layer" data-layer="${pn}" style="border-radius:12px;overflow:hidden"><img src="${LZ[pn].img}" alt="Панель фильтров каталога" width="${LZ[pn].W}" height="${LZ[pn].H}"><canvas></canvas></div></div>`:'';
  const legend=HM.mode==='scroll'?`<div class="hm-legend"><span>все просмотры</span><span class="bar" style="background:linear-gradient(90deg,#E8181E,#FF8A1F,#F7EA3A,#57E35A,#27E1E8,#1F7BFF,#1E2AA0)"></span><span>мало</span></div>`
     :`<div class="hm-legend"><span>мало</span><span class="bar"></span><span>много ${HM.mode==='rage'?'rage-кликов и повторов':'кликов'}</span></div>`;
  st.innerHTML=`<div class="hm-col">${frame}${legend}</div>${panel}<div class="hm-side">${hmStats()}${HM.mode==='scroll'?hmScrollTable(main):hmElements(names.concat(pn?[pn]:[]))}</div>`;
  st.querySelectorAll('.lv-layer').forEach(l=>{const img=l.querySelector('img');if(img.complete&&img.naturalWidth)drawLayer(l);else img.addEventListener('load',()=>drawLayer(l),{once:true})});
  bindHmSide();
  st.querySelector('.lv-scroll').addEventListener('click',e=>{const z=e.target.closest('.lz');if(z)openZone(z.dataset.layer,z.dataset.k)});
  st.querySelectorAll('.panel-card').forEach(p=>p.addEventListener('click',e=>{const z=e.target.closest('.lz');if(z)openZone(z.dataset.layer,z.dataset.k)}));
  bindTips(st);
}
function hmOtherPages(){
  const dev=hmDev(),c={};for(const s of ACT){if(S_dv[s]!==dev)continue;const a=S_e0[s],b=a+S_en[s];for(let e=a;e<b;e++){if(!isClickK(E_k[e]))continue;const p=E_p[e];if(P_hm[p])continue;const g=P_grp[p];c[g]=(c[g]||0)+1}}
  return Object.entries(c).map(([g,n])=>({g:+g,n,label:GRP[+g].label})).sort((a,b)=>b.n-a.n).slice(0,25);
}
function hmStats(){
  const D=HMDATA;
  return `<div class="stats">
   <div class="stat"><small>Просмотры страницы</small><strong>${fmt(D.pv)}</strong><em>${DEVN[D.dev]}</em></div>
   <div class="stat"><small>Клики</small><strong>${fmt(D.clicks)}</strong><em>${fmt1(D.pv?D.clicks/D.pv:0)} на просмотр</em></div>
   <div class="stat"><small>Сессии с кликом</small><strong>${pct(D.sessWithClick,D.sessPV)}%</strong><em>${fmt(D.sessWithClick)} из ${fmt(D.sessPV)}</em></div>
   <div class="stat"><small>Rage и повторы</small><strong>${fmt(Object.values(D.rage).reduce((a,b)=>a+b,0))}</strong><em>кликов в сериях</em></div>
  </div>`;
}
function hmElements(layers){
  const D=HMDATA,src=HM.mode==='rage'?D.rage:D.cnt,tot=HM.mode==='rage'?Object.values(D.rage).reduce((a,b)=>a+b,0):D.clicks;
  const rows=Object.entries(src).map(([z,n])=>{z=+z;const on=layers?layers.some(l=>zoneOf(l,z)):false;return [EL[z][1]+(layers&&!on?' · вне скриншота':''),n,null,z]}).sort((a,b)=>b[1]-a[1]);
  return `<div class="card" style="padding:16px"><div class="card-h"><div><h2>${HM.mode==='rage'?'Где кликают повторно':'Все элементы страницы'}</h2><div class="sub">${HM.other!==null?esc(GRP[HM.other].label)+' · ':''}${DEVN[D.dev]} · ${rangeText()} · нажмите на строку или зону</div></div></div><div id="hm-list">${hbars(rows.slice(0,HM.all?rows.length:15),{total:tot,click:true})}</div>${rows.length>15?`<button type="button" class="btn ghost sm" id="hm-all" style="margin-top:12px">${HM.all?'Свернуть':'Показать все '+rows.length}</button>`:''}
  <p class="note">Клики — события GTM (game_item_click, navigation_click, banner_click и др.). «Вне скриншота» — элементы модальных окон, «Más», заголовки блоков и т. п. Дубли трекинга (одинаковое событие чаще, чем раз в 0,1 с) убраны.</p></div>`;
}
function bindHmSide(){
  const list=$('#hm-list');if(!list)return;
  const D=HMDATA,src=HM.mode==='rage'?D.rage:D.cnt;
  const rows=Object.entries(src).map(([z,n])=>[+z,n]).sort((a,b)=>b[1]-a[1]);
  bindRows(list,el=>openElement(rows[+el.dataset.i][0]));
  const ab=$('#hm-all');if(ab)ab.onclick=()=>{HM.all=!HM.all;renderHeatmaps()};
}
function drawLayer(layer){
  const name=layer.dataset.layer,L=LZ[name],D=HMDATA;
  layer.querySelectorAll('.lz,.sm-line').forEach(e=>e.remove());
  const cw=layer.clientWidth,ch=layer.clientHeight,s=cw/L.W,dpr=Math.min(2,window.devicePixelRatio||1);
  const c=layer.querySelector('canvas'),W=Math.round(cw*dpr),H=Math.round(ch*dpr);c.width=W;c.height=H;const ctx=c.getContext('2d');
  if(HM.mode==='scroll'){if(L.bar||L.panel){ctx.clearRect(0,0,W,H);return}drawScroll(layer,L,ctx,W,H,cw,ch);return}
  const vals=layerValues(name,HM.mode==='rage'?D.rage:D.cnt),tot=HM.mode==='rage'?Object.values(D.rage).reduce((a,b)=>a+b,0):D.clicks;
  // max over the main + bar layers so colours compare across them
  let mx=1;
  $$('.hm-stage .lv-layer').forEach(l=>{const v=layerValues(l.dataset.layer,HM.mode==='rage'?D.rage:D.cnt);for(const k in v)mx=Math.max(mx,v[k])});
  for(const [k,x,y,w,h,t,lab] of L.z){
    const v=vals[k]||0;const el=document.createElement('button');el.type='button';el.className='lz'+(t==='up'?' up':'');el.dataset.k=k;el.dataset.layer=name;
    el.style.cssText=`left:${x/L.W*100}%;top:${y/L.H*100}%;width:${w/L.W*100}%;height:${h/L.H*100}%`+(v?'':';opacity:.55');
    el.innerHTML=`<span class="c">${pct(v,tot)}%<small>${fmt(v)}</small></span>`;
    el.dataset.tip=`<b>${esc(lab)}</b><div class="tr"><span>${HM.mode==='rage'?'Rage и повторы':'Клики'}</span><span>${fmt(v)}</span></div><div class="tr"><span>Доля страницы</span><span>${pct(v,tot)}%</span></div><div class="tr"><span>На 100 просмотров</span><span>${pct(v,D.pv)}</span></div><span class="hint">Нажмите — подробности</span>`;
    el.setAttribute('aria-label',`${lab}: ${fmt(v)}`);layer.appendChild(el)}
  const off=document.createElement('canvas');off.width=W;off.height=H;const o=off.getContext('2d');
  for(const [k,x,y,w,h,t] of L.z){
    const v=vals[k]||0;if(!v)continue;
    const X=x*s*dpr,Y=y*s*dpr,Wz=w*s*dpr,Hz=h*s*dpr,tt=Math.log1p(v)/Math.log1p(mx),rnd=rng(HMDATA.dev+k),cards=t==='cards',grid=t==='grid';
    const pts=Math.round((5+90*Math.sqrt(v/mx))*(grid?3:1)),rad=Math.max(14*dpr,Math.min(Math.min(Wz,Hz)*.7,46*dpr));
    const alpha=(.05+.34*tt*tt)*Math.min(1,12/pts+.35);
    for(let i=0;i<pts;i++){
      const fx=cards?Math.pow(rnd(),1.7):grid?rnd():(rnd()+rnd()+rnd())/3,fy=cards?(.15+.55*(rnd()+rnd())/2):grid?Math.pow(rnd(),2.2):(rnd()+rnd())/2;
      const px=X+Wz*(cards||grid?(.04+.92*fx):(.1+.8*fx)),py=Y+Hz*(cards||grid?fy:(.15+.7*fy)),rr=rad*(.6+.6*rnd());
      const g=o.createRadialGradient(px,py,0,px,py,rr);g.addColorStop(0,`rgba(0,0,0,${alpha})`);g.addColorStop(1,'rgba(0,0,0,0)');o.fillStyle=g;o.fillRect(px-rr,py-rr,rr*2,rr*2)}
  }
  const src=o.getImageData(0,0,W,H).data,im=ctx.createImageData(W,H),d=im.data;
  for(let i=0;i<src.length;i+=4){const a=Math.min(255,src[i+3]*1.15|0),p=a*3;d[i]=PAL[p];d[i+1]=PAL[p+1];d[i+2]=PAL[p+2];d[i+3]=a<6?120:Math.min(225,120+a*.5)}
  ctx.putImageData(im,0,0);
}
// scroll: depth reached per page view = max(fold, bottom of the lowest clicked zone)
function scrollDepths(main){
  const L=LZ[main],dev=HMDATA.dev,depths=[];const fold=L.fold/L.H;
  for(const s of ACT){if(S_dv[s]!==dev)continue;const a=S_e0[s],b=a+S_en[s];let cur=-1;
    for(let e=a;e<b;e++){const k=E_k[e],p=E_p[e];
      if(k===0){if(cur>=0)depths.push(cur);cur=P_hm[p]===HM.page?fold:-1;continue}
      if(cur<0||P_hm[p]!==HM.page||!isClickK(k))continue;
      const zk=zoneOf(main,E_z[e]);if(!zk)continue;const r=zoneRect(main,zk);const dd=(r.y+r.h)/L.H;if(dd>cur)cur=Math.min(1,dd)}
    if(cur>=0)depths.push(cur)}
  return depths;
}
function drawScroll(layer,L,ctx,W,H,cw,ch){
  const depths=scrollDepths(layer.dataset.layer),n=depths.length||1;const sorted=Float64Array.from(depths).sort();
  const reach=y=>{let lo=0,hi=sorted.length;while(lo<hi){const m=(lo+hi)>>1;if(sorted[m]<y)lo=m+1;else hi=m}return (sorted.length-lo)/n};
  const gr=ctx.createLinearGradient(0,0,0,H),steps=160;for(let i=0;i<=steps;i++){const y0=i/steps,[R,G,B]=heatRGB(reach(Math.min(.9999,y0)));gr.addColorStop(y0,`rgba(${R},${G},${B},.45)`)}ctx.clearRect(0,0,W,H);ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
  const marks=[[1,'100%'],[.5,'50%'],[.25,'25%'],[.1,'10%'],[.05,'5%']];
  for(const [th,lab] of marks){
    // lowest y where reach >= th
    let lo=0,hi=1;for(let it=0;it<30;it++){const m=(lo+hi)/2;if(reach(m)>=th)lo=m;else hi=m}
    if(th===1)lo=L.fold/L.H;
    const line=document.createElement('div');line.className='sm-line';line.style.top=(lo*100)+'%';line.innerHTML=`<span>${th===1?'Первый экран · 100%':'Дошли '+lab+' просмотров'}</span>`;layer.appendChild(line)}
  layer.dataset.n=depths.length;
}
function hmScrollTable(main){
  const L=LZ[main],depths=scrollDepths(main),n=depths.length;
  const rows=L.z.filter(a=>!a[0].startsWith('hdr_')).map(a=>{const y=(a[2])/L.H;let c=0;for(const d of depths)if(d>=Math.min(1,(a[2]+a[4])/L.H)-1e-9)c++;return [a[6],c,a[2]]}).sort((a,b)=>a[2]-b[2]);
  return `<div class="card" style="padding:16px"><div class="card-h"><div><h2>Глубина просмотра по блокам</h2><div class="sub">${fmt(n)} просмотров · доля, где игрок точно дошёл до блока</div></div></div>
  ${hbars(rows.map(r=>[r[0],r[1]]),{total:n,color:'var(--s1)'})}
  <p class="note">GA не передаёт глубину скролла, поэтому карта восстановлена по действиям: просмотр считается дошедшим до блока, если ниже или на нём был клик. Без клика засчитывается только первый экран. Это нижняя оценка — реальная глубина выше.</p></div>`;
}
function openZone(layer,key){
  $$('.lz.sel').forEach(e=>e.classList.remove('sel'));$$(`.lz[data-k="${key}"]`).forEach(e=>e.classList.add('sel'));
  const D=HMDATA,src=HM.mode==='rage'?D.rage:D.cnt;const zs=Object.keys(src).map(Number).filter(z=>zoneOf(layer,z)===key);
  if(zs.length===1)return openElement(zs[0],key);
  const r=zoneRect(layer,key);const tot=zs.reduce((a,z)=>a+src[z],0);const zSess=new Set();zs.forEach(z=>{if(D.sess[z])D.sess[z].forEach(s=>zSess.add(s))});
  const sorted=zs.map(z=>[z,src[z]]).sort((a,b)=>b[1]-a[1]);
  openDrawer(`<div class="dw-h"><div><h3 id="dw-t">${esc(r?r.l:key)}</h3><p>${DEVN[D.dev]} · ${rangeText()}</p></div><button type="button" class="xbtn" aria-label="Закрыть">×</button></div>
   <div class="stats"><div class="stat"><small>${HM.mode==='rage'?'Rage и повторы':'Клики'}</small><strong>${fmt(tot)}</strong><em>${pct(tot,HM.mode==='rage'?Object.values(D.rage).reduce((a,b)=>a+b,0):D.clicks)}% страницы</em></div><div class="stat"><small>На 100 просмотров</small><strong>${pct(tot,D.pv)}</strong></div></div>
   <section><h4>Из чего состоит зона</h4><div id="dw-zl">${hbars(zs.map(z=>[EL[z][1],src[z]]).sort((a,b)=>b[1]-a[1]),{total:tot,click:true})}</div></section>
   ${zs.length?'':'<p class="note">За выбранный период и фильтры кликов в этой зоне нет.</p>'}
   ${zs.length?`<div><button type="button" class="btn" id="dw-rec">Смотреть записи с кликом в зоне · ${fmt(zSess.size)}</button></div>`:''}`);
  bindRows($('#dw-zl'),el=>openElement(sorted[+el.dataset.i][0]));
  if(zs.length)$('#dw-rec').onclick=()=>{closeDrawer();openRecordingsFor({label:(r?r.l:key),sessions:[...zSess],focusEl:sorted[0][0]})};

}
// element detail: volume, reach, next page, by day, and a jump into recordings
function openElement(z){
  const D=HMDATA,dev=D.dev;const want=HM.other!==null?(p=>P_grp[p]===HM.other):(p=>P_hm[p]===HM.page);
  let n=0;const ss=new Set(),us=new Set(),byDay=new Array(DAYS.length).fill(0),nxt={};let au=0;
  for(const s of ACT){if(S_dv[s]!==dev)continue;const a=S_e0[s],b=a+S_en[s];
    for(let e=a;e<b;e++){if(E_z[e]!==z||!want(E_p[e]))continue;n++;ss.add(s);us.add(S_u[s]);byDay[S_d[s]]++;if(S_au[s])au++;
      for(let j=e+1;j<b&&E_t[j]-E_t[e]<=600;j++){if(E_k[j]===0){const g=P_cat[E_p[j]];const lab=g===3?'Игра (на деньги)':g===4?'Демо-игра':PCAT[g];nxt[lab]=(nxt[lab]||0)+1;break}if(E_k[j]===3){nxt['Касса']=(nxt['Касса']||0)+1;break}}}}
  const days=[];for(let d=F.d0;d<=F.d1;d++)days.push(d);const dmx=Math.max(1,...days.map(d=>byDay[d]));
  const nx=Object.entries(nxt).sort((a,b)=>b[1]-a[1]).slice(0,6),nxTot=Object.values(nxt).reduce((a,b)=>a+b,0);
  openDrawer(`<div class="dw-h"><div><h3 id="dw-t">${esc(EL[z][1])}</h3><p>${HM.other!==null?esc(GRP[HM.other].label):HMP[HM.page].name} · ${DEVN[dev]} · ${rangeText()}</p></div><button type="button" class="xbtn" aria-label="Закрыть">×</button></div>
  <div class="stats">
    <div class="stat"><small>Клики</small><strong>${fmt(n)}</strong><em>${pct(n,D.clicks)}% страницы</em></div>
    <div class="stat"><small>На 100 просмотров</small><strong>${pct(n,D.pv)}</strong></div>
    <div class="stat"><small>Сессии</small><strong>${fmt(ss.size)}</strong><em>${fmt1(ss.size?n/ss.size:0)} кл./сессию</em></div>
    <div class="stat"><small>Игроки</small><strong>${fmt(us.size)}</strong><em>${pct(au,n,0)}% кликов в аккаунте</em></div>
  </div>
  <section><h4>Что дальше <span>следующая страница или касса за 10 мин</span></h4>${hbars(nx,{total:nxTot})}</section>
  <section><h4>По дням</h4><div class="bars">${days.map(d=>`<div><b>${byDay[d]}</b><i style="height:${byDay[d]/dmx*70}%"></i><span>${DAYL[d]}</span></div>`).join('')}</div></section>
  <div><button type="button" class="btn" id="dw-rec">Смотреть записи с этим кликом · ${fmt(ss.size)}</button></div>`);
  $('#dw-rec').onclick=()=>{closeDrawer();openRecordingsFor({label:EL[z][1],sessions:[...ss],focusEl:z})};
}
let hmRz;addEventListener('resize',()=>{clearTimeout(hmRz);hmRz=setTimeout(()=>{if(ROUTE==='heatmaps')$$('.hm-stage .lv-layer').forEach(drawLayer)},180)});
