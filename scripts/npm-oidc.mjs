import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const npmRegistry = 'https://registry.npmjs.org/'
const provenanceRepository = 'https://github.com/master-co/css'

export function assertNpmOidcEnvironment(env = {}) {
  if (env.GITHUB_ACTIONS !== 'true'
    || !env.ACTIONS_ID_TOKEN_REQUEST_URL
    || !env.ACTIONS_ID_TOKEN_REQUEST_TOKEN) {
    throw new Error('npm publication requires GitHub Actions OIDC with id-token: write; token and npmrc authentication are not supported')
  }
}

export function assertNpmPublishConfig(pkg) {
  // npm applies publishConfig while publishing an archive. Do not let it inject
  // credentials, change config files, or redirect this first-party publisher.
  for (const key of Object.keys(pkg.publishConfig ?? {})) {
    if (!['access', 'provenance', 'registry', 'tag'].includes(key)) {
      throw new Error(`Unsupported publishConfig key for OIDC publication: ${key}`)
    }
  }
  if (pkg.publishConfig?.registry
    && new URL(pkg.publishConfig.registry).href !== npmRegistry) {
    throw new Error('OIDC publication requires the official npm registry')
  }
}

export function assertNpmProvenanceRepository(pkg, packageRoot) {
  if (pkg.publishConfig?.provenance !== true) return
  const { type, url, directory } = pkg.repository ?? {}
  if (type !== 'git' || typeof url !== 'string'
    || url.replace(/^git\+/, '').replace(/\.git$/, '') !== provenanceRepository) {
    throw new Error(`npm provenance for ${pkg.name} requires repository.url matching ${provenanceRepository}`)
  }
  if (packageRoot !== undefined && directory !== packageRoot) {
    throw new Error(`npm provenance for ${pkg.name} requires repository.directory ${packageRoot}`)
  }
}

/** npm 11.21+ handles fresh, operation-scoped OIDC authentication itself. */
export async function createNpmOidcSession(env) {
  assertNpmOidcEnvironment(env)
  const cwd = await mkdtemp(join(tmpdir(), 'master-npm-oidc-'))
  try {
    const userconfig = join(cwd, '.npmrc'), globalconfig = join(cwd, 'global.npmrc')
    await writeFile(join(cwd, 'package.json'), '{"private":true}\n')
    await writeFile(userconfig, '', { mode: 0o600 })
    await writeFile(globalconfig, '', { mode: 0o600 })
    const cleanEnv = Object.fromEntries(Object.entries(env)
      .filter(([key]) => !/^npm_/i.test(key) && !/^node_auth_token$/i.test(key)))
    return {
      cwd,
      env: {
        ...cleanEnv,
        NPM_CONFIG_USERCONFIG: userconfig,
        NPM_CONFIG_GLOBALCONFIG: globalconfig,
        NPM_CONFIG_CACHE: join(cwd, 'cache'),
        NPM_CONFIG_REGISTRY: npmRegistry
      },
      // execa otherwise merges process.env back into the filtered environment.
      extendEnv: false,
      preferLocal: false,
      cleanup: () => rm(cwd, { recursive: true, force: true })
    }
  } catch (error) {
    await rm(cwd, { recursive: true, force: true })
    throw error
  }
}
