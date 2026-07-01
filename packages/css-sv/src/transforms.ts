import { fileExists, transforms, Walker } from '@sveltejs/sv-utils'
import type { Workspace } from 'sv'

export const MASTER_CSS_PACKAGE = '@master/css'
export const MASTER_CSS_VERSION = 'rc'
export const MASTER_CSS_SVELTE_PACKAGE = '@master/css.svelte'
export const MASTER_CSS_SVELTE_VERSION = 'rc'
export const MASTER_CSS_SVELTE_VITE_IMPORT = '@master/css.svelte/vite'
export const MASTER_CSS_SVELTE_HOOK_IMPORT = '@master/css.svelte/hooks.server'

const MASTER_CSS_VITE_PLUGIN_NAME = 'masterCSS'
const MASTER_CSS_IMPORTED_HANDLE_NAME = 'masterCSSSvelteHandle'
const MASTER_CSS_HANDLE_NAME = 'masterCSSHandle'

type Language = Workspace['language']

interface ImportDeclaration {
    type: 'ImportDeclaration'
    source: { value?: unknown }
    specifiers?: {
        type: string
        local?: { name?: string }
    }[]
}

interface CallExpression {
    type: 'CallExpression'
    callee?: {
        type: string
        name?: string
    }
    arguments?: unknown[]
}

interface Identifier {
    type: 'Identifier'
    name: string
}

function isImportDeclaration(node: unknown): node is ImportDeclaration {
    return !!node && typeof node === 'object' && (node as { type?: unknown }).type === 'ImportDeclaration'
}

function isIdentifier(value: unknown, name?: string): value is Identifier {
    return !!value
        && typeof value === 'object'
        && (value as { type?: unknown }).type === 'Identifier'
        && (name === undefined || (value as { name?: unknown }).name === name)
}

function findDefaultImportName(ast: { body: unknown[] }, from: string) {
    for (const node of ast.body) {
        if (!isImportDeclaration(node) || node.source.value !== from) continue
        const defaultSpecifier = node.specifiers?.find((specifier) => specifier.type === 'ImportDefaultSpecifier')
        if (defaultSpecifier?.local?.name) return defaultSpecifier.local.name
    }
}

function moveSequenceHandleFirst(ast: unknown, handleName: string) {
    Walker.walk(ast as { type: string }, null, {
        CallExpression(node: CallExpression, { next }: { next: () => void }) {
            if (node.callee?.type === 'Identifier' && node.callee.name === 'sequence' && node.arguments) {
                const currentIndex = node.arguments.findIndex((argument) => isIdentifier(argument, handleName))
                if (currentIndex > 0) {
                    const [handle] = node.arguments.splice(currentIndex, 1)
                    node.arguments.unshift(handle)
                }
            }
            next()
        }
    })
}

export function addMasterCSSVitePlugin(content: string) {
    return transforms.script(({ ast, js }) => {
        const pluginName = findDefaultImportName(ast, MASTER_CSS_SVELTE_VITE_IMPORT) ?? MASTER_CSS_VITE_PLUGIN_NAME
        js.imports.addDefault(ast, {
            from: MASTER_CSS_SVELTE_VITE_IMPORT,
            as: pluginName
        })
        js.vite.addPlugin(ast, {
            code: `${pluginName}()`
        })
    })(content)
}

export function addMasterCSSStylesheetImport(content: string) {
    return transforms.css(({ ast, css }) => {
        css.addImports(ast, {
            imports: [`'${MASTER_CSS_PACKAGE}'`]
        })
    })(content)
}

export function addStylesheetImportToLayout(
    content: string,
    language: Language,
    stylesheetRelativePath: string,
    svelteVersion: string
) {
    return transforms.svelteScript({ language }, ({ ast, js, svelte }) => {
        js.imports.addEmpty(ast.instance.content, {
            from: stylesheetRelativePath
        })
        if (ast.fragment.nodes.length === 0) {
            svelte.addSlot(ast, {
                svelteVersion,
                language
            })
        }
    })(content)
}

export function addMasterCSSServerHook(content: string, language: Language) {
    return transforms.script(({ ast, comments, js }) => {
        js.kit.addHooksHandle(ast, {
            language,
            newHandleName: MASTER_CSS_HANDLE_NAME,
            handleContent: MASTER_CSS_IMPORTED_HANDLE_NAME,
            comments
        })
        moveSequenceHandleFirst(ast, MASTER_CSS_HANDLE_NAME)
        js.imports.addDefault(ast, {
            from: MASTER_CSS_SVELTE_HOOK_IMPORT,
            as: MASTER_CSS_IMPORTED_HANDLE_NAME
        })
    })(content)
}

export function resolveHooksServerPath(cwd: string, srcDirectory: string, language: Language) {
    const candidates = [
        `${srcDirectory}/hooks.server.ts`,
        `${srcDirectory}/hooks.server.js`
    ]
    return candidates.find((candidate) => fileExists(cwd, candidate)) ?? `${srcDirectory}/hooks.server.${language}`
}
