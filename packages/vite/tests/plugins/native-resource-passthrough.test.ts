import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

test.each(['style.css', 'style.module.css'])('leaves native resource aliases in %s to the host CSS pipeline', async filename => {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), 'master-native-resource-alias-')))
  try {
    mkdirSync(join(root, 'images'))
    writeFileSync(join(root, 'images/pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><circle r="4"/></svg>')
    writeFileSync(join(root, filename), '.card{color:red;background:url("@images/pixel.svg")}')
    writeFileSync(join(root, 'app.css'), '@import "@master/css";@theme{--color-managed:red}')
    writeFileSync(join(root, 'main.js'), `import "./app.css";import ${JSON.stringify('./' + filename)}`)
    writeFileSync(join(root, 'index.html'), '<div class="card"></div><script type="module" src="/main.js"></script>')
    const result = await build({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static' }),
      resolve: { alias: { '@images': join(root, 'images') } }, build: { write: false, assetsInlineLimit: 0 } })
    if (Array.isArray(result) || !('output' in result)) throw Error('Expected one build output')
    const css = result.output.flatMap(asset => asset.type === 'asset' && asset.fileName.endsWith('.css') ? [asset.source] : []).join('\n')
    const image = result.output.find(asset => asset.type === 'asset' && asset.fileName.endsWith('.svg'))!
    expect(image).toBeDefined()
    expect(css).toContain(image.fileName)
    expect(css).not.toContain('@images')
    expect(css).toContain('color:red')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
