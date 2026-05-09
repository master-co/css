import { describe, expect, it } from 'vitest'
import InjectVirtualModulePlugin from '../../src/plugins/inject-virtual-module'

const ENTRY_ID = '/project/src/main.ts'

function createPlugin() {
    return InjectVirtualModulePlugin({} as any, {
        entryId: ENTRY_ID,
        extractor: {
            options: {
                module: 'virtual:master.css'
            }
        } as any
    } as any)
}

describe('InjectVirtualModulePlugin', () => {
    it('does not inject a duplicate virtual CSS import', () => {
        const plugin = createPlugin()
        const code = `import 'virtual:master.css'\nconsole.log('ready')`
        const result = (plugin.transform as any).call({}, code, ENTRY_ID)

        expect(result).toBeNull()
    })

    it('injects the virtual CSS import when the entry does not import it', () => {
        const plugin = createPlugin()
        const result = (plugin.transform as any).call({}, `console.log('ready')`, ENTRY_ID)

        expect(result.code).toContain(`import 'virtual:master.css'`)
        expect(result.code).toContain('/*__MASTER_CSS_VIRTUAL_MODULE_INJECTED__*/')
    })
})
