import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { compileCSSManifestFile, compileProjectManifest } from '../src/node-compiler'
import { flattenMasterCSSManifestVariables } from '@master/css-schema/manifest'

const baseManifest = {
  "version": 4 as const,
  "languageVersion": 13 as const,
  mixins: [
  {
    "name": "--all",
    "body": [
      {
        "type": "condition" as const,
        "condition": "@media all",
        "body": [
          {
            "type": "contents" as const,
            "fallback": []
          }
        ]
      }
    ]
  }
]
}

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'master-css-reference-'))
  mkdirSync(join(root, 'src'), { recursive: true })
  return root
}

describe('CSS @reference', () => {
  test('expands referenced value mixins without publishing their named families', () => {
    const root = createFixture()
    try {
      const entry = join(root, 'src/component.css')
      writeFileSync(join(root, 'tokens.css'), '@theme {--spacing-md:1rem}@mixin --p(--spacing){padding:var(--spacing)}')
      writeFileSync(entry, '@reference "../tokens.css";.button{@apply --p(var(--spacing-md,2rem))}')
      const result = compileCSSManifestFile(entry, { baseManifest })
      expect(result.css).toContain('.button{padding:var(--spacing-md,2rem)}')
      expect(result.css).not.toContain('--spacing-md:1rem')
      expect(result.manifest.mixins?.some(mixin => mixin.name === '--p') ?? false).toBe(false)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('uses referenced CSS as compose and variant context without outputting it', () => {
    const root = createFixture()
    try {
      const tokensPath = join(root, 'tokens.css')
      const entryPath = join(root, 'src/component.css')
      writeFileSync(tokensPath, `
        @theme {
          --color-brand: #123456;
        }

        @mixin --wide {
          @media (width >= 640px) {
            @contents;
          }
        }


          @mixin --brand {
            color: var(--color-brand);
          }


        .referenced-native {
          color: red;
        }
      `)
      writeFileSync(entryPath, "\n        @reference \"../tokens.css\";\n\n        .button {\n          @apply --all {color:var(--color-brand);}\n\n          @apply --wide {\n            @apply --all {color:var(--color-brand);}\n          }\n        }\n      ")

      const result = compileCSSManifestFile(entryPath, { baseManifest })

      expect(result.css).toContain('.button{color:var(--color-brand)}')
      expect(result.css).toContain('@media (width >= 640px)')
      expect(result.css).not.toContain('referenced-native')
      expect(result.css).not.toContain('@reference')
      expect(result.manifest.mixins?.some((utility) => utility.name === '--brand') ?? false).toBe(false)
      expect(result.dependencies).toContain(entryPath)
      expect(result.dependencies).toContain(tokensPath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('lets current definitions override referenced definitions', () => {
    const root = createFixture()
    try {
      const tokensPath = join(root, 'tokens.css')
      const entryPath = join(root, 'src/component.css')
      writeFileSync(tokensPath, ' @mixin --brand { color: red; } ')
      writeFileSync(entryPath, "\n        @reference \"../tokens.css\";\n\n        @mixin --brand {\n            color: blue;\n          }\n\n        .button {\n          @apply --all {color:#00f;}\n        }\n      ")

      const result = compileCSSManifestFile(entryPath, { baseManifest })

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
        '@import "@master/css";',
        '@reference "./b.css";',
        "@mixin --all{@contents;} .a { @apply --all{display:block;} }"
      ].join('\n'))
      writeFileSync(bPath, ' @mixin --b { display: block; } ')

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
        ' }'
      ].join('\n'))

      const result = compileProjectManifest([entryPath])

      expect(result.dependencies).toContain(entryPath)
      expect(result.css).toContain('@import "fake-font/index.css"')
      expect(flattenMasterCSSManifestVariables(result.manifest.variables)).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: 'color-primary',
          values: [{ path: [':root,:host'], value: '#123456' }]
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
    writeFileSync(join(packageDir, 'master.css'), '@mixin --paint {color:red}@layer components{.button{display:flex}}')
    const file = join(root, 'src', 'local.css')
    writeFileSync(file, "@reference \"@acme/theme\";.local{@apply --all {color:red;}}")
    const result = compileCSSManifestFile(file, { baseManifest })
    expect(result.css).toContain('.local{color:red}')
    expect(result.css).not.toContain('.button')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
