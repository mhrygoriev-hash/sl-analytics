# Build the session/event dataset for the Slottica Insights page
import pandas as pd, numpy as np, json, re, collections
s=pd.read_pickle('work/sl.pkl')
s=s[s.event!='start_game'].copy()
s['key']=s.upid+'|'+s.sid.astype(str)
BASE=pd.Timestamp('2026-10-26 00:00:00')-pd.Timedelta(hours=2)   # 26.10 00:00 Kyiv in UTC
s['t']=(s.ts-BASE).dt.total_seconds()
s=s.sort_values(['key','t'],kind='stable').reset_index(drop=True)

# ---------- paths ----------
LANGS='es|en|pt|pl|ru|uk|kk|de|fr|it|tr|fi|az|uz|hy|ro|cs|hu|ja|ko|ar|id|vi|th|no|sv|el|bg|sk|sl|hr|sr|lt|lv|et|be|ka|bn|hi|ms|tl|nl|da|he|fa|ur|zh'
s['path']=s.url.str.replace(r'^https?://[^/]+','',regex=True).str.replace(r'[?#].*$','',regex=True)
s['lang']=s.path.str.extract(r'^/([a-z]{2})(?=/|$)')[0].fillna('')
s['np']=s.path.str.replace(r'^/(%s)(?=/|$)'%LANGS,'',regex=True)
s.loc[s.np.isin(['','/']),'np']='/'
s['np']=s.np.str.replace(r'(?<=.)/$','',regex=True)
gm=s.np.str.extract(r'^/game/([^/]+)/([^/]+)/(real|demo)')
isg=gm[0].notna()
s.loc[isg,'np']='/game/'+gm[0][isg]+'/'+gm[1][isg]+'/'+gm[2][isg]
s['succ']=s.url.str.extract(r'[?&]success=(true|false)')[0].fillna('')

# ---------- page labels ----------
PL={'/':'Главная','/games/all':'Каталог · Все игры','/games/recent':'Каталог · Недавние','/games/new_games':'Каталог · Новые','/games/popular':'Каталог · Популярные',
 '/games/favorite':'Каталог · Избранное','/games/recommended':'Каталог · Рекомендуемые','/games/jackpots':'Каталог · Джекпоты','/games/low_bets':'Каталог · Низкие ставки',
 '/games/live_casino':'Каталог · Live-казино','/games/mini_games':'Каталог · Мини-игры','/games/crashgames':'Каталог · Crash-игры','/games/table':'Каталог · Настольные','/games':'Каталог',
 '/promo':'Акции','/player/news':'Сообщения','/player/news-view':'Сообщение','/player/periodic-cashback':'Кешбэк','/player/profile':'Профиль','/player/documents-upload':'Загрузка документов',
 '/player/questionnaire':'Анкета','/player/personal-statistics':'Личная статистика','/player/gaming-limits':'Игровые лимиты','/player/change-password':'Смена пароля','/player/responsible-gaming':'Ответственная игра',
 '/player/self-exclude':'Самоисключение','/player/activity-history':'История активности','/player/self-assessment':'Самооценка','/sports-book/pre-match':'Спорт · прематч','/sports-book/live':'Спорт · live','/esports':'Киберспорт',
 '/application':'Приложение','/download':'Скачать приложение','/rules':'Правила','/faq':'FAQ','/error/multiaccount':'Ошибка: мультиаккаунт','/info/referal-program':'Реферальная программа',
 '/responsible':'Ответственная игра','/contacts':'Контакты','/aboutus':'О нас','/privacy':'Конфиденциальность','/sportbook-rules':'Правила ставок','/auth/socials':'Вход через соцсети','/game/exit-from-game':'Выход из игры'}
