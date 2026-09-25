import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { compileCSSManifestFile, compileProjectManifest } from '../src/node-compiler'
import { flattenMasterCSSManifestVariables } from '@master/css-schema/manifest'

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'master-css-reference-'))
  mkdirSync(join(root, 'src'), { recursive: true })
  return root
}

describe('CSS @reference', () => {
  test('uses referenced CSS as compose and variant context without outputting it', () => {
    const root = createFixture()
    try {
      const tokensPath = join(root, 'tokens.css')
      const entryPath = join(root, 'src/component.css')
      writeFileSync(tokensPath, `
        @theme {
          --color-brand: #123456;
        }

        @custom-variant wide {
          @media (width >= 640px) {
            @slot;
          }
        }

        @utilities {
          brand {
            color: var(--color-brand);
          }
        }

        .referenced-native {
          color: red;
        }
      `)
      writeFileSync(entryPath, `
        @reference "../tokens.css";

        .button {
          @compose brand;

          @variant wide {
            @compose brand;
          }
        }
      `)

      const result = compileCSSManifestFile(entryPath)

      expect(result.css).toContain('.button{color:var(--color-brand)}')
      expect(result.css).toContain('@media (width>=640px)')
      expect(result.css).not.toContain('referenced-native')
      expect(result.css).not.toContain('@reference')
      expect(result.manifest.utilities?.some((utility) => utility.name === 'brand') ?? false).toBe(false)
      expect(result.dependencies).toContain(entryPath)
      expect(result.dependencies).toContain(tokensPath)
      expect(result.compositions?.[0].definitionSources).toEqual(expect.arrayContaining([expect.objectContaining({ file: tokensPath })]))
      expect(result.compositions?.[0].source?.file).toBe(entryPath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('lets current definitions override referenced definitions', () => {
    const root = createFixture()
    try {
      const tokensPath = join(root, 'tokens.css')
      const entryPath = join(root, 'src/component.css')
      writeFileSync(tokensPath, '@utilities { brand { color: red; } }')
      writeFileSync(entryPath, `
        @reference "../tokens.css";

        @utilities {
          brand {
            color: blue;
          }
        }

        .button {
          @compose brand;
        }
      `)

      const result = compileCSSManifestFile(entryPath)

      expect(result.css).toContain('.button{color:#00f}')
      expect(result.css).not.toContain('color:red')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('reports references from project manifest entries and rejects circular references', () => {
    const root = createFixture()
    try {
      const aPath = join(root, 'a.css')
      const bPath = join(root, 'b.css')
      writeFileSync(aPath, [
        '@master entry;',
        '@reference "./b.css";',
        '.a { @compose b; }'
      ].join('\n'))
      writeFileSync(bPath, '@utilities { b { display: block; } }')

      const result = compileProjectManifest([aPath])
      expect(result.css).toContain('.a{display:block}')
      expect(result.dependencies).toContain(aPath)
      expect(result.dependencies).toContain(bPath)

      writeFileSync(bPath, '@reference "./a.css";')
      expect(() => compileProjectManifest([aPath])).toThrow('Circular CSS reference')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('keeps ordinary package imports before expanded Master CSS entries', () => {
    const root = createFixture()
    try {
      const entryPath = join(root, 'src/app.css')
      writeFileSync(entryPath, [
        '@import "@master/css";',
        '@import "fake-font/index.css";',
        '',
        '@theme {',
        '    --color-primary: #123456;',
        '}'
      ].join('\n'))

      const result = compileProjectManifest([entryPath])

      expect(result.dependencies).toContain(entryPath)
      expect(result.css).toContain('@import "fake-font/index.css"')
      expect(flattenMasterCSSManifestVariables(result.manifest.variables)).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: 'color-primary',
          value: '#123456'
        })
      ]))
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})


test('references exported CSS authoring packages with compiler-only definition locations', () => {
  const root = createFixture()
  try {
    const packageDir = join(root, 'node_modules', '@acme', 'theme')
    mkdirSync(packageDir, { recursive: true })
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ name: '@acme/theme', exports: { '.': './master.css' } }))
    writeFileSync(join(packageDir, 'master.css'), '@utilities{paint{color:red}}@layer components{.button{display:flex}}')
    const file = join(root, 'src', 'local.css')
    writeFileSync(file, '@reference "@acme/theme";.local{@compose paint;}')
    const result = compileCSSManifestFile(file)
    expect(result.css).toContain('.local{color:red}')
    expect(result.css).not.toContain('.button')
    expect(result.compositions?.[0].definitionSources[0].file).toBe(realpathSync(join(packageDir, 'master.css')))
  } finally { rmSync(root, { recursive: true, force: true }) }
})
