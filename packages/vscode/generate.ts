import editJsonFile from 'edit-json-file'
import copyOrSymlink from '~/internal/utils/copy-or-symlink'
import settings from '../language-server/src/settings'
import { SEMANTIC_TOKEN_MODIFIERS } from '../language-service/src/common'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const pkg = editJsonFile(fileURLToPath(new URL('./package.json', import.meta.url)), { stringify_width: 4 })
const require = createRequire(import.meta.url)

pkg.unset('contributes.languages')
pkg.unset('contributes.grammars')
pkg.unset('contributes.css')
pkg.set('files', [
    'dist',
    'data',
    'LICENSE',
    'icon.png'
])

pkg.set('contributes.semanticTokenModifiers', SEMANTIC_TOKEN_MODIFIERS
    .filter((modifier) => modifier !== 'declaration' && modifier !== 'defaultLibrary')
    .map((modifier) => ({
        id: modifier,
        description: `Master CSS ${modifier} semantic token modifier.`
    })))

pkg.set('contributes.semanticTokenScopes', [
    {
        scopes: {
            class: ['entity.other.attribute-name.class.css'],
            'class.component': ['entity.other.attribute-name.class.css'],
            'class.declaration': ['entity.other.attribute-name.class.css'],
            'class.selector': ['entity.other.attribute-name.class.css'],
            enumMember: ['support.constant.property-value.css'],
            'enumMember.directive': ['support.constant.property-value.css'],
            'enumMember.query': ['support.constant.property-value.css'],
            'enumMember.unit': ['keyword.other.unit'],
            property: ['support.type.property-name.css'],
            'property.directive': ['support.type.property-name.css'],
            'property.query': ['support.type.property-name.css'],
            variable: ['variable.other.master-css.css', 'variable.css'],
            'variable.directive': ['variable.parameter.master-css.css'],
            'variable.selector': ['entity.other.attribute-name.id.css'],
            function: ['support.function.misc.css'],
            number: ['constant.numeric.css'],
            'number.query': ['constant.numeric.css'],
            string: ['string.quoted.css', 'string.quoted.html'],
            'string.quoted': ['string.quoted.css', 'string.quoted.html'],
            keyword: ['keyword.control.at-rule'],
            'keyword.directive': ['keyword.control.at-rule.master-css.css'],
            'keyword.query': ['keyword.control.at-rule'],
            modifier: ['entity.other.attribute-name.pseudo-class.css'],
            'modifier.directive': ['storage.modifier.master-css.css'],
            'modifier.pseudoClass': ['entity.other.attribute-name.pseudo-class.css'],
            'modifier.pseudoElement': ['entity.other.attribute-name.pseudo-element.css'],
            operator: ['keyword.operator.css'],
            'operator.directive': ['punctuation.section.property-list.begin.bracket.curly.css'],
            'operator.important': ['keyword.operator.important.css'],
            'operator.pseudoClass': ['entity.other.attribute-name.pseudo-class.css'],
            'operator.pseudoElement': ['entity.other.attribute-name.pseudo-element.css'],
            'operator.query': ['keyword.operator.css'],
            'operator.selector': ['keyword.operator.combinator'],
            'operator.unit': ['keyword.operator.css'],
            type: ['entity.name.tag.css'],
            'type.selector': ['entity.name.tag.css']
        }
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
