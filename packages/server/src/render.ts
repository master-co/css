import { MasterCSS, createCSS, createRuntimeManifest, defaultPlan } from '@master/css'
import type { MasterCSSPlan } from 'shared/master-css-plan'
import {
    MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID,
    serializeMasterCSSRuntimeManifest,
    type MasterCSSRuntimeManifest
} from 'shared/master-css-runtime-manifest'
import parseHTML from './parse-html'
import { Element, Text, ChildNode } from 'domhandler'
import serialize from 'dom-serializer'

export type RenderRuntimeManifestOption = 'return' | 'inject' | false

export interface RenderOptions {
    runtimeManifest?: RenderRuntimeManifestOption
}

export interface RenderResult {
    html: string,
    css?: MasterCSS,
    classes: string[],
    nodes: ChildNode[],
    htmlElement: Element | null,
    headElement: Element | null,
    styleElement: Element | null,
    manifest?: MasterCSSRuntimeManifest
}

function createRuntimeManifestScript(manifest: MasterCSSRuntimeManifest) {
    return new Element(
        'script',
        {
            type: 'application/json',
            id: MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID
        },
        [new Text(serializeMasterCSSRuntimeManifest(manifest))]
    )
}

function isRuntimeManifestScript(node: ChildNode): node is Element {
    return node.type === 'script'
        && node.name === 'script'
        && node.attribs.id === MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID
}

function setRuntimeManifestScript(element: Element, manifest: MasterCSSRuntimeManifest) {
    element.attribs.type = 'application/json'
    element.attribs.id = MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID
    element.childNodes = [new Text(serializeMasterCSSRuntimeManifest(manifest))]
}

function findRuntimeManifestScripts(
    childNodes: ChildNode[],
    matches: { element: Element, childNodes: ChildNode[], index: number }[] = []
) {
    for (let index = 0; index < childNodes.length; index++) {
        const node = childNodes[index]
        if (isRuntimeManifestScript(node)) {
            matches.push({ element: node, childNodes, index })
        }
        if ('childNodes' in node) {
            findRuntimeManifestScripts(node.childNodes, matches)
        }
    }
    return matches
}

function removeNode(nodes: ChildNode[], target: ChildNode) {
    const index = nodes.indexOf(target)
    if (index !== -1) {
        nodes.splice(index, 1)
        return true
    }
    for (const node of nodes) {
        if ('childNodes' in node && removeNode(node.childNodes, target)) {
            return true
        }
    }
    return false
}

function injectRuntimeManifest(
    nodes: ChildNode[],
    htmlElement: Element | null,
    headElement: Element | null,
    styleElement: Element | null,
    manifest: MasterCSSRuntimeManifest
) {
    const existingScripts = findRuntimeManifestScripts(nodes)
    if (existingScripts.length) {
        const [firstScript, ...duplicateScripts] = existingScripts
        setRuntimeManifestScript(firstScript.element, manifest)
        for (let index = duplicateScripts.length - 1; index >= 0; index--) {
            const script = duplicateScripts[index]
            script.childNodes.splice(script.index, 1)
        }
        return
    }

    const scriptElement = createRuntimeManifestScript(manifest)
    if (headElement) {
        headElement.childNodes.push(scriptElement)
    } else if (htmlElement) {
        headElement = new Element('head', {}, [scriptElement])
        htmlElement.childNodes.unshift(headElement)
    } else {
        const styleElementIndex = styleElement ? nodes.indexOf(styleElement) : -1
        if (styleElementIndex === -1) {
            nodes.unshift(scriptElement)
        } else {
            nodes.splice(styleElementIndex + 1, 0, scriptElement)
        }
    }
}

/**
 * Renders the page-required and sorted CSS text from HTML and injected it back into HTML
 * @param html
 * @param plan
 */
export default function render(
    html: string,
    plan: MasterCSSPlan = defaultPlan,
    options: RenderOptions = {}
): RenderResult {
    const context = parseHTML(html)
    const { classes, nodes, htmlElement } = context
    let { headElement, styleElement } = context
    if (!classes.length) return {
        html,
        classes,
        nodes,
        htmlElement,
        headElement,
        styleElement
    }
    const css = createCSS(plan)
    classes.forEach(eachClass => css.add(eachClass))
    const manifest = options.runtimeManifest === false
        ? undefined
        : createRuntimeManifest(css)
    if (!css.text) {
        if (options.runtimeManifest === 'inject' && styleElement) {
            removeNode(nodes, styleElement)
            styleElement = null
        }
        return {
            html: serialize(nodes, {
                decodeEntities: false,
                encodeEntities: false
            }),
            css,
            classes,
            manifest,
            nodes,
            htmlElement,
            headElement,
            styleElement
        }
    }
    if (styleElement) {
        styleElement.childNodes = [new Text(css.text)]
    } else {
        styleElement = new Element('style', { id: 'master' }, [new Text(css.text)])
        if (headElement) {
            headElement.childNodes.push(styleElement)
        } else {
            if (htmlElement) {
                headElement = new Element('head', {}, [styleElement])
                htmlElement.childNodes.unshift(headElement)
            } else {
                nodes.unshift(styleElement)
            }
        }
    }
    if (options.runtimeManifest === 'inject' && manifest?.rules.length) {
        injectRuntimeManifest(nodes, htmlElement, headElement, styleElement, manifest)
    }
    return {
        html: serialize(nodes, {
            decodeEntities: false,
            encodeEntities: false
        }),
        css,
        classes,
        manifest,
        nodes,
        htmlElement,
        headElement,
        styleElement
    }
}