# categories: 0 home 1 catalog-all 2 catalog-other 3 game-real 4 game-demo 5 promo 6 player 7 news 8 sport 9 app 10 info 11 error 12 other
def pcat(p):
    if p=='/':return 0
    if p=='/games/all' or p.startswith('/games/all/'):return 1
    if p.startswith('/games'):return 2
    if p.startswith('/game/') and p.endswith('/real'):return 3
    if p.startswith('/game/') and p.endswith('/demo'):return 4
    if p.startswith('/promo'):return 5
    if p.startswith('/player/news'):return 7
    if p.startswith('/player'):return 6
    if p.startswith('/sports') or p.startswith('/esports'):return 8
    if p in('/application','/download'):return 9
    if p.startswith('/error'):return 11
    if p in('/rules','/faq','/info/referal-program','/responsible','/contacts','/aboutus','/privacy','/sportbook-rules'):return 10
    return 12
titles=s[(s.event=='page_view')&(s.title!='')].groupby('np').title.agg(lambda x:x.value_counts().index[0]).to_dict()
PROV={'pragmaticplay':'Pragmatic Play','3oaksgaming':'3 Oaks','playson':'Playson','pgsoft':'PG Soft','amusnet':'Amusnet','kendoo':'Kendoo','bgmng':'BGaming','gamesglobal':'Games Global','tadagaming':'TaDa Gaming','endorphina':'Endorphina','novomatic':'Novomatic','playngo':"Play'n GO",'betsoft':'Betsoft','amigogaming':'Amigo Gaming','evoplay':'Evoplay','netgame':'NetGame','spinomenal':'Spinomenal','booongo':'Booongo','hacksaw':'Hacksaw','nolimit':'Nolimit City','relax':'Relax Gaming','belatra':'Belatra','fugaso':'Fugaso','rubyplay':'Ruby Play','penguinking':'Penguin King','kalambagames':'Kalamba','1spin4win':'1spin4win','heavenof7':'Heaven of 7','egtdigital':'EGT Digital','onlyplay':'OnlyPlay','platipus':'Platipus','thunderkick':'Thunderkick','mancalagaming':'Mancala','bigtimegaming':'Big Time Gaming','pateplay':'Pateplay','gamingcorps':'Gaming Corps','enjoygaming':'Enjoy Gaming','clawbuster':'Clawbuster','amatic':'Amatic','soko':'Soko'}
def plabel(p):
    if p in PL:return PL[p]
    m=re.match(r'^/game/([^/]+)/([^/]+)/(real|demo)$',p)
    if m:
        t=titles.get(p,'')
        t=re.sub(r'\s+(de|by|от|di|von|from|na|w|в)\s+Slottica.*$','',t,flags=re.I).strip()
        if not t:
            slug=re.sub(r'-[a-z0-9]{2}$','',m.group(2));t=slug.replace('-',' ').title()
        return t+' · '+PROV.get(m.group(1),m.group(1))+(' · демо' if m.group(3)=='demo' else '')
    m=re.match(r'^/games/([^/]+)/(.+)$',p)
    if m:return PL.get('/games/'+m.group(1),'Каталог · '+m.group(1))+' · '+PROV.get(m.group(2),m.group(2))
    return titles.get(p,p)

# ---------- dedupe tracking duplicates ----------
isclick=~s.event.isin(['page_view','first_visit','cashbox_deposit'])
s['el0']=s.event+'|'+s.source+'|'+s.target+'|'+s.action+'|'+s.button
s['dtel']=s.groupby(['key','el0']).t.diff()
dup_click=isclick&(s.dtel<0.1)
pvm=s.event=='page_view'
s['dtpv']=np.nan
pv=s[pvm]
prev_url=pv.groupby('key').url.shift();prev_t=pv.groupby('key').t.shift()
dup_pv=pd.Series(False,index=s.index);dup_pv.loc[pv.index]=(pv.url==prev_url)&((pv.t-prev_t)<1)
dupc=collections.Counter(s[dup_click].event);print('dup clicks',dup_click.sum(),'dup pv',dup_pv.sum())
DUPS={'clicks':int(dup_click.sum()),'pv':int(dup_pv.sum())}
newsess=set(s[s.event=='first_visit'].key)
s=s[~(dup_click|dup_pv)&(s.event!='first_visit')].reset_index(drop=True)

