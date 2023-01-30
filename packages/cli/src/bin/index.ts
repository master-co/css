#!/usr/bin/env node

import { program } from 'commander'
import path from 'path'
import { readPackage } from '../utils/read-package'
import { watch } from '../commands/watch'
import '../commands'

const { version, name, description } =  readPackage(path.join(__dirname, '../../package.json'))
program
    .name(name)
    .description(description)
    .version(version)
    .option('-w, --watch', 'watch file changed and generate master.')
    .action(watch)
    .parse()

