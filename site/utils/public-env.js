import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const publicProjectName = 'Master CSS'
export const defaultRcUrl = 'https://rc.css.master.co'
export const defaultPlayApiUrl = '/api/play'

const siteDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const repoRoot = resolve(siteDir, '..')
const generatedEnvPath = join(siteDir, '.generated/public-env.json')

export function resolvePublicEnv(options = {}) {
    const env = options.env ?? process.env
    const cwd = options.cwd ?? repoRoot
    const runGit = options.runGit ?? ((args) => runGitCommand(args, cwd))

    if (options.fetchTags) {
        tryRunGit(runGit, ['fetch', '--tags', '--force'])
    }

    const repository = options.repositoryUrl ?? readRepository(cwd)
    const { owner, slug } = parseRepository(repository)
    const commitRef = env.NEXT_PUBLIC_COMMIT_REF
        || env.CF_PAGES_BRANCH
        || env.GITHUB_REF_NAME
        || getGitBranch(runGit)
        || 'rc'
    const siteUrl = resolveSiteUrl(env, commitRef)

    return {
        NEXT_PUBLIC_PROJECT: env.NEXT_PUBLIC_PROJECT || publicProjectName,
        NEXT_PUBLIC_HOST: env.NEXT_PUBLIC_HOST || new URL(siteUrl).host,
        NEXT_PUBLIC_URL: siteUrl,
        NEXT_PUBLIC_PLAY_API_URL: env.NEXT_PUBLIC_PLAY_API_URL || defaultPlayApiUrl,
        NEXT_PUBLIC_VERSION: env.NEXT_PUBLIC_VERSION || resolveVersion(runGit),
        NEXT_PUBLIC_REPO_OWNER: env.NEXT_PUBLIC_REPO_OWNER || owner,
        NEXT_PUBLIC_REPO_SLUG: env.NEXT_PUBLIC_REPO_SLUG || slug,
        NEXT_PUBLIC_COMMIT_REF: commitRef
    }
}

export function resolveAndWritePublicEnv(options = {}) {
    const output = options.output ?? generatedEnvPath
    const publicEnv = resolvePublicEnv(options)
    mkdirSync(dirname(output), { recursive: true })
    writeFileSync(output, JSON.stringify(publicEnv, null, 4) + '\n')
    return publicEnv
}

export function readPublicEnv(options = {}) {
    const input = options.input ?? process.env.MASTER_CSS_PUBLIC_ENV_FILE
    if (input) {
        return JSON.parse(readFileSync(resolve(siteDir, input), 'utf8'))
    }
    return resolvePublicEnv(options)
}

export function resolveVersion(runGit) {
    const headTag = firstLine(tryRunGit(runGit, ['tag', '--points-at', 'HEAD', '--list', 'v*', '--sort=-v:refname']))
    if (headTag) {
        return stripTagPrefix(headTag)
    }

    const latestTag = tryRunGit(runGit, ['describe', '--tags', '--abbrev=0', '--match', 'v*'])
    if (latestTag) {
        return stripTagPrefix(latestTag)
    }

    const shortSha = tryRunGit(runGit, ['rev-parse', '--short', 'HEAD']) || 'dev'
    return `0.0.0-${shortSha}`
}

function resolveSiteUrl(env, commitRef) {
    if (env.NEXT_PUBLIC_URL) return env.NEXT_PUBLIC_URL
    const port = env.PORT || 3000
    const localUrl = `http://localhost:${port}`
    if (env.NODE_ENV === 'development' && !env.CF_PAGES_URL) return localUrl
    if (isRcBranch(commitRef)) return defaultRcUrl
    if (env.CF_PAGES_URL) return env.CF_PAGES_URL

    return localUrl
}

function isRcBranch(commitRef) {
    return commitRef === 'rc' || commitRef.endsWith('/rc')
}

function getGitBranch(runGit) {
    return tryRunGit(runGit, ['symbolic-ref', '--short', 'HEAD'])
}

function runGitCommand(args, cwd) {
    return execFileSync('git', args, {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
}

function tryRunGit(runGit, args) {
    try {
        return runGit(args).trim()
    } catch {
        return ''
    }
}

function firstLine(value) {
    return value.split(/\r?\n/).find(Boolean) || ''
}

function stripTagPrefix(tag) {
    return tag.replace(/^v/, '')
}

function readRepository(cwd) {
    const packageJSON = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'))
    if (!packageJSON.repository?.url) {
        throw new Error('package.json should have repository.url')
    }
    return packageJSON.repository.url
}

function parseRepository(repositoryUrl) {
    const match = repositoryUrl.match(/https:\/\/github\.com\/([^/]+)\/([^/]+)\.git/)
    if (!match) {
        throw new Error(`Unsupported repository URL: ${repositoryUrl}`)
    }
    return {
        owner: match[1],
        slug: match[2]
    }
}
