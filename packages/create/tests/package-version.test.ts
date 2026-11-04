import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'

const createRoot = resolve(__dirname, '..')
const schemaRoot = resolve(createRoot, '../schema')
const commanderRoot = dirname(createRequire(import.meta.url).resolve('commander'))

function installer(version?: string) {
  const fixture = mkdtempSync(join(tmpdir(), 'master-css-create-package-version-'))
  const root = join(fixture, 'installer'), project = join(fixture, 'project'), empty = join(fixture, 'empty')
  mkdirSync(root)
  mkdirSync(project)
  mkdirSync(empty)
  cpSync(join(createRoot, 'dist'), join(root, 'dist'), { recursive: true })
  const manifest = JSON.parse(readFileSync(join(createRoot, 'package.json'), 'utf8'))
  writeFileSync(join(root, 'package.json'), JSON.stringify({ ...manifest, version }))
  writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'version-consumer', type: 'module' }))
  const schema = join(root, 'node_modules/@master/css-schema')
  mkdirSync(schema, { recursive: true })
  cpSync(join(schemaRoot, 'dist'), join(schema, 'dist'), { recursive: true })
  cpSync(join(schemaRoot, 'package.json'), join(schema, 'package.json'))
  cpSync(commanderRoot, join(root, 'node_modules/commander'), { recursive: true })
  return { fixture, root, project, empty }
}

function run(args: string[], cwd: string) {
  const result = spawnSync(process.execPath, args, { cwd, encoding: 'utf8' })
  expect(result.status, result.stderr).toBe(0)
  return result.stdout
}

function expectVersion(plan: { dependencies: { name: string, version: string }[], commands: { args: string[] }[] }, version: string) {
  const packages = plan.dependencies.filter(dependency => dependency.name.startsWith('@master/'))
  expect(packages.length).toBeGreaterThan(2)
  expect(packages.every(dependency => dependency.version === version)).toBe(true)
  expect(plan.commands.some(command => command.args.includes(`@master/css-mcp@${version}`))).toBe(true)
  expect(plan.dependencies.find(dependency => dependency.name === 'eslint')?.version).toBe('^9.0.0 || ^10.0.0')
}

for (const version of ['2.0.0', '2.0.0-rc.42', undefined]) {
  test(`built installer metadata ${version ?? '(unversioned development)'} controls planned cohort and guidance`, () => {
    const f = installer(version), expected = version ?? 'rc'
    try {
      const cli = join(f.root, 'dist/bin/index.js')
      const plan = JSON.parse(run([cli, 'add', '--framework', 'none', '--dry-run', '--json', '--yes', '--no-install'], f.project))
      expectVersion(plan, expected)
      const module = pathToFileURL(join(f.root, 'dist/index.js')).href
      const apiPlan = JSON.parse(run(['--input-type=module', '--eval',
        `import { planMasterCSSSetup } from ${JSON.stringify(module)}; console.log(JSON.stringify(planMasterCSSSetup({ framework: 'vite' })))`], f.project))
      expectVersion(apiPlan, expected)
      const guidance = run([cli], f.empty)
      expect(guidance).toContain(`npm create @master/css@${expected} -- --yes`)
    } finally { rmSync(f.fixture, { recursive: true, force: true }) }
  })
}

test('an explicit API packageTag still overrides installed package metadata', () => {
  const f = installer('2.0.0')
  try {
    const module = pathToFileURL(join(f.root, 'dist/index.js')).href
    const plan = JSON.parse(run(['--input-type=module', '--eval',
      `import { planMasterCSSSetup } from ${JSON.stringify(module)}; console.log(JSON.stringify(planMasterCSSSetup({ framework: 'astro', packageTag: 'beta' })))`], f.project))
    expectVersion(plan, 'beta')
  } finally { rmSync(f.fixture, { recursive: true, force: true }) }
})