# ---------- elements ----------
NAV={'games_all':'Игры','live_casino':'Live-казино','sports_book':'Спорт','esports':'Киберспорт','crashgames':'Crash-игры','promo':'Акции','application':'Приложение','calendar':'Календарь','cashbox_deposit':'Депозит','bonuses':'Бонусы','news_catalog':'Новости','player_menu':'Профиль'}
BLK={'recent':'Недавние игры','new':'Новые игры','popular':'Популярные игры','extra_section':'Доп. подборка','all':'Все игры','live_casino':'Live-казино','favorite':'Избранное'}
HOMEG={'home_recent_games':'recent','home_new_games':'new','home_popular_games':'popular','home_extra_section_games':'extra_section','home_all_games':'all','home_live_casino_games':'live_casino','home_favorite_games':'favorite'}
CATN={'recent':'Недавние','new_games':'Новые','popular':'Популярные','favorite':'Избранное','recommended':'Рекомендуемые','jackpots':'Джекпоты','low_bets':'Низкие ставки','mini_games':'Мини-игры','live_casino':'Live-казино','crashgames':'Crash-игры','table':'Настольные','':'без раздела'}
BTN={'jugar':'Играть','play':'Играть','играть':'Играть','descargar':'Скачать','download':'Скачать','скачать':'Скачать','obtener':'Получить','get':'Получить','получить':'Получить','zdobądź':'Получить','conectar':'Подключить','connect':'Подключить','подключить':'Подключить','invita':'Пригласить','invite':'Пригласить','пригласить':'Пригласить','подробнее':'Подробнее'}
FLT={'game_provider_types':'Провайдеры','game_feature_types':'Характеристики','game_genre_types':'Жанры','game_type_types':'Типы игр','active_bonus':'С активным бонусом','bonus_buy':'Bonus Buy'}
TOUR={'info_click':'Инфо','prize_click':'Призы','dropdown_click':'Раскрыть','cashbox_deposit_click':'Депозит'}
PRM={'offers':'Предложения','lotteries':'Лотереи','tournaments':'Турниры','calendar':'Календарь'}
def element(r):
    e,src,tg,ac,bt=r.event,r.source,r.target,r.action,r.button
    if e=='navigation_click':
        if src=='header_menu':return('hdr_'+tg,'Шапка · '+NAV.get(tg,tg),'Шапка','')
        if src=='mobile_sidebar':return('sb_'+tg,'Бургер-меню · '+NAV.get(tg,tg),'Бургер-меню','sidebar_total')
        return('nav_other','Меню · другое','Шапка','')
    if e=='cashbox_deposit':
        how=('из меню' if src in('header_menu','mobile_sidebar') else 'из поиска' if src.startswith('search') else 'из турнира' if src=='tournaments' else 'после регистрации' if 'registration' in src else 'из блока игр' if tg=='real' else 'без источника' if not src else 'другое')
        return('cash:'+how,'Касса открыта · '+how,'Касса','')
    if e=='game_item_click':
        if src in HOMEG:b=HOMEG[src];return('g_'+b,'Главная · '+BLK[b],'Игры на главной','')
        if src=='game_catalogue_all':return('g_game_catalogue_all','Каталог · сетка игр','Каталог','')
        if src.startswith('game_catalogue_'):x=src[15:];return('gc_'+x,'Каталог «'+CATN.get(x,x)+'» · карточка','Каталог','')
        if src=='search_game_modal':return('search_game','Поиск · игра из результатов','Поиск','search')
        if src=='game_page_search_games':return('gp_search','Страница игры · поиск','Страница игры','')
        if src.startswith('game_page_'):return('gp_other','Страница игры · блок игр','Страница игры','')
        if src=='promo_custom_tournament_card':return('g_promo_custom_tournament_card',"Акции · Season's Battle · игры",'Турниры','')
        if src in('promo_tournament_card','home_tournament_card'):return('g_promo_tournament_card','Турниры · «Juegos de torneo»','Турниры','')
        if 'modal' in src:return('post_modal_games','Окно после входа/регистрации · игры','Модалки','')
        return('g_other','Карточка игры · другое','Каталог','')
    if e=='banner_click':b=BTN.get(bt.strip().lower(),bt or 'кнопка');return('bn_'+b,'Слайдер · «'+b+'»','Слайдер','slider')
    if e=='promo_click':return('pr_'+ac,'Промо-блок · '+PRM.get(ac,ac),'Промо-блок','promo')
    if e=='provider_click':return('prov:'+tg,'Футер · '+PROV.get(tg,tg),'Футер','prov')
    if e=='tournament_click':return('tour_'+ac,'Турниры · '+TOUR.get(ac,ac),'Турниры','tour')
    if e in('more_click','title_click'):
        b=HOMEG.get(src);pre='mr_' if e=='more_click' else 'tt_'
        if b:return(pre+b,'Блок «'+BLK[b]+'» · '+('«Más»' if e=='more_click' else 'заголовок'),'Игры на главной','g_'+b)
        return(pre+'other','Блок статистики · заголовок','Контент','')
    if e=='period_filter_click':return('wins_'+src,'Выигрыши · фильтр периода','Контент','wins')
    if e=='filters_tag_select':return('flt_'+tg,'Фильтры · '+FLT.get(tg,tg),'Фильтры','flt_all')
    if e=='filters_sort_click':return('flt_sort','Фильтры · Сортировка','Фильтры','flt_all')
    if e=='filters_toggle_click':return('flt_'+tg,'Фильтры · '+FLT.get(tg,tg),'Фильтры','flt_all')
    if e=='filters_clear_all_click':return('flt_clear','Фильтры · Сбросить','Фильтры','flt_all')
    if e=='filters_close':return('flt_close','Фильтры · Закрыть','Фильтры','flt_all')
    if e=='search_close':return('search_close','Поиск · закрыть без выбора','Поиск','search')
    if e=='search_open':return('search_open','Поиск · открыть','Поиск','search')
    if e=='filters_open':return('flt_open','Фильтры · Открыть панель','Фильтры','flt_all')
    if e=='search_tab_click':return('search_tab_'+('prov' if tg=='providers' else 'games'),'Поиск · вкладка «'+('Провайдеры' if tg=='providers' else 'Игры')+'»','Поиск','search')
    if e=='search_random_game_click':return('search_random','Поиск · случайная игра','Поиск','search')
    if e=='modal_click':
        if src=='registration_modal':return('md_'+ac,'Регистрация · '+{'submit':'Отправить','close':'Закрыть'}.get(ac,ac),'Регистрация','')
        if src=='registration_interrupted_modal':return('md_int_'+('reg' if ac=='registration' else ac),'Окно прерывания · '+{'registration':'Вернуться','close':'Закрыть'}.get(ac,PRM.get(ac,ac)),'Регистрация','')
        if src=='account_complete_required_modal':return('md_save','Заполнение профиля · Сохранить','Регистрация','')
        return('md_post_'+ac,'Окно после регистрации · '+{'opt_in':'Согласие на рассылку','banner_deposit':'Баннер депозита','deposit_with_bonus':'Депозит с бонусом','deposit_without_bonus':'Депозит без бонуса','popular_games':'Популярные игры'}.get(ac,ac),'Регистрация','')
    if e=='modal_close':return('md_post_close','Окно после регистрации · Закрыть','Регистрация','')
    return('other:'+e,e,'Другое','')

