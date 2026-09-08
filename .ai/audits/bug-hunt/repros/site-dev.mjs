import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:net'
const repo=fileURLToPath(new URL('../../../../',import.meta.url))
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r))
writeFileSync('audit.playwright.config.ts',`import base from './tests/dogfood/playwright.dev.config'\nexport default { ...base, testDir:'./tests/dogfood', use:{...base.use,baseURL:'http://127.0.0.1:${port}'}, webServer:{...base.webServer,command:'node ${repo}scripts/with-typescript-tooling-compat.mjs pnpm dev --port ${port}',cwd:process.cwd(),port:${port},reuseExistingServer:false,timeout:120000} }\n`)
const env={...process.env,NEXT_PUBLIC_VERSION:'0.0.0-audit',NEXT_PUBLIC_URL:`http://127.0.0.1:${port}`,NEXT_TELEMETRY_DISABLED:'1'};delete env.NODE_OPTIONS
const result=spawnSync(process.execPath,[repo+'node_modules/@playwright/test/cli.js','test','--config','audit.playwright.config.ts'],{env,stdio:'inherit',timeout:300000})
console.log(JSON.stringify({port,status:result.status,error:result.error?.message}));process.exitCode=result.status??1
