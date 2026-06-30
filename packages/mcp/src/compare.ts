import { createRequire } from 'node:module'
import CSSLanguageService from '@master/css-language-service'
import type { MasterCSSManifest } from '@master/css-engine'
import { createCSSWithNativeDeclarations } from '@master/css-validator/native-declaration'
import { parseHTML } from '@master/css-server'
import type MasterCSSMCPContext from './context'
import { createMCPTextDocument } from './document'
import { loadWorkspaceManifest } from './project'

const CSS_COMPARE_VERSION = 1
const require = createRequire(import.meta.url)
const defaultManifest = require('@master/css-preset/default-manifest.json') as MasterCSSManifest

export interface CompareCSSOptions {
    beforeClassList?: string
    afterClassList?: string
    beforeHtml?: string
    afterHtml?: string
    beforeContent?: string
    afterContent?: string
    filePath?: string
}

function unique(values: string[]) {
    return [...new Set(values)]
}

function splitClassList(value: string | undefined) {
    return unique((value ?? '').split(/\s+/).map((className) => className.trim()).filter(Boolean))
}

function extractContentClasses(content: string | undefined, filePath: string) {
    if (content === undefined) return []
    const service = new CSSLanguageService()
    const document = createMCPTextDocument(filePath, content)
    return unique(service.getClassPositions(document).map((position) => position.token))
}

function resolveClasses(options: CompareCSSOptions, side: 'before' | 'after', filePath: string) {
    const classList = side === 'before' ? options.beforeClassList : options.afterClassList
    const html = side === 'before' ? options.beforeHtml : options.afterHtml
    const content = side === 'before' ? options.beforeContent : options.afterContent
    if (classList !== undefined) return splitClassList(classList)
    if (html !== undefined) return unique(parseHTML(html).classes)
    return extractContentClasses(content, filePath)
}

function renderClasses(manifest: MasterCSSManifest, classes: string[]) {
    const css = createCSSWithNativeDeclarations(manifest)
    const invalid: string[] = []
    for (const className of classes) {
        const rules = css.generate(className)
        if (rules.length) {
            for (const rule of rules) rule.layer.insert(rule)
        } else {
            invalid.push(className)
        }
    }
    return {
        text: css.text,
        bytes: css.text.length,
        invalid
    }
}

function diffValues(before: string[], after: string[]) {
    return {
        added: after.filter((value) => !before.includes(value)),
        removed: before.filter((value) => !after.includes(value)),
        unchanged: after.filter((value) => before.includes(value))
    }
}

function splitRules(css: string) {
    return css.split(/(?<=})/).map((rule) => rule.trim()).filter(Boolean)
}

function createTextDiff(before: string, after: string) {
    if (before === after) return ''
    const beforeLines = before.split('\n')
    const afterLines = after.split('\n')
    return [
        '--- before.css',
        '+++ after.css',
        '@@',
        ...beforeLines.map((line) => `-${line}`),
        ...afterLines.map((line) => `+${line}`)
    ].join('\n')
}

export async function compareCSS(context: MasterCSSMCPContext, options: CompareCSSOptions) {
    const manifest = await loadWorkspaceManifest(context)
    const filePath = context.resolveVirtualPath(options.filePath || 'index.html')
    const activeManifest = manifest.status === 'loaded' ? manifest.manifest : defaultManifest
    const beforeClasses = resolveClasses(options, 'before', filePath)
    const afterClasses = resolveClasses(options, 'after', filePath)
    const before = renderClasses(activeManifest, beforeClasses)
    const after = renderClasses(activeManifest, afterClasses)
    const classDiff = diffValues(beforeClasses, afterClasses)
    const beforeRules = splitRules(before.text)
    const afterRules = splitRules(after.text)
    const ruleDiff = diffValues(beforeRules, afterRules)
    return {
        version: CSS_COMPARE_VERSION,
        root: context.root,
        manifest: {
            status: manifest.status,
            entries: manifest.entries,
            ...(manifest.status === 'error' ? { error: manifest.error } : {})
        },
        inputs: {
            filePath,
            before: {
                classes: beforeClasses.length,
                invalid: before.invalid.length
            },
            after: {
                classes: afterClasses.length,
                invalid: after.invalid.length
            }
        },
        classes: classDiff,
        invalid: {
            before: before.invalid,
            after: after.invalid,
            added: after.invalid.filter((className) => !before.invalid.includes(className)),
            removed: before.invalid.filter((className) => !after.invalid.includes(className))
        },
        css: {
            changed: before.text !== after.text,
            before: {
                bytes: before.bytes,
                text: before.text
            },
            after: {
                bytes: after.bytes,
                text: after.text
            },
            bytesDelta: after.bytes - before.bytes,
            diff: createTextDiff(before.text, after.text)
        },
        rules: {
            added: ruleDiff.added,
            removed: ruleDiff.removed,
            unchanged: ruleDiff.unchanged.length
        },
        summary: {
            changed: before.text !== after.text,
            addedClasses: classDiff.added.length,
            removedClasses: classDiff.removed.length,
            addedRules: ruleDiff.added.length,
            removedRules: ruleDiff.removed.length,
            bytesDelta: after.bytes - before.bytes
        }
    }
}
