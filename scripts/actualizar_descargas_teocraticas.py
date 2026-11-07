#!/usr/bin/env python3
"""Recuento de activos publicados en GitHub Releases para Herramientas Teocráticas."""
import datetime as dt
import json
import os
from pathlib import Path
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'herramientas-teocraticas'/'descargas-teocraticas.json'
REPO='pastranaalex-glitch/pastranaalex-glitch.github.io'
TAG='ht-v11.1'
FILES={
 'mis-horas-predicacion':'MisHorasPredicacion_1.5.0_Pack7.7.apk',
 'lector-facil':'LectorFacil-v1.0.5.apk',
 'panel-del-precursor':'PanelDelPrecursor_Setup_2.1.1.exe'
}
def fetch_releases():
    result=[]
    token=os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN') or ''
    for page in range(1,11):
        headers={'Accept':'application/vnd.github+json','User-Agent':'HerramientasTeocraticas-Descargas/1'}
        if token: headers['Authorization']='Bearer '+token
        req=urllib.request.Request('https://api.github.com/repos/'+REPO+'/releases?per_page=100&page='+str(page),headers=headers)
        with urllib.request.urlopen(req,timeout=35) as r: chunk=json.load(r)
        if not isinstance(chunk,list): raise ValueError('API de Releases sin lista')
        result.extend(chunk)
        if len(chunk)<100: return result
    raise RuntimeError('Hay más de mil Releases: consulta incompleta')
def build(releases,prev):
    past=prev.get('activos',{}) if isinstance(prev.get('activos'),dict) else {}
    historic={k:dict(past.get(k,{})) if isinstance(past.get(k),dict) else {} for k in FILES}
    urls={}
    for release in releases:
        if not isinstance(release,dict) or release.get('draft') or not str(release.get('tag_name','')).startswith('ht-v'): continue
        for asset in release.get('assets',[]):
            if not isinstance(asset,dict) or asset.get('state')!='uploaded': continue
            for key,filename in FILES.items():
                if asset.get('name')!=filename: continue
                number=asset.get('download_count'); asset_id=asset.get('id')
                if type(number) is not int or number<0 or type(asset_id) is not int or asset_id<1: continue
                old=historic[key].get(str(asset_id),0)
                historic[key][str(asset_id)]=max(old,number)
                if release.get('tag_name')==TAG and asset.get('size',0)>100000:
                    url=asset.get('browser_download_url')
                    expected='https://github.com/'+REPO+'/releases/download/'+TAG+'/'+filename
                    if url==expected: urls[key]=url
    previous_apps=prev.get('aplicaciones',{}) if isinstance(prev.get('aplicaciones'),dict) else {}
    apps={}
    for key in FILES:
        old=previous_apps.get(key,{}) if isinstance(previous_apps.get(key),dict) else {}
        baseline=old.get('descargas',0)
        if type(baseline) is not int or baseline<0: baseline=0
        n=max(baseline,sum(historic[key].values()))
        url=urls.get(key,'')
        apps[key]={'descargas':n,'disponible':bool(url),'enlace':url}
    return {'version':1,'actualizado':dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'),
        'descripcion':'Descargas registradas en activos de GitHub Releases desde activar el contador. No incluye descargas anteriores desde GitHub Pages ni representa instalaciones únicas.',
        'aplicaciones':apps,'activos':historic}
def main():
    prev=json.loads(DEST.read_text('utf-8')) if DEST.exists() else {}
    next_data=build(fetch_releases(),prev)
    DEST.parent.mkdir(parents=True,exist_ok=True)
    DEST.write_text(json.dumps(next_data,indent=2,ensure_ascii=False,sort_keys=True)+'\n','utf-8')
    for key,info in next_data['aplicaciones'].items():
        print(key,info['descargas'],'activo' if info['disponible'] else 'pendiente')
if __name__=='__main__':main()
