import editJsonFile from 'edit-json-file'
import copyOrSymlink from '~/internal/utils/copy-or-symlink'
import settings from '../language-server/src/settings'
import { grammars, declaration } from '../language/src'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const pkg = editJsonFile(fileURLToPath(new URL('./package.json', import.meta.url)), { stringify_width: 4 })
const require = createRequire(import.meta.url)

pkg.set('contributes.languages', [declaration])

pkg.set('contributes.grammars', grammars.map((grammar) => {
    const newGrammar: any = {
        scopeName: grammar.scopeName,
        path: `./syntaxes/${grammar.scopeName.replace('source.', '')}.json`,
    }
    if (grammar.vscodeEmbeddedLanguages) newGrammar.embeddedLanguages = grammar.vscodeEmbeddedLanguages
    if (grammar.injectTo) newGrammar.injectTo = grammar.injectTo
    return newGrammar
}))

pkg.set('contributes.configuration', {
    title: 'Master CSS',
    properties: {
        'masterCSS.includedLanguages': {
            'type': 'array',
            'items': {
                'type': 'string'
            },
            'default': settings.includedLanguages
        },
        'masterCSS.exclude': {
            'type': 'array',
            'items': {
                'type': 'string'
            },
            'default': settings.exclude,
            'description': 'Configure glob patterns to exclude from all Master Language Service features.'
        },
        'masterCSS.classAttributes': {
            'type': 'array',
            'items': {
                'type': 'string'
            },
            'default': settings.classAttributes
        },
        'masterCSS.classAttributeBindings': {
            'type': 'object',
            'default': settings.classAttributeBindings
        },
        'masterCSS.classDeclarations': {
            'type': 'array',
            'items': {
                'type': 'string'
            },
            'default': settings.classDeclarations
        },
        'masterCSS.classFunctions': {
            'type': 'array',
            'items': {
                'type': 'string'
            },
            'default': settings.classFunctions
        },
        'masterCSS.suggestSyntax': {
            'type': 'boolean',
            'default': settings.suggestSyntax
        },
        'masterCSS.inspectSyntax': {
            'type': 'boolean',
            'default': settings.inspectSyntax
        },
        'masterCSS.renderSyntaxColors': {
            'type': 'boolean',
            'default': settings.renderSyntaxColors
        },
        'masterCSS.renderSemanticTokens': {
            'type': 'boolean',
            'default': settings.renderSemanticTokens
        },
        'masterCSS.workspaces': {
            'type': [
                'string',
                'array'
            ],
            'default': settings.workspaces,
            'description': 'Configure Master CSS workspaces. The default auto mode detects master.css / master.css.* configuration files and package.json files that declare Master CSS package dependencies.'
        }
    }
})

pkg.save()

copyOrSymlink(fileURLToPath(new URL('../language/syntaxes', import.meta.url)), fileURLToPath(new URL('./syntaxes', import.meta.url)))

// The bundled SWC wasm loader reads this asset from the extension dist directory.
const swcWasmMainPath = require.resolve('@swc/wasm', {
    paths: [
        fileURLToPath(new URL('../explore-config', import.meta.url))
    ]
})
const swcWasmPath = resolve(dirname(swcWasmMainPath), 'wasm_bg.wasm')
const distDir = fileURLToPath(new URL('./dist', import.meta.url))
mkdirSync(distDir, { recursive: true })
copyFileSync(swcWasmPath, resolve(distDir, 'wasm_bg.wasm'))
