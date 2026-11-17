# Load stat_clicks_pages_11.11_slottica.xlsx (40 columns) into the unified schema, keeping slottica.com only
import time, pandas as pd, numpy as np, collections
from python_calamine import CalamineWorkbook
f='raw/stat_clicks_pages_11.11_slottica.xlsx'
t=time.time()
wb=CalamineWorkbook.from_path(f);sh=wb.get_sheet_by_name('Аркуш1')
it=sh.iter_rows();hdr=next(it);ix={h:i for i,h in enumerate(hdr)}
keep=['event_date','event_datetime','brand','event_name','user_pseudo_id','user_id','session_id','value','filter_period','button_name','game_name','game_start_mode','page_location','page_title','hostname','page_referrer','site_language','logged_in','device_category','operating_system','country','city','interaction_source','interaction_target','interaction_action','session_source','session_medium','event_source','event_medium','user_source','user_medium','session_number']
cols={k:[] for k in keep};hosts=collections.Counter();dates=collections.Counter();brands=collections.Counter();n=0
hi=ix['hostname'];di=ix['event_date'];bi=ix['brand']
for r in it:
    n+=1;h=r[hi];hosts[h]+=1;dates[str(r[di])]+=1;brands[r[bi]]+=1
    if h!='slottica.com':continue
    for k in keep:cols[k].append(r[ix[k]])
print('rows',n,'t',round(time.time()-t,1))
print('dates',sorted(dates.items()))
print('brands',brands.most_common(5))
print('hosts',hosts.most_common(8))
df=pd.DataFrame(cols);df.to_pickle('work/new_raw.pkl');print('slottica.com rows',len(df))
