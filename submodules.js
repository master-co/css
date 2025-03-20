import { execSync } from 'child_process'
import { rmdirSync } from 'fs'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN

if (GITHUB_TOKEN) {
    console.log('Running in CI environment, using GITHUB_TOKEN for authentication')
    execSync(`git config --global url.https://${GITHUB_TOKEN}@github.com/.insteadOf https://github.com`)
} else {
    console.log('Running in local environment, using normal authentication')
}

if (process.env.CI) {
    rmdirSync('internal', { recursive: true })
}

execSync('git submodule update --init --recursive')
execSync('cd internal && git checkout main')
