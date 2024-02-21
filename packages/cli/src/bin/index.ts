#!/usr/bin/env node
import { resolve } from 'node:path'
import { Command } from 'commander'
import { readJSONFileSync } from '@techor/fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pkg = readJSONFileSync(resolve(__dirname, '../../package.json'))
const program = new Command()

program
    .name(pkg.name)
    .description(pkg.description)
    .version(pkg.version || '0.0.0')

import commandExtract from '../commands/extract'
import commandRender from '../commands/render'

commandExtract(program)
commandRender(program)

program.parse()