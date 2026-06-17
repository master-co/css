import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(packageRoot, '../preset/src/default-plan.json')
const target = resolve(packageRoot, 'dist/default-plan.json')

mkdirSync(dirname(target), { recursive: true })
copyFileSync(source, target)
