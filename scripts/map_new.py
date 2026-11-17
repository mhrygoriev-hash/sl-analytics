import pandas as pd, numpy as np
d=pd.read_pickle('work/new_raw.pkl')
d=d[~d.event_name.isin(['session_start','sign_up_submit'])].copy()
o=pd.DataFrame()
o['date']=pd.to_datetime(d.event_date)
o['ts']=pd.to_datetime(d.event_datetime,format='mixed')
o['event']=d.event_name.astype(str)
o['upid']=d.user_pseudo_id.astype(str)
o['uid']=d.user_id.astype(str)
li=pd.to_numeric(d.logged_in,errors='coerce')
o['logged']=np.where(li.notna(),li.fillna(0),(d.user_id.astype(str).str.len()>0).astype(int)).astype(int)
o['source']=d.interaction_source.astype(str);o['target']=d.interaction_target.astype(str);o['action']=d.interaction_action.astype(str)
o['value']=d.value.astype(str)
o['url']=d.page_location.astype(str);o['title']=d.page_title.astype(str);o['referrer']=d.page_referrer.astype(str);o['button']=d.button_name.astype(str)
o['device']=d.device_category.astype(str);o['os']=d.operating_system.astype(str);o['country']=d.country.astype(str);o['city']=d.city.astype(str)
ss=d.session_source.astype(str).replace({'(not set)':''});sm=d.session_medium.astype(str).replace({'(not set)':''})
o['tsrc']=ss;o['tmed']=sm
o['sid']=pd.to_numeric(d.session_id,errors='coerce').fillna(0).astype('int64')
o['entity']='';o['game']=d.game_name.astype(str);o['gmode']=d.game_start_mode.astype(str)
o['file']='stat_clicks_pages_11.11_slottica.xlsx';o['brand']='slottica';o['lang']=d.site_language.astype(str);o['host']='slottica.com'
old=pd.read_pickle('work/sl.pkl')
import shutil,os
if not os.path.exists('work/sl_old.pkl'):shutil.copy('work/sl.pkl','work/sl_old.pkl')
old=pd.read_pickle('work/sl_old.pkl')
print(old.columns.tolist());print(o.columns.tolist())
o=o[old.columns]
allv=pd.concat([old,o],ignore_index=True)
allv.to_pickle('work/sl.pkl');print(len(old),len(o),len(allv))
