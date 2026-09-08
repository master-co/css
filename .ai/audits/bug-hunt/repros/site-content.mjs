import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const repo = fileURLToPath(new URL('../../../../',import.meta.url))
const prefix=process.env.BH_EVIDENCE_PREFIX||'0044'
const env = {...process.env,NEXT_PUBLIC_VERSION:'0.0.0-audit',NEXT_PUBLIC_URL:'http://127.0.0.1:4173',NEXT_TELEMETRY_DISABLED:'1'}
const commands = ['prepare-app','test:image-loader','test:public-env','test:syntax','test:reference','test:llms','test:docs-examples']
const results = []
for (const name of commands) {
 const result = spawnSync('pnpm',['run',name],{env,encoding:'utf8',maxBuffer:32*1024*1024})
 writeFileSync(repo+'.ai/audits/bug-hunt/evidence/'+prefix+'-'+name.replaceAll(':','-')+'.log',result.stdout+result.stderr)
 results.push({name,status:result.status});console.log(JSON.stringify(results.at(-1)))
}
const css = spawnSync('pnpm',['exec','tsx','--test','scripts/css-variable-references.test.ts'],{env,encoding:'utf8',maxBuffer:32*1024*1024})
writeFileSync(repo+'.ai/audits/bug-hunt/evidence/'+prefix+'-css-variable-references.log',css.stdout+css.stderr)
console.log(JSON.stringify({name:'css-variable-references',status:css.status}));process.exitCode=results.some(r=>r.status!==0)||css.status!==0?1:0