EV=['page_view','game_item_click','navigation_click','cashbox_deposit','banner_click','promo_click','provider_click','tournament_click','more_click','title_click','period_filter_click','filters','search','modal_click','modal_close','pay_ok','pay_fail','other']
def etype(e):
    if e in EV:return EV.index(e)
    if e.startswith('filters_'):return EV.index('filters')
    if e.startswith('search_'):return EV.index('search')
    return EV.index('other')

nonpv=s.event!='page_view'
els=s[nonpv].apply(element,axis=1)
s['elk']='';s.loc[nonpv,'elk']=[x[0] for x in els]
ELD={}
for x in els:
    if x[0] not in ELD:ELD[x[0]]=x
s['k']=s.event.map(etype)

# ---------- payment returns (synthetic events) ----------
s['prevurl']=s.groupby('key').url.shift().fillna('')
PAY=r'peaky|checkout|somosmach|transbank|paidpays|marvelpay|paycart|commercepay|khipu|payin|cashier|webpay'
# 11–15.11: session_source is session-scoped, so only page_referrer marks a return from the gateway
SESS_SRC={'stat_clicks_pages_11.11_slottica.xlsx','stat_clicks_page_23.11_allbrands.xlsx'}
payret=(s.event=='page_view')&(s.succ!='')&(s.referrer.str.contains(PAY)|((~s.file.isin(SESS_SRC))&s.tsrc.str.contains(PAY)))
pr=s[payret].copy();pr['k']=np.where(pr.succ=='true',EV.index('pay_ok'),EV.index('pay_fail'));pr['t']=pr.t-0.001;pr['event']=np.where(pr.succ=='true','pay_ok','pay_fail');pr['elk']=pr.event
ELD['pay_ok']=('pay_ok','Возврат с платёжки · success=true','Оплата','');ELD['pay_fail']=('pay_fail','Возврат с платёжки · success=false','Оплата','')
ETY={k:None for k in ELD}
s=pd.concat([s,pr]).sort_values(['key','t'],kind='stable').reset_index(drop=True)
print('pay returns',collections.Counter(pr.event))

