#!/usr/bin/env node
import { resolve } from 'node:path'
import { Command } from 'commander'
import { readJSONFileSync } from '@techor/fs'
const pkg = readJSONFileSync(resolve(__dirname, '../../package.json'))
const program = new Command()

program
    .name(pkg.name)
    .description(pkg.description)
    .version(pkg.version || '0.0.0')

require('../commands/extract')(program)
require('../commands/render')(program)

program.parse()