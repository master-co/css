import editJsonFile from 'edit-json-file'
import copyOrSymlink from '~/internal/utils/copy-or-symlink'
import settings from '../language-server/src/settings'
import { SEMANTIC_TOKEN_MODIFIERS } from '../language-service/src/common'
import { MASTER_CSS_SEMANTIC_TOKEN_SCOPE_MAP } from '../language-service/src/semantic/scopes'
import {
    MASTER_CSS_SHIKI_INJECT_TO,
    MASTER_CSS_SHIKI_SCOPE_NAME
} from '../language-service/src/shiki/textmate'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const pkg = editJsonFile(fileURLToPath(new URL('./package.json', import.meta.url)), { stringify_width: 4 })
const require = createRequire(import.meta.url)
const MASTER_CSS_GRAMMAR_PATH = './node_modules/@master/css-language-service/syntaxes/master-css.tmLanguage.json'

pkg.unset('contributes.languages')
pkg.unset('contributes.css')
pkg.set('files', [
    'dist',
    'data',
    'LICENSE',
    'icon.png'
])
pkg.set('contributes.grammars', [
    {
        scopeName: MASTER_CSS_SHIKI_SCOPE_NAME,
        path: MASTER_CSS_GRAMMAR_PATH,
        injectTo: [...MASTER_CSS_SHIKI_INJECT_TO]
    }
])
pkg.set('contributes.configurationDefaults', {
    'css.lint.unknownAtRules': 'ignore',
    'scss.lint.unknownAtRules': 'ignore',
    'less.lint.unknownAtRules': 'ignore'
})

pkg.set('contributes.semanticTokenModifiers', SEMANTIC_TOKEN_MODIFIERS
    .filter((modifier) => modifier !== 'declaration' && modifier !== 'defaultLibrary')
    .map((modifier) => ({
        id: modifier,
        description: `Master CSS ${modifier} semantic token modifier.`
    })))

pkg.set('contributes.semanticTokenScopes', [
    {
        scopes: MASTER_CSS_SEMANTIC_TOKEN_SCOPE_MAP
    }
])

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
        'masterCSS.embeddedSyntaxHighlighting': {
            'type': 'string',
            'enum': ['active', 'always', 'off'],
            'default': settings.embeddedSyntaxHighlighting,
            'description': 'Controls embedded Master CSS utility highlighting in markup and scripts. Active highlights the class context at the active editor selection, always highlights all discovered embedded utilities, and off disables embedded utility highlighting. Master CSS syntax inside CSS documents is always highlighted.'
        },
        'masterCSS.workspaces': {
            'type': [
                'string',
                'array'
            ],
            'default': settings.workspaces,
            'description': 'Configure Master CSS workspaces. The default auto mode detects CSS files with @master; or @import "@master/css", and package.json files that declare Master CSS package dependencies.'
        }
    }
})

pkg.save()

copyOrSymlink(join(dirname(require.resolve('css-tree/package.json')), 'data'), fileURLToPath(new URL('./data', import.meta.url)))
