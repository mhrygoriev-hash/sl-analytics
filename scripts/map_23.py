# Map stat_clicks_page_23.11_allbrands.xlsx rows (brand slottica, slottica.com) to the unified schema and append to sl.pkl
import pandas as pd, numpy as np, shutil, os
W='work/'
FILE='stat_clicks_page_23.11_allbrands.xlsx'
d=pd.read_pickle(W+'new23_raw.pkl')
sc=d[d.event_name=='scroll_depth'].copy()          # real scroll depth (25/50/75/90%) — only for metrics
sc[['event_date','event_datetime','user_pseudo_id','session_id','page_location','percent_scrolled','device_category','logged_in','user_id']].to_pickle(W+'scroll23.pkl')
d=d[~d.event_name.isin(['session_start','sign_up_submit','scroll_depth'])].copy()
o=pd.DataFrame()
o['date']=pd.to_datetime(d.event_date)
o['ts']=pd.to_datetime(d.event_datetime,format='mixed')
o['event']=d.event_name.astype(str)
o['upid']=d.user_pseudo_id.astype(str)
o['uid']=d.user_id.astype(str)
li=pd.to_numeric(d.logged_in,errors='coerce')
o['logged']=np.where(li.notna(),li.fillna(0),(d.user_id.astype(str).str.len()>0).astype(int)).astype(int)
o['source']=d.interaction_source.astype(str);o['target']=d.interaction_target.astype(str);o['action']=d.interaction_action.astype(str)
o['value']=d.filter_value.astype(str)
o['url']=d.page_location.astype(str);o['title']=d.page_title.astype(str);o['referrer']=d.page_referrer.astype(str);o['button']=d.button_name.astype(str)
o['device']=d.device_category.astype(str);o['os']=d.operating_system.astype(str);o['country']=d.country.astype(str);o['city']=d.city.astype(str)
o['tsrc']=d.session_source.astype(str).replace({'(not set)':''});o['tmed']=d.session_medium.astype(str).replace({'(not set)':''})
o['sid']=pd.to_numeric(d.session_id,errors='coerce').fillna(0).astype('int64')
o['entity']=d.interaction_entity.astype(str);o['game']=d.game_name.astype(str);o['gmode']=d.game_start_mode.astype(str)
o['file']=FILE;o['brand']='slottica';o['lang']=d.site_language.astype(str);o['host']='slottica.com'
if not os.path.exists(W+'sl_upto15.pkl'):shutil.copy(W+'sl.pkl',W+'sl_upto15.pkl')
old=pd.read_pickle(W+'sl_upto15.pkl')
o=o[old.columns]
allv=pd.concat([old,o],ignore_index=True)
allv.to_pickle(W+'sl.pkl');print(len(old),len(o),len(allv));print(allv.file.value_counts())