# ---------- frustration signals ----------
F_RAGE,F_REP,F_UTURN,F_QGAME,F_PAYF,F_ERR,F_REGX,F_SRCH=1,2,4,8,16,32,64,128
flags=np.zeros(len(s),dtype=np.int64)
clk=s[~s.event.isin(['page_view','cashbox_deposit','pay_ok','pay_fail'])]
for (k,e),d in clk.groupby(['key','elk'],sort=False):
    if len(d)<2:continue
    t=d.t.values;idx=d.index.values;i=0
    while i<len(t)-1:
        j=i
        while j+1<len(t) and t[j+1]-t[j]<=2.5:j+=1
        n=j-i+1
        if n>=3 and t[j]-t[i]<=5:flags[idx[i:j+1]]|=F_RAGE
        elif n>=2:flags[idx[i:j+1]]|=F_REP
        i=j+1
pvs=s[s.event=='page_view']
qg_dw=[]
for k,d in pvs.groupby('key',sort=False):
    p=d.np.values;t=d.t.values;idx=d.index.values
    # collapse consecutive same page
    keep=[0]+[i for i in range(1,len(p)) if p[i]!=p[i-1]]
    p=p[keep];t=t[keep];idx=idx[keep]
    for i in range(len(p)):
        if i+1<len(p) and p[i].startswith('/game/'):
            dw=t[i+1]-t[i];qg_dw.append(dw)
            if dw<=10:flags[idx[i]]|=F_QGAME
        if 0<i<len(p)-1 and p[i+1]==p[i-1] and not p[i].startswith('/game/') and t[i+1]-t[i]<=7:flags[idx[i+1]]|=F_UTURN
print('game dwell pct',np.percentile(qg_dw,[5,10,25,50]))
flags[(s.event=='pay_fail').values]|=F_PAYF
flags[((s.event=='page_view')&s.np.str.startswith('/error')).values]|=F_ERR
flags[s.elk.isin(['md_close','md_int_close']).values]|=F_REGX
flags[(s.elk=='search_close').values]|=F_SRCH
s['f']=flags

# ---------- sessions ----------
s['uidn']=s.uid.str.replace('PLAYER-','',regex=False)
g=s.groupby('key',sort=False)
S=pd.DataFrame({'t0':g.t.min(),'t1':g.t.max(),'n':g.size(),'auth':g.uidn.agg(lambda x:int((x!='').any())),
  'dev':g.device.first(),'country':g.country.agg(lambda x:x[x!=''].iloc[0] if (x!='').any() else ''),
  'os':g.os.agg(lambda x:x[x!=''].iloc[0] if (x!='').any() else ''),
  'lang':g.lang.agg(lambda x:x[x!=''].iloc[0] if (x!='').any() else ''),
  'date':g.date.min(),'file':g.file.first(),
  'user':g.apply(lambda d:(d.uidn[d.uidn!=''].iloc[0] if (d.uidn!='').any() else 'g:'+d.upid.iloc[0])),
  'src0':g.apply(lambda d:next(((a,b) for a,b in zip(d.tsrc,d.tmed) if a and not re.search(r'peaky|checkout|somosmach|transbank|paidpays|marvelpay|paycart|commercepay|khipu|identomat|socauth|accounts\.google',a)),('',''))),
  'fl':g.f.agg(lambda x:int(np.bitwise_or.reduce(x.values)))})
