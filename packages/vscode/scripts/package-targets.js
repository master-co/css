import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  TARGETS,
  packageDir,
  packageTargets,
  publishTargets
} from './package-target-core.js'

function parseTargets(rawTargets) {
  const targets = rawTargets.flatMap((target) => target.split(',').filter(Boolean))
  for (const target of targets) {
    if (!TARGETS.includes(target)) {
      throw new Error(`Unsupported VS Code target "${target}". Expected one of: ${TARGETS.join(', ')}`)
    }
  }
  return targets
}

export function parseCLIArgs(argv) {
  const args = [...argv]
  const command = args[0] && !args[0].startsWith('-') ? args.shift() : 'package'
  const rawTargets = []
  const packageArgs = []
  let outDir
  let azureCredential = false
  let publisher

  while (args.length) {
    const arg = args.shift()
    if (arg === '--') {
      continue
    } else if (arg === '--target' || arg === '-t') {
      const before = rawTargets.length
      while (args[0] && !args[0].startsWith('-')) rawTargets.push(args.shift())
      if (rawTargets.length === before) throw new Error(`${arg} requires at least one target`)
    } else if (arg === '--out-dir') {
      const value = args.shift()
      if (!value) throw new Error('--out-dir requires a value')
      outDir = resolve(packageDir, value)
    } else if (arg === '--publisher') {
      const value = args.shift()
      if (!value) throw new Error('--publisher requires a value')
      publisher = value
    } else if (arg === '--all-targets') {
      rawTargets.length = 0
    } else if (arg === '--azure-credential') {
      if (command !== 'publish') throw new Error('--azure-credential is only supported for publish')
      azureCredential = true
    } else {
      packageArgs.push(arg)
    }
  }

  return {
    command,
    targets: rawTargets.length ? parseTargets(rawTargets) : TARGETS,
    outDir,
    packageArgs,
    azureCredential,
    publisher
  }
}

async function main() {
  const options = parseCLIArgs(process.argv.slice(2))

  if (options.command === 'package') {
    await packageTargets(options)
    return
  }

  if (options.command === 'publish') {
    await publishTargets(options)
    return
  }

  throw new Error(`Unknown command "${options.command}". Use "package" or "publish".`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
