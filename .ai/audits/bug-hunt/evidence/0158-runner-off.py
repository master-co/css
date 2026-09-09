import subprocess,os,json
from pathlib import Path
rows=[]
for mode in ['pure-full','runtime','progressive']:
 for request in ['runtime','css-runtime']:
  env={**os.environ,'BH_MODE':mode,'BH_REQUEST':request,'BH_OPTIMIZER':'off'}
  proc=subprocess.Popen(['node','.ai/audits/bug-hunt/repros/vite-shutdown-handles.mjs'],env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
  lines=[];observed=None;residual=None
  for line in proc.stdout:
   lines.append(line)
   try:d=json.loads(line)
   except ValueError:continue
   if d.get('observationsFinished'):observed=d
   if d.get('residualNativeHandles'):
    assert observed
    residual=d;proc.terminate()
  code=proc.wait()
  row={'mode':mode,'request':request,'pid':proc.pid,'exitCode':code,'terminatedAfterObservedLeak':bool(residual),'observation':observed,'residual':residual,'output':''.join(lines)}
  rows.append(row);print(json.dumps({k:row[k] for k in ['mode','request','pid','exitCode','terminatedAfterObservedLeak']}),flush=True)
Path('.ai/audits/bug-hunt/evidence/0158-optimizer-off-matrix.json').write_text(json.dumps(rows,indent=2)+'\n')