def chan(x):
    a,b=x
    a=a.lower()
    if not a or a=='(not set)':return 'Нет данных'
    if a=='(direct)':return 'Прямой заход'
    if a=='google':return 'Google'
    if a in('bing','cl.search.yahoo.com','yahoo','duckduckgo','yandex') or 'search' in a:return 'Другие поисковики'
    if a=='trigger' or b in('email','push','sms'):return 'Email / push / SMS'
    if 'chatgpt' in a or b=='ai-assistant' or 'perplexity' in a:return 'AI-ассистенты'
    if 'beti.io' in a:return 'Бэк-офис'
    if a.startswith('game_') or a.startswith('home_'):return 'Нет данных'
    return 'Рефералы'
S['src']=S.src0.map(chan)
S['new']=[int(k in newsess) for k in S.index]
days=sorted(S.date.unique());DAYS=[pd.Timestamp(d).strftime('%Y-%m-%d') for d in days]
S['day']=S.date.map(lambda d:DAYS.index(pd.Timestamp(d).strftime('%Y-%m-%d')))
S['devi']=S.dev.map({'mobile':0,'desktop':1}).fillna(2).astype(int)
# quick bounce
pvcount=s[s.event=='page_view'].groupby('key').size().reindex(S.index).fillna(0)
nclick=s[~s.event.isin(['page_view','cashbox_deposit','pay_ok','pay_fail'])].groupby('key').size().reindex(S.index).fillna(0)
S['bounce']=((pvcount<=1)&(nclick==0)&((S.t1-S.t0)<10)).astype(int)
F_BOUNCE=256
S['fl']=S.fl|(S.bounce*F_BOUNCE)
# ---------- suspected bots / synthetic monitoring ----------
# desktop guests that come back 5+ times, see only the home page and do nothing but submit the registration form
pvs=s[s.event=='page_view'].groupby('key').np.agg(lambda x:set(x)).reindex(S.index)
homeonly=pvs.map(lambda p:isinstance(p,set) and p<={'/'})
elsets=s[s.elk!=''].groupby('key').elk.agg(lambda x:set(x)).reindex(S.index)
REGEL={'md_submit','md_close','md_int_close','md_int_reg'}
regonly=elsets.map(lambda p:(not isinstance(p,set)) or p<=REGEL)
ug=pd.DataFrame({'user':S.user,'auth':S.auth,'home':homeonly.astype(float),'reg':regonly.astype(float),'desk':(S.dev=='desktop').astype(float)}).groupby('user').agg(n=('auth','size'),auth=('auth','max'),home=('home','mean'),reg=('reg','mean'),desk=('desk','mean'))
BOTU=set(ug[(ug.n>=5)&(ug.auth==0)&(ug.home>=.8)&(ug.reg>=.9)&(ug.desk==1)].index)
S['bot']=S.user.isin(BOTU).astype(int)
print('suspected bot users',len(BOTU),'sessions',int(S.bot.sum()))
# frustration score 1..5
cnt=lambda m:s[(s.f&m)>0].groupby('key').size().reindex(S.index).fillna(0)
sc=1+np.minimum(cnt(F_RAGE),6)*0.6+np.minimum(cnt(F_REP),4)*0.35+np.minimum(cnt(F_UTURN),4)*0.6+np.minimum(cnt(F_QGAME),4)*0.3+np.minimum(cnt(F_PAYF),3)*1.2+cnt(F_ERR).clip(0,2)*1.2+np.minimum(cnt(F_REGX),3)*0.8+np.minimum(cnt(F_SRCH),4)*0.3
S['score']=np.clip(np.round(sc),1,5).astype(int)
print(S.score.value_counts().sort_index())
S=S.sort_values('t0')

