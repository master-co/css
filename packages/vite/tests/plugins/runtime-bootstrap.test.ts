import { describe, expect, it } from 'vitest'
import { RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID } from '@master/css-internal/runtime-bootstrap'
import RuntimeBootstrapPlugin from '../../src/plugins/runtime-bootstrap'

function loadBootstrap(progressive: boolean) {
  const plugin = RuntimeBootstrapPlugin(progressive) as any
  plugin.configResolved({ base: '/', command: 'build' })
  return plugin.load(RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID) as string
}

describe('runtime bootstrap', () => {
  it('imports the runtime program up front in runtime mode', () => {
    expect(loadBootstrap(false)).toContain(`import masterCSSProgram from 'virtual:master-css-program'`)
  })

  it('loads the runtime program only when a progressive engine starts', () => {
    const source = loadBootstrap(true)
    expect(source).not.toMatch(/^import .* from 'virtual:master-css-program'/m)
    expect(source).toContain(`import('virtual:master-css-program')`)
  })
})
