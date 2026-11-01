import { tasks, arms } from '../evaluate.mjs'

export function profile(name = 'full') {
  if (name === 'full') return { name, arms: arms.filter(arm => arm !== 'skill-cli'), tasks, repeats: 2 }
  if (name === 'bridge-pilot') return {
    name, arms: ['skill-cli', 'skill-mcp-bridge'], repeats: 2,
    tasks: ['settings-card', 'css-declarations', 'fallback-order', 'tailwind-hover'].map(id => tasks.find(task => task.id === id))
  }
  throw new Error(`Unknown profile: ${name}`)
}

/** Alternate arm/model order between paired repetitions, keeping tasks identical. */
export function schedule(selection, models) {
  const trials = []
  for (let repeat = 0; repeat < selection.repeats; repeat++) {
    const orderedArms = repeat % 2 ? [...selection.arms].reverse() : selection.arms
    const orderedModels = repeat % 2 ? [...models].reverse() : models
    for (const task of selection.tasks) for (const arm of orderedArms) for (const model of orderedModels) {
      trials.push({ id: `${task.id}-${arm}-${model}-${repeat}`, task, arm, model, repeat })
    }
  }
  return trials
}

export function bridgeInstructions(arm, pilot) {
  if (!pilot) return 'Use the declaration-to-class suggestion bridge only if exposed by the connected MCP server; do not invoke an equivalent programmatic API or CLI command otherwise.'
  return `For installed CLI commands, run node master-css.mjs from this directory. Do not edit master-css.mjs or bridge-calls.jsonl. ${arm === 'skill-cli'
    ? 'The declaration suggestion bridge is available through node master-css.mjs suggest (argument or --stdin).'
    : 'Use the connected mastercss_suggest_classes tool for declaration suggestions; the CLI suggestion command is disabled for this arm.'} Do not bypass the assigned suggestion interface or invoke its programmatic API. Use suggestions when useful; invoking them is not required to pass.`
}

/** Audits actual CLI invocations, including failures, without changing the public CLI. */
export function cliWrapper(binary, allowSuggest) {
  return `import {spawnSync} from 'node:child_process';
import {appendFileSync} from 'node:fs';
const args=process.argv.slice(2);
const suggest=args[0]==='suggest'&&!args.some(arg=>['--help','-h','--version','-V'].includes(arg));
if(suggest&&!${JSON.stringify(allowSuggest)}) {console.error('Suggestion CLI disabled in this trial arm');process.exit(1)}
const result=spawnSync(process.execPath,[${JSON.stringify(binary)},...args],{stdio:'inherit'});
if(suggest) appendFileSync(new URL('bridge-calls.jsonl',import.meta.url),JSON.stringify({status:result.status,signal:result.signal,error:result.error?.message})+'\\n');
if(result.error) console.error(result.error.message);
process.exit(result.status??1);
`
}

export function assertResume(old, current) {
  for (const field of ['version', 'revision', 'corpusHash', 'toolVersion', 'clientVersion', 'timeoutMs', 'profile', 'models', 'repeats', 'arms', 'tasks', 'concurrency', 'commonArgs', 'baselineInstructions', 'reasoning', 'maxRepairRounds', 'tailwindVersion', 'harnessHashes', 'artifactHashes']) {
    if (JSON.stringify(old[field]) !== JSON.stringify(current[field])) throw new Error(`Cannot resume changed ${field}`)
  }
}
