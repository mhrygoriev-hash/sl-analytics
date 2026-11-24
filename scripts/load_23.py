# Load stat_clicks_page_23.11_allbrands.xlsx (sheet "general", 42 columns, all brands) -> brand slottica, slottica.com only
import time, sys, pandas as pd, collections
from python_calamine import CalamineWorkbook
f=sys.argv[1] if len(sys.argv)>1 else 'raw/stat_clicks_page_23.11_allbrands.xlsx'
out=sys.argv[2] if len(sys.argv)>2 else 'work/new23_raw.pkl'
t=time.time()
wb=CalamineWorkbook.from_path(f);sh=wb.get_sheet_by_name('general')
it=sh.iter_rows();hdr=next(it);ix={h:i for i,h in enumerate(hdr)}
keep=['event_date','event_datetime','brand','event_name','user_pseudo_id','user_id','session_id','session_number','filter_value','filter_period',
      'button_name','game_name','game_category','game_start_mode','page_location','page_title','hostname','page_referrer','percent_scrolled',
      'site_language','logged_in','device_category','operating_system','browser','country','city','interaction_source','interaction_target',
      'interaction_action','interaction_entity','session_source','session_medium']
cols={k:[] for k in keep};hosts=collections.Counter();dates=collections.Counter();brands=collections.Counter();n=0
hi=ix['hostname'];di=ix['event_date'];bi=ix['brand']
for r in it:
    n+=1;b=str(r[bi]).lower();brands[b]+=1
    if b!='slottica':continue
    h=r[hi];hosts[h]+=1
    if h!='slottica.com':continue
    dates[str(r[di])]+=1
    for k in keep:cols[k].append(r[ix[k]])
print('rows',n,'t',round(time.time()-t,1))
print('brands',brands.most_common(6))
print('slottica hosts',hosts.most_common(8))
print('slottica.com dates',sorted(dates.items()))
df=pd.DataFrame(cols);df.to_pickle(out);print('slottica.com rows',len(df))
