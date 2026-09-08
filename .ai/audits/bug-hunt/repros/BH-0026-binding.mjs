import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(join(root, 'package.json'))
const cwd = mkdtempSync(join(tmpdir(), 'master-css-bh-binding-'))
const records = []
const builtCLI = process.env.BH_CLI_ARTIFACT === 'dist'
try {
    writeFileSync(join(cwd, 'index.html'), '<div class="block"></div>')
    const preload = join(cwd, 'observe.cjs')
    writeFileSync(preload, `
const load = process.dlopen;
process.dlopen = function (mod, filename, ...rest) {
  const result = Reflect.apply(load, process, [mod, filename, ...rest]);
  if (filename.includes('master') && typeof mod.exports.ScannerSession === 'function') {
    mod.exports.ScannerSession = new Proxy(mod.exports.ScannerSession, {
      construct(target, args) {
        process.stderr.write('BH_NATIVE_SCANNER\\n');
        return Reflect.construct(target, args, target);
      }
    });
  }
  return result;
};
`)
    const control = join(cwd, 'control.mts')
    writeFileSync(control, `
import { readFileSync } from 'node:fs';
import { createToolingBinding } from ${JSON.stringify(pathToFileURL(join(root, 'packages/binding/src/tooling-binding.ts')).href)};
const manifest = JSON.parse(readFileSync(${JSON.stringify(createRequire(join(root, 'packages/cli/package.json')).resolve('@master/css-preset/default-manifest.json'))}, 'utf8'));
const binding = await createToolingBinding({ binding: process.argv[2],
  wasm: { input: readFileSync(${JSON.stringify(join(root, 'packages/binding-wasm-tooling/artifacts/mastercss_binding_wasm_tooling_bg.wasm'))}) }
});
const scanner = await binding.createScannerSession(manifest);
try {
  scanner.ensureClassRules(['block']);
  console.log(JSON.stringify({ binding: binding.binding, snapshot: scanner.snapshot() }));
} finally { scanner.dispose(); }
`)
    for (const kind of ['cli-baseline', 'control', 'cli']) {
        for (const binding of kind === 'cli-baseline' ? ['auto'] : ['native', 'wasm']) {
            const args = [
                ...(kind === 'cli-baseline' ? [] : ['--require', preload]),
                ...(kind === 'control' || !builtCLI ? ['--import', require.resolve('tsx')] : []),
                ...(kind === 'control' ? [control, binding] : [
                    join(root, builtCLI ? 'packages/cli/dist/bin/index.js' : 'packages/cli/src/bin/index.ts'),
                    'generate', 'index.html', '--binding', binding, '--no-export'
                ])
            ]
            const result = spawnSync(process.execPath, args, {
                cwd, encoding: 'utf8', timeout: 30000,
                env: { ...process.env, TSX_TSCONFIG_PATH: join(root, 'tsconfig.json') }
            })
            records.push({ kind, binding, status: result.status,
                nativeScanners: (result.stderr.match(/BH_NATIVE_SCANNER/g) || []).length,
                stdout: result.stdout, stderr: result.stderr })
        }
    }
    console.log(JSON.stringify(records, null, 2))
    assert(records.every((r) => r.status === 0 && r.stdout.includes('display:block')), 'all baseline and control executions must succeed')
    assert.equal(records.find((r) => r.kind === 'control' && r.binding === 'wasm').nativeScanners, 0)
    assert(records.find((r) => r.kind === 'control' && r.binding === 'native').nativeScanners > 0)
    assert.equal(records.find((r) => r.kind === 'cli' && r.binding === 'wasm').nativeScanners, 0,
        'BH-0026: CLI --binding wasm must not instantiate a native scanner')
} finally {
    rmSync(cwd, { recursive: true, force: true })
}