# ---------- dictionaries ----------
def dic(series,top=None,other='Другие'):
    vc=series.value_counts()
    keys=list(vc.index if top is None else vc.index[:top])
    return keys
CO=dic(S.country,25);CO=[c for c in CO if c]
SRC=['Google','Прямой заход','Другие поисковики','Email / push / SMS','AI-ассистенты','Рефералы','Бэк-офис','Нет данных']
LG=[l for l in dic(S.lang,12) if l]
OSL=[o for o in dic(S.os) if o]
pages=list(s.np.value_counts().index)
pidx={p:i for i,p in enumerate(pages)}
ELK=sorted(ELD.keys(),key=lambda k:-(s.elk==k).sum());eidx={k:i+1 for i,k in enumerate(ELK)}
ETY=s[s.elk!=''].groupby('elk').k.agg(lambda x:sorted(set(x)))
assert all(len(v)==1 for v in ETY), ETY[ETY.map(len)>1]
ETY=ETY.map(lambda v:v[0]).to_dict()
users=list(S.user.unique());uidx={u:i for i,u in enumerate(users)}

# ---------- encode ----------
order={k:i for i,k in enumerate(S.index)}
s['so']=s.key.map(order);s=s.sort_values(['so','t'],kind='stable')
t0=S.t0.reindex(s.key).values
E_t=np.floor(s.t.values-t0+1e-6).astype(int).clip(0)
E_k=s.k.values.astype(int);E_p=s.np.map(pidx).values.astype(int);E_z=s.elk.map(lambda k:eidx.get(k,0)).values.astype(int);E_f=s.f.values.astype(int)
start=np.r_[0,np.cumsum(S.n.reindex(S.index).values+0)][:-1]
# n changed by synthetic events -> recompute
sizes=s.groupby('so').size().reindex(range(len(S))).values
start=np.r_[0,np.cumsum(sizes)][:-1]
ED=E_t.copy();ED[1:]=E_t[1:]-E_t[:-1];ED[start]=E_t[start]
assert (ED>=0).all()
def ix(lst,v,fallback):return lst.index(v) if v in lst else fallback
out={
 'meta':{'days':DAYS,'base':'2026-10-26T00:00:00+02:00','dups':DUPS,'generated':'2026-11-24','scope':'slottica.com, все языки, бренд Slottica'},
 'ev':EV,
 'pages':[[p,plabel(p),pcat(p)] for p in pages],
 'el':[['','','','',0]]+[list(ELD[k])+[int(ETY[k])] for k in ELK],
 'co':CO,'src':SRC,'lg':LG,'os':OSL,
 'S':{'d':S.day.tolist(),'t':(S.t0.values).astype(int).tolist(),'dur':np.round(S.t1-S.t0).astype(int).tolist(),'dv':S.devi.tolist(),'au':S.auth.astype(int).tolist(),
      'co':[ix(CO,c,-1) for c in S.country],'sr':[SRC.index(x) for x in S.src],'lg':[ix(LG,l,-1) for l in S.lang],'os':[ix(OSL,o,-1) for o in S.os],
      'nw':S.new.tolist(),'u':[uidx[u] for u in S.user],'e0':start.astype(int).tolist(),'en':sizes.astype(int).tolist(),'sc':S.score.tolist(),'fl':S.fl.astype(int).tolist(),'bt':S.bot.astype(int).tolist()},
 'E':{'dt':ED.tolist(),'p':E_p.tolist(),'z':E_z.tolist(),'f':[[int(i),int(E_f[i])] for i in np.nonzero(E_f)[0]]}
}
js=json.dumps(out,ensure_ascii=False,separators=(',',':'))
open('data/sessions.json','w').write(js)
import gzip;gzip.open('data/sessions.json.gz','wb',compresslevel=9).write(js.encode('utf-8'))
print('sessions',len(S),'events',len(s),'pages',len(pages),'elements',len(ELK),'users',len(users),'bytes',len(js.encode()))
s.to_pickle('work/events_final.pkl');S.to_pickle('work/sessions_final.pkl')
