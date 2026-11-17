import pandas as pd, numpy as np, json, sys
pd.set_option('display.width',250)
s=pd.read_pickle('work/events_final.pkl'); S=pd.read_pickle('work/sessions_final.pkl')
s=s.reset_index(drop=True)
s['day']=s.key.map(S.day); s['dev']=s.key.map(S.devi); s['au']=s.key.map(S.auth); s['user']=s.key.map(S.user)
CLICKX={'page_view','cashbox_deposit','pay_ok','pay_fail','first_visit'}
s['isclick']=~s.event.isin(CLICKX)
s['isgame']=s.np.str.startswith('/game/')&s.np.str.endswith('/real')
FULL=[0,1,3,4,6,7,8,10,11,12,13]  # full days (28.10, 4.11, 9.11, 15.11 partial)
def M(days,label):
    D=set(days);ss=S[S.day.isin(D)];e=s[s.day.isin(D)];n=len(ss);r={'label':label,'sessions':n,'users':ss.user.nunique()}
    full=[d for d in days if d in FULL];r['sess_day_full']=round(len(S[S.day.isin(full)])/max(1,len(full)),0) if full else None
    r['desk_day_full']=round(len(S[S.day.isin(full)&(S.devi==1)])/max(1,len(full)),0) if full else None
    r['mob%']=round((ss.devi==0).mean()*100,1);r['chile%']=round((ss.country=='Chile').mean()*100,1);r['auth%']=round(ss.auth.mean()*100,1)
    up=ss.groupby('user').size().sort_values(ascending=False);r['top10users_sess%']=round(up.head(int(len(up)*.1)).sum()/up.sum()*100,1)
    pv=e[e.k==0];r['pv']=len(pv);r['pv/sess']=round(len(pv)/n,2);r['cl/sess']=round(e.isclick.sum()/n,2);r['med_dur']=round(float(np.median(ss.t1-ss.t0)),0)
    gs=e[(e.k==0)&e.isgame];gkeys=set(gs.key);r['game%']=round(len(gkeys)/n*100,1)
    r['game%_dev']={dv:round(ss[ss.devi==dv].index.isin(gkeys).mean()*100,1) for dv in [0,1]}
    ttg=gs.groupby('key').t.min()-S.t0.reindex(list(gkeys)).values;r['ttg_med']=round(float(np.median(ttg)),1)
    gc=e[e.k==1];r['game_clicks']=len(gc);vc=gc.elk.value_counts();r['g_recent%']=round(vc.get('g_recent',0)/len(gc)*100,1);r['recent_all%']=round((vc.get('g_recent',0)+vc.get('gc_recent',0))/len(gc)*100,1)
    r['g_recent']=int(vc.get('g_recent',0));r['gp_search']=int(vc.get('gp_search',0))
    cat=gc[gc.elk.str.startswith('gc_')|(gc.elk=='g_game_catalogue_all')];cv=cat.elk.value_counts(normalize=True)*100
    r['cat_shares']={k:round(cv.get(k,0),1) for k in ['g_game_catalogue_all','gc_recent','gc_new_games']}
    r['gc_new%all']=round(vc.get('gc_new_games',0)/len(gc)*100,1)
    # replay
    allg=s[(s.k==0)&s.isgame].sort_values('ts');allg['seen']=allg.duplicated(['user','np'])
    r['replay%']=round(allg[allg.day.isin(D)].seen.mean()*100,1)
    vcg=gs.np.value_counts();r['distinct_games']=len(vcg);r['top10%']=round(vcg.head(10).sum()/vcg.sum()*100,1);r['top50%']=round(vcg.head(50).sum()/vcg.sum()*100,1)
    # after game
    nx=[];dw=[];dpg=[]
    for k,dd in e[e.k==0].groupby('key',sort=False):
        p=dd.np.values;t=dd.t.values
        gset=set(x for x in p if x.startswith('/game/') and x.endswith('/real'))
        if gset:dpg.append(len(gset))
        for i in range(len(p)-1):
            if p[i].startswith('/game/') and p[i+1]!=p[i]:
                dw.append(t[i+1]-t[i])
                q=p[i+1];nx.append('game' if q.startswith('/game/') else ('/games/all' if q.startswith('/games/all') else q))
    nxs=pd.Series(nx).value_counts(normalize=True)*100
    r['after_game']={k:round(nxs.get(k,0),1) for k in ['/','/games/all','/games/recent','game']};r['game_dwell_med']=round(float(np.median(dw)),0);r['games_per_gsess']=round(float(np.mean(dpg)),1)
    # home
    home=e[e.np=='/'];hc=home[home.isclick];hp=home[home.k==0]
    for dv in [0,1]:
        x=hc[hc.dev==dv];t=x.elk.value_counts(normalize=True)*100
        r[f'home_sh_{dv}']={k:round(t.get(k,0),1) for k in ['g_recent','hdr_bonuses','g_new','hdr_cashbox_deposit','g_popular','hdr_games_all','sb_sports_book','g_extra_section','g_all','g_live_casino']}
        r[f'home_cl/pv_{dv}']=round(len(x)/max(1,len(hp[hp.dev==dv])),2)
        r[f'home_sess_click%_{dv}']=round(x.key.nunique()/max(1,hp[hp.dev==dv].key.nunique())*100,1)
    bn=hc[hc.elk.str.startswith('bn_')];r['slider/100pv']=round(len(bn)/len(hp)*100,2)
    gk=gs.url.str.extract(r'analyticsKey=([a-z_]+)')[0];allgp=e[(e.k==0)&e.np.str.startswith('/game/')];gk2=allgp.url.str.extract(r'analyticsKey=([a-z_]+)')[0]
    r['winners_launch']=int((gk2=='home_winners_games').sum());r['winners%']=round((gk2=='home_winners_games').mean()*100,1);r['home_new_launch%']=round((gk2=='home_new_games').mean()*100,1);r['home_pop_launch%']=round((gk2=='home_popular_games').mean()*100,1)
    mr=e[e.elk.str.startswith('mr_')];r['mas_total']=len(mr);r['mas_new']=int((mr.elk=='mr_new').sum());r['mas_recent']=int((mr.elk=='mr_recent').sum());r['tt_fav']=int((e.elk=='tt_favorite').sum())
    # bonuses
    b=e[e.elk.isin(['hdr_bonuses','sb_bonuses'])];r['bonus_clicks']=len(b);r['bonus_sess%']=round(b.key.nunique()/n*100,1);r['bonus_per_bsess']=round(len(b)/max(1,b.key.nunique()),2);r['bonus/sess']=round(len(b)/n,3)
    hb=e[e.elk=='hdr_bonuses'].copy();hb['gap']=hb.groupby('key').t.diff();r['bonus_gap_med']=round(float(hb.gap.median()),1);r['bonus_gap_p25']=round(float(hb.gap.quantile(.25)),1)
    keys=s.key.values;ks=s.k.values;els=s.elk.values;ts=s.t.values;nps=s.np.values;ev=s.event.values
    nxt=[]
    for i in b.index:
        j=i+1;lab='end'
        while j<len(s) and keys[j]==keys[i]:
            if ts[j]-ts[i]>300:lab='pause';break
            if ks[j]==0 and nps[j]==nps[i]:j+=1;continue
            lab='game' if (ks[j]==0 and nps[j].startswith('/game/')) else ('bonus' if els[j] in('hdr_bonuses','sb_bonuses') else ('cash' if (ev[j]=='cashbox_deposit' or els[j] in('hdr_cashbox_deposit','sb_cashbox_deposit')) else 'other'));break
        nxt.append(lab)
    nb=pd.Series(nxt).value_counts(normalize=True)*100;r['after_bonus']={k:round(nb.get(k,0),1) for k in ['bonus','game','cash']}
    # payments
    po=e[e.event.isin(['pay_ok','pay_fail'])].copy();r['pay_ok']=int((po.event=='pay_ok').sum());r['pay_fail']=int((po.event=='pay_fail').sum());r['fail%']=round(r['pay_fail']/max(1,len(po))*100,2)
    po['gw']=np.where(po.referrer.str.contains('://'),po.referrer.str.extract(r'^https?://([^/?#]+)')[0],po.tsrc)
    g=po.groupby('gw').event.agg(lambda x:(len(x),round((x=='pay_fail').mean()*100,1))).sort_values(key=lambda x:x.map(lambda v:-v[0])).head(5);r['gw']={k:v for k,v in g.items()}
    r['pay_per_day']=round(len(po)/len(days),0)
    r['pay_ok_sess%']=round(ss.index.isin(po[po.event=='pay_ok'].key).mean()*100,1)
    res=[]
    for i in po.index[po.event=='pay_fail']:
        j=i+1;ok=cash=False
        while j<len(s) and keys[j]==keys[i] and ts[j]-ts[i]<=900:
            if ev[j]=='pay_ok':ok=True
            if ev[j]=='cashbox_deposit':cash=True
            j+=1
        res.append((ok,cash))
    if res:rr=np.array(res);r['after_fail_ok15%']=round(rr[:,0].mean()*100,1);r['after_fail_cash15%']=round(rr[:,1].mean()*100,1)
    g10=[]
    for i in po.index[po.event=='pay_ok']:
        j=i+1;v=None
        while j<len(s) and keys[j]==keys[i] and ts[j]-ts[i]<=600:
            if ev[j]=='page_view' and nps[j].startswith('/game/'):v=ts[j]-ts[i];break
            j+=1
        g10.append(v)
    g10=pd.Series(g10);r['after_ok_game10%']=round(g10.notna().mean()*100,1);r['after_ok_game_med']=round(float(g10.median()),0)
    # cashbox (days with cashbox events)
    cdays=[d for d in days if d<=5 or d>=10];cs=S[S.day.isin(cdays)];ce=s[s.day.isin(cdays)]
    if len(cs):
        ck=set(ce[ce.event=='cashbox_deposit'].key);r['cash_sess%_dev']={dv:round(cs[cs.devi==dv].index.isin(ck).mean()*100,1) for dv in [0,1]}
        okk=set(ce[ce.event=='pay_ok'].key);r['cash->ok%']=round(len(ck&okk)/max(1,len(ck))*100,1);cb=ce[ce.event=='cashbox_deposit'];r['cash_nosrc%']=round((cb.elk=='cash:без источника').mean()*100,1);r['cash_sess%']=round(cs.index.isin(ck).mean()*100,1)
    # frustration
    r['uturn%']=round(((ss.fl&4)>0).mean()*100,1);r['uturn_dev']={dv:round(((ss[ss.devi==dv].fl&4)>0).mean()*100,1) for dv in [0,1]}
    rows=[]
    for k,dd in e[e.k==0].groupby('key',sort=False):
        p=dd.np.values;f=dd.f.values
        keep=[0]+[i for i in range(1,len(p)) if p[i]!=p[i-1]]
        for a,i in enumerate(keep):
            if f[i]&4 and a>=2:
                A=p[keep[a-2]];B=p[keep[a-1]];rows.append(('game' if A.startswith('/game/') else A,'game' if B.startswith('/game/') else B))
    u=pd.Series(rows).value_counts();r['uturn_n']=int(u.sum());r['uturn_top']=[(a,b,int(c)) for (a,b),c in u.head(5).items()]
    r['rep_sess']=int(((ss.fl&2)>0).sum());r['rep%']=round(((ss.fl&2)>0).mean()*100,1);r['rage_sess']=int(((ss.fl&1)>0).sum())
    gv=e[(e.k==0)&e.np.str.startswith('/game/')];r['qexit%']=round(((gv.f&8)>0).mean()*100,2)
    r['score3%']=round((ss.score>=3).mean()*100,2);r['bounce%']=round(ss.bounce.mean()*100,1)
    r['bounce_au']={a:round(ss[ss.auth==a].bounce.mean()*100,1) for a in [0,1]}
    # search
    r['search_sess%']=round(e[e.elk.str.startswith('search')].key.nunique()/n*100,1)
    r['search_sess%_dev']={dv:round(e[e.elk.str.startswith('search')&(e.dev==dv)].key.nunique()/max(1,(ss.devi==dv).sum())*100,1) for dv in [0,1]}
    pk=(e.elk=='search_game').sum();cl=(e.elk=='search_close').sum();r['search_pick']=int(pk);r['search_close']=int(cl);r['search_close%']=round(cl/max(1,pk+cl)*100,1)
    r['tab_prov']=int((e.elk=='search_tab_prov').sum());r['tab_games']=int((e.elk=='search_tab_games').sum());r['search_open']=int((e.elk=='search_open').sum())
    # filters (days with filter events)
    fd=[d for d in days if d<=5 or d>=10];fe=s[s.day.isin(fd)]
    f=fe[fe.event.str.startswith('filters_')];allc=fe[(fe.k==0)&fe.np.str.startswith('/games/all')].key.nunique()
    r['flt_sess']=f.key.nunique();r['flt_sess%']=round(f.key.nunique()/max(1,allc)*100,1);r['flt_tag']=int((f.event=='filters_tag_select').sum());r['flt_close']=int((f.event=='filters_close').sum());r['flt_open']=int((f.event=='filters_open').sum())
    r['flt_prov']=f[f.event=='filters_tag_select'].value.value_counts().head(5).to_dict()
    # registration (days with modal events)
    rd=[d for d in days if d<=5 or d>=10];re_=s[s.day.isin(rd)]
    def ks_(x):return set(re_[re_.elk==x].key)
    sub=ks_('md_submit');r['reg_submit_sess']=len(sub);r['reg_close_sess']=len(ks_('md_close'));r['int_close_sess']=len(ks_('md_int_close'));r['int_reg_sess']=len(ks_('md_int_reg'))
    sv=re_[re_.elk=='md_save'];r['save_clicks']=len(sv);r['save_sess']=sv.key.nunique();sv=sv.copy();sv['gap']=sv.groupby('key').t.diff();r['save_gap_med']=round(float(sv.gap.median()),0) if len(sv) else None
    cash=set(re_[re_.event=='cashbox_deposit'].key);ok=set(re_[re_.event=='pay_ok'].key);sav=ks_('md_save')
    r['reg->save']=len(sub&sav);r['reg->cash']=len(sub&cash);r['reg->ok']=len(sub&ok);r['reg_mob%']=round(S.loc[list(sub)].devi.eq(0).mean()*100,0) if sub else None
    # ordered funnel
    cnt=0
    for k in sub:
        dd=s[s.key==k];step=0
        for el,evn in zip(dd.elk.values,dd.event.values):
            if step==0 and el=='md_submit':step=1
            elif step==1 and el=='md_save':step=2
            elif step==2 and evn=='cashbox_deposit':step=3
            elif step==3 and evn=='pay_ok':step=4;break
        if step==4:cnt+=1
    r['reg_ordered']=cnt
    er=e[(e.k==0)&e.np.str.startswith('/error')];r['err_sess']=er.key.nunique();r['err_guest']=er[er.au==0].key.nunique()
    # audience
    cl_=e[e.country=='Chile'].groupby('key').ts.min();hr=((cl_-pd.Timedelta(hours=3)).dt.hour).value_counts(normalize=True)*100
    r['peak19_01%']=round(sum(hr.get(h,0) for h in [19,20,21,22,23,0]),1)
    r['google%']=round((ss.src=='Google').mean()*100,1);r['nodata%']=round((ss.src=='Нет данных').mean()*100,1)
    pwa=set(e[e.url.str.contains('standalone=true')].key);r['pwa%']=round(ss.index.isin(pwa).mean()*100,1)
    r['app_page%']=round(e[(e.k==0)&e.np.isin(['/application','/download'])].key.nunique()/n*100,1)
    sp=e[(e.k==0)&e.np.str.startswith('/sports')];r['sports_sess_day']=round(sp.key.nunique()/len(days),0)
    r['guest%']=round((1-ss.auth.mean())*100,1)
    r['flt_sessions_days']=len(fd)
    return r
out={}
for lab,days in [('all',list(range(15))),('cur',[10,11,12,13,14]),('base',list(range(10))),('p12',list(range(6))),('p3',[6,7,8,9])]:
    out[lab]=M(days,lab);print(lab,'done',flush=True)
json.dump(out,open('work/metrics.json','w'),ensure_ascii=False,indent=0,default=lambda o:int(o) if isinstance(o,(np.integer,)) else float(o))
