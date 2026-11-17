import pandas as pd
pd.set_option('display.width',250); pd.set_option('display.max_rows',500)
df=pd.read_pickle('work/all_raw.pkl')
df['host']=df['url'].str.extract(r'^https?://([^/?#]+)')[0].fillna('')
s=df[(df.host=='slottica.com')&((df.brand=='')|(df.brand=='slottica'))].copy()
s.to_pickle('work/sl.pkl')
c=s[~s.event.isin(['page_view','start_game','first_visit'])]
g=c.groupby(['event','source','target','action']).size().reset_index(name='n')
print(g.sort_values(['event','n'],ascending=[True,False]).to_string())
