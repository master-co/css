import subprocess,os,json,itertools
from pathlib import Path
rows=[]
for dependency,hot,optimizer in itertools.product(['0','1'],['0','1'],['on','off']):
 env={**os.environ,'BH_DEPENDENCY':dependency,'BH_HOT':hot,'BH_OPTIMIZER':optimizer}
 proc=subprocess.Popen(['node','.ai/audits/bug-hunt/repros/vite-virtual-shutdown.mjs'],env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
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
 row={'dependency':dependency,'hot':hot,'optimizer':optimizer,'pid':proc.pid,'exitCode':code,'terminatedAfterObservedLeak':bool(residual),'observation':observed,'residual':residual,'output':''.join(lines)}
 rows.append(row);print(json.dumps({k:row[k] for k in ['dependency','hot','optimizer','pid','exitCode','terminatedAfterObservedLeak']}),flush=True)
Path('.ai/audits/bug-hunt/evidence/0158-minimal-virtual-matrix.json').write_text(json.dumps(rows,indent=2)+'\n')
