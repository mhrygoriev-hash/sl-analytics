# Load the three GA exports into one unified pickle (Slottica brand only, all domains kept with a flag)
import sys, re, zipfile, time, pickle
import pandas as pd, numpy as np
from python_calamine import CalamineWorkbook
from lxml import etree
UP='raw/'
OUT='work/'
COLS=['date','ts','event','upid','uid','logged','source','target','action','value','sid','url','title','referrer','button','device','os','country','city','tsrc','tmed','game','gmode','file']

def load_sheet(fn):
    t=time.time()
    wb=CalamineWorkbook.from_path(UP+fn)
    rows=wb.get_sheet_by_name('Аркуш1').to_python()
    hdr=rows[0]; df=pd.DataFrame(rows[1:],columns=hdr); del rows
    print(fn,len(df),'rows',time.time()-t,flush=True)
    o=pd.DataFrame()
    o['date']=pd.to_datetime(df['event_date'])
    o['ts']=pd.to_datetime(df['event_datetime'],format='mixed')
    o['event']=df['event_name'].astype(str)
    o['upid']=df['user_pseudo_id'].astype(str)
    o['uid']=df['user_id'].astype(str)
    o['logged']=(o['uid'].str.len()>0).astype(int)
    for a,b in [('source','source'),('target','target'),('action','action'),('value','value'),('url','page_location'),('title','page_title'),('referrer','page_referrer'),('button','button_name'),('device','device_category'),('os','operating_system'),('country','country'),('city','city'),('tsrc','traffic_source'),('tmed','traffic_medium')]:
        o[a]=df[b].astype(str)
    o['sid']=pd.to_numeric(df['session_id'],errors='coerce').fillna(0).astype('int64')
    o['entity']=df['entity'].astype(str)
    o['game']='';o['gmode']=''
    o['file']=fn
    return o

def load_pivot(fn):
    t=time.time()
    z=zipfile.ZipFile(UP+fn)
    d=etree.fromstring(z.read('xl/pivotCache/pivotCacheDefinition1.xml'))
    ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    fields=[];shared=[]
    for cf in d.find('m:cacheFields',ns):
        fields.append(cf.get('name'))
        si=cf.find('m:sharedItems',ns)
        items=[]
        if si is not None:
            for it in si:
                tag=etree.QName(it).localname
                items.append(None if tag=='m' else it.get('v'))
        shared.append(items)
    print(fields)
    recs=[]
    with z.open('xl/pivotCache/pivotCacheRecords1.xml') as f:
        for ev,el in etree.iterparse(f,events=('end',),tag='{%s}r'%ns['m']):
            row=[]
            for i,c in enumerate(el):
                tag=etree.QName(c).localname
                if tag=='x': row.append(shared[i][int(c.get('v'))])
                elif tag=='m': row.append(None)
                else: row.append(c.get('v'))
            recs.append(row)
            el.clear()
            while el.getprevious() is not None: del el.getparent()[0]
    df=pd.DataFrame(recs,columns=fields); del recs
    print(fn,len(df),'rows',time.time()-t,flush=True)
    df=df.fillna('')
    o=pd.DataFrame()
    o['date']=pd.to_datetime(df['event_date'].str[:10])
    o['ts']=pd.to_datetime(df['event_datetime'],format='mixed')
    o['event']=df['event_name']
    o['upid']=df['user_pseudo_id'].astype(float).astype(str)
    o['uid']=df['user_id']
    li=pd.to_numeric(df['logged_in'],errors='coerce')
    o['logged']=np.where(li.notna(),li.fillna(0),(df['user_id'].str.len()>0).astype(int)).astype(int)
    o['source']=df['interaction_source'];o['target']=df['interaction_target'];o['action']=df['interaction_action']
    o['value']=df['filter_period'];o['url']=df['page_location'];o['title']='';o['referrer']=''
    o['button']=df['button_name'];o['device']=df['device_category'];o['os']='';o['country']=df['country'];o['city']=''
    o['tsrc']=df['traffic_source_event'];o['tmed']=''
    o['sid']=pd.to_numeric(df['session_id'],errors='coerce').fillna(0).astype('int64')
    o['entity']='';o['game']=df['game_name'];o['gmode']=df['game_start_mode']
    o['brand']=df['brand'].str.lower()
    o['lang']=df['site_language']
    o['file']=fn
    return o

parts=[load_sheet('26.10.2026-28.10.26.xlsx'),load_sheet('29.10.2026-04.11.26.xlsx'),load_pivot('09.11.26.xlsx')]
for p in parts:
    if 'brand' not in p: p['brand']=''
    if 'lang' not in p: p['lang']=''
df=pd.concat(parts,ignore_index=True)
df.to_pickle(OUT+'all_raw.pkl')
print(df.shape)
