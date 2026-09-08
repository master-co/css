import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
for (const binding of ['native', 'wasm']) {
  const cwd = mkdtempSync(join(tmpdir(), 'master-css-binding-watch-'))
  let child
  let stderr = ''
  try {
    const preload = join(cwd, 'observe.cjs')
    writeFileSync(preload, `
const load = process.dlopen;
process.dlopen = function (mod, filename, ...rest) {
  const result = Reflect.apply(load, process, [mod, filename, ...rest]);
  if (filename.includes('master')) {
    for (const name of ['ScannerSession', 'ValidatorSession']) {
      if (typeof mod.exports[name] === 'function') {
        mod.exports[name] = new Proxy(mod.exports[name], {
          construct(target, args) {
            process.stderr.write('BH_NATIVE_' + name + '\\n');
            return Reflect.construct(target, args, target);
          }
        });
      }
    }
  }
  return result;
};
`)
    writeFileSync(join(cwd, 'index.html'), '<div class="block btn"></div>')
    const config = '@master entry;\n@components { btn { display: grid; } }\n'
    writeFileSync(join(cwd, 'index.css'), config)
    child = spawn(process.execPath, ['--require', preload, join(root, 'packages/cli/dist/bin/index.js'),
      'generate', '--watch', '--binding', binding], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    child.stdout.resume()
    child.stderr.on('data', chunk => { stderr += chunk })
    const css = () => existsSync(join(cwd, 'master.css')) ? readFileSync(join(cwd, 'master.css'), 'utf8') : ''
    const wait = async (check) => {
      const deadline = Date.now() + 15000
      while (!check() && Date.now() < deadline && child.exitCode === null) await new Promise(resolve => setTimeout(resolve, 30))
      assert(check(), stderr + '\nCSS:\n' + css())
    }
    await wait(() => stderr.includes('Start watching source changes'))
    assert(css().includes('.btn{display:grid}'))
    assert(css().includes('.block{display:block}'))
    writeFileSync(join(cwd, 'index.css.next'), config.replace('display: grid', 'display: flex'))
    renameSync(join(cwd, 'index.css.next'), join(cwd, 'index.css'))
    await wait(() => stderr.includes('Restart watching source changes') && css().includes('.btn{display:flex}'))
    writeFileSync(join(cwd, 'new.html'), '<div class="hidden"></div>')
    await wait(() => css().includes('.hidden{display:none}'))
    const nativeScanners = (stderr.match(/BH_NATIVE_ScannerSession/g) || []).length
    const nativeValidators = (stderr.match(/BH_NATIVE_ValidatorSession/g) || []).length
    if (binding === 'wasm') {
      assert.equal(nativeScanners, 0)
      assert.equal(nativeValidators, 0)
    } else {
      assert(nativeScanners >= 2)
      assert(nativeValidators >= 2)
    }
    console.log(JSON.stringify({ binding, nativeScanners, nativeValidators, initial: 'PASS', configReset: 'PASS', newSourceAfterReset: 'PASS' }))
  } finally {
    if (child && child.exitCode === null) {
      const exited = once(child, 'exit')
      child.kill('SIGTERM')
      const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
      await exited
      clearTimeout(timer)
    }
    rmSync(cwd, { recursive: true, force: true })
  }
}
