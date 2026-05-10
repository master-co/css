#!/usr/bin/env node

import { resolve } from 'node:path'
import { Command } from 'commander'
import { readJSONFileSync } from '@techor/fs'
import log from '@techor/log'
import detectAppTech from '../detect-app-tech'
import detectPackageManager from '../detect-package-manager'
import { downloadTemplate } from 'giget'
import { Options } from '../Options'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import ora from 'ora'
import CONFIG_TEXT from '../master-css-template'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { exit } from 'node:process'

const BRANCH = 'rc'
const CURRENT_VERSION = 'rc' // ^2.0.0
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pkg = readJSONFileSync(resolve(__dirname, '../../package.json'))
const program = new Command()

function ensureGitIgnoreEntry(entry: string) {
    const fileName = '.gitignore'
    const content = existsSync(fileName) ? readFileSync(fileName, 'utf-8') : ''
    const hasEntry = content
        .split(/\r?\n/)
        .some((line) => {
            const value = line.trim()
            return value === entry || value === `/${entry}`
        })
    if (hasEntry) return
    const prefix = content && !content.endsWith('\n') ? '\n' : ''
    writeFileSync(fileName, `${content}${prefix}${entry}\n`)
    log.ok`Added **${entry}** to **${fileName}**`
}

function prepareDetectedApp(tech: ReturnType<typeof detectAppTech>) {
    if (tech === 'nextjs') {
        ensureGitIgnoreEntry('.master')
    }
}

program
    .name(pkg.name)
    .description(pkg.description)
    .version(pkg.version || 'workspace:^')
    .argument('[project name]', 'The project name is used to create the folder')
    .option('-o, --override', 'Override existing definition file')
    .option('--pm <package manager>', 'Specify the package manager npm, yarn, pnpm, bun')
    .option('--example <folder name>', 'Specify the example folder name', 'blank')
    .action(async function (appName: string | undefined, options: Options) {
        if (!options.pm) {
            options.pm = await detectPackageManager()
        }
        // Create a new app with the example
        if (appName) {
            log.i(`Detected **${options.pm}**`)
            const spinner = ora(`Initializing Master CSS`).start()
            const examplePath = `github:master-co/css/examples/${options.example}#${BRANCH}`
            spinner.start(`Cloning example from "${examplePath}"`)
            try {
                await downloadTemplate(examplePath, {
                    dir: appName
                })
            } catch (error: any) {
                spinner.fail(error.message)
                return
            }
            process.chdir(appName)
            const appPkg = readJSONFileSync('package.json')
            if (!appPkg) {
                spinner.stop()
                log.i`View all examples at **https://github.com/master-co/css/tree/${BRANCH}/examples**`
                log.x(`Cannot found "${examplePath}"`)
                exit(1)
            }
            appPkg.name = appName
            const targetPackages = []
            for (const key in appPkg.dependencies) {
                if (appPkg.dependencies[key] === 'workspace:^') {
                    appPkg.dependencies[key] = CURRENT_VERSION
                }
                targetPackages.push(key)
            }
            for (const key in appPkg.devDependencies) {
                if (appPkg.devDependencies[key] === 'workspace:^') {
                    appPkg.devDependencies[key] = CURRENT_VERSION
                }
                targetPackages.push(key)
            }
            writeFileSync('package.json', JSON.stringify(appPkg, null, 4), { flag: 'w' })
            prepareDetectedApp(detectAppTech())
            spinner.stop()
            log.ok`Cloned example from "${examplePath}"`
            log``
            try {
                execSync(`${options.pm} install`, { stdio: 'inherit' })
                log``
                log.ok`Created **${appName}**`
                if (appPkg.scripts) {
                    log.i`Commands in this app:`
                    console.table(appPkg.scripts)
                }
                log.i`Start by running "cd ${appName} && ${options.pm} run ${appPkg.scripts?.dev ? 'dev' : 'start'}"`
            } catch (error) {
                spinner.fail()
                throw error
            }
        } else {
            const appPkg = readJSONFileSync('package.json')
            const create = (fileName: string, text: string) => {
                const configExists = existsSync(fileName)
                if (!configExists) {
                    writeFileSync(fileName, text)
                    log.ok`Created **${fileName}**`
                } else if (configExists && options.override) {
                    writeFileSync(fileName, text)
                    log.ok`**${fileName}** is overridden`
                } else {
                    log.x`**${fileName}** already exists`
                }
            }
            create('master.css', CONFIG_TEXT)
            if (!appPkg?.dependencies?.['@master/css']) {
                log.i(`Detected **${options.pm}**`)
                log.i`Start "${options.pm} add @master/css@${BRANCH}"`
                log``
                execSync(`${options.pm} add @master/css@rc`, { stdio: 'inherit' })
                log``
            }
            const tech = detectAppTech()
            prepareDetectedApp(tech)
            if (tech) {
                log.i(`Detected **${tech}** (https://${BRANCH}.css.master.co/docs/installation/${tech})`)
            } else {
                log.i(`To integrate with your framework, check out the guides at **https://${BRANCH}.css.master.co/docs/installation**`)
            }
        }
    })

program.parse(process.argv)
