// Batch 0250: prints top self-time frames of the newest .cpuprofile in the given directory.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
const dir = process.argv[2]
const file = readdirSync(dir).filter(f => f.endsWith('.cpuprofile')).sort().at(-1)
const profile = JSON.parse(readFileSync(join(dir, file), 'utf8'))
const nodes = new Map(profile.nodes.map(n => [n.id, n]))
const self = new Map()
const dt = profile.timeDeltas; const samples = profile.samples
for (let i = 0; i < samples.length; i++) { self.set(samples[i], (self.get(samples[i]) || 0) + (dt[i] || 0)) }
const byFn = new Map()
for (const [id, t] of self) { const n = nodes.get(id); const cf = n.callFrame; const key = `${cf.functionName || '(anon)'} ${cf.url.split('/').slice(-3).join('/')}:${cf.lineNumber}`; byFn.set(key, (byFn.get(key) || 0) + t) }
const total = [...byFn.values()].reduce((a, b) => a + b, 0)
console.log('profile', file, 'total ms', (total / 1000).toFixed(0))
for (const [k, t] of [...byFn].sort((a, b) => b[1] - a[1]).slice(0, 18)) console.log((t / 1000).toFixed(1).padStart(8), 'ms', (100 * t / total).toFixed(1).padStart(5) + '%', k)
