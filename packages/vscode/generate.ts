import path from 'node:path'
import editJsonFile from 'edit-json-file'
import syncFolder from '~/internal/utils/sync-folder'
import { grammars, declaration } from '../language/src'
import settings from '../language-server/src/settings'

const cwd = process.cwd()
const __dirname = path.dirname(new URL(import.meta.url).pathname)
const pkg = editJsonFile(path.join(cwd, './package.json'), { stringify_width: 4 })

pkg.set('contributes.languages', [declaration])

pkg.set('contributes.grammars', grammars.map((grammar) => {
    const newGrammar: any = {
        scopeName: grammar.scopeName,
        path: `./syntaxes/${grammar.scopeName.replace('source.', '')}.json`,
    }
    if (grammar.embeddedLanguages) newGrammar.embeddedLanguages = grammar.embeddedLanguages
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
        'masterCSS.workspaces': {
            'type': [
                'string',
                'array'
            ],
            'default': settings.workspaces
        }
    }
})

pkg.save()

syncFolder(path.join(__dirname, '../language/syntaxes'), path.join(cwd, './syntaxes'))
