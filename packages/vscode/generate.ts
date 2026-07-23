import editJsonFile from 'edit-json-file'
import { defaultLanguageServerSettings as settings } from '@master/css-language-server'
import {
  MASTER_CSS_SEMANTIC_TOKEN_SCOPE_MAP,
  SEMANTIC_TOKEN_MODIFIERS
} from '@master/css-tooling/language'
import {
  MASTER_CSS_SHIKI_INJECT_TO,
  MASTER_CSS_SHIKI_SCOPE_NAME
} from '@master/css-language-service/shiki'
import { fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'

const packageJSONPath = fileURLToPath(new URL('./package.json', import.meta.url))
const pkg = editJsonFile(packageJSONPath, { stringify_width: 2 })
const MASTER_CSS_GRAMMAR_PATH = './node_modules/@master/css-language-service/syntaxes/master-css.tmLanguage.json'

pkg.unset('contributes.languages')
pkg.unset('contributes.css')
pkg.set('files', [
  'dist',
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
    'masterCSS.formatDirectives': {
      'type': 'boolean',
      'default': settings.formatDirectives,
      'description': 'Enables Master CSS directive formatting in CSS-family documents.'
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
      'description': 'Configure Master CSS workspaces. The default auto mode detects CSS files with @master entry; or @import "@master/css", and package.json files that declare Master CSS package dependencies.'
    }
  }
})

pkg.save()
const packageJSON = readFileSync(packageJSONPath, 'utf8')
if (!packageJSON.endsWith('\n')) writeFileSync(packageJSONPath, `${packageJSON}\n`)
