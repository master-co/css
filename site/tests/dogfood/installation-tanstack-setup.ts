import { spawn, type ChildProcess } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { tanstackInstallationFixture, tanstackInstallationModes } from '../tanstack-installation-examples'

async function freePort() {
  const server = createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No fixture port available')
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  return address.port
}

export default async function setup() {
  const fixtures: ReturnType<typeof tanstackInstallationFixture>[] = []
  const children: ChildProcess[] = []
  const urls: Record<string, string> = {}
  const cleanup = async () => {
    for (const child of children) {
      if (child.exitCode !== null || child.signalCode !== null) continue
      const exited = once(child, 'exit')
      child.kill('SIGTERM')
      const timeout = setTimeout(() => child.kill('SIGKILL'), 5000)
      await exited
      clearTimeout(timeout)
    }
    for (const fixture of fixtures) fixture.dispose()
  }
  try {
    for (const mode of tanstackInstallationModes) {
      const fixture = tanstackInstallationFixture(mode)
      fixtures.push(fixture)
      const port = await freePort()
      const child = spawn(process.execPath, [fixture.bin], {
        cwd: fixture.root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NODE_ENV: 'production', TANSTACK_PORT: String(port) },
      })
      children.push(child)
      let output = ''
      child.stdout!.on('data', data => { output += data })
      child.stderr!.on('data', data => { output += data })
      const url = `http://127.0.0.1:${port}`
      const deadline = Date.now() + 30000
      let ready = false
      while (Date.now() < deadline && child.exitCode === null) {
        try { if ((await fetch(url, { signal: AbortSignal.timeout(2000) })).ok) { ready = true; break } } catch { /* Startup is asynchronous. */ }
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      if (!ready) throw new Error(`${mode} fixture did not start: ${output}`)
      urls[mode] = url
    }
    process.env.TANSTACK_INSTALLATION_FIXTURES = JSON.stringify(urls)
    return cleanup
  } catch (error) { await cleanup(); throw error }
}
