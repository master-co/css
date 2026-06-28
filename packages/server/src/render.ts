import { MasterCSS, createHydrationManifest } from '@master/css'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
    MASTER_CSS_HYDRATION_MANIFEST_ATTR,
    MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID,
    serializeMasterCSSHydrationManifest,
    type MasterCSSHydrationManifest
} from '@master/css-schema/hydration-manifest'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'
import parseHTML from './parse-html'
import getDefaultManifest from './default-manifest'
import createServerCSS from './create-server-css'
import { Element, Text, ChildNode } from 'domhandler'
import serialize from 'dom-serializer'

export type RenderExternalHydrationManifestSource =
    | string
    | ((json: string, hydrationManifest: MasterCSSHydrationManifest) => string)

export interface RenderExternalHydrationManifestOption {
    type: 'external'
    src: RenderExternalHydrationManifestSource
}

export type RenderHydrationManifestOption = 'return' | 'inject' | false | RenderExternalHydrationManifestOption

export interface RenderOptions {
    hydrationManifest?: RenderHydrationManifestOption
}

export interface RenderResult {
    html: string,
    css?: MasterCSS,
    classes: string[],
    nodes: ChildNode[],
    htmlElement: Element | null,
    headElement: Element | null,
    styleElement: Element | null,
    hydrationManifest?: MasterCSSHydrationManifest
}

function createHydrationManifestScript(hydrationManifest: MasterCSSHydrationManifest) {
    return new Element(
        'script',
        {
            type: 'application/json',
            id: MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
        },
        [new Text(serializeMasterCSSHydrationManifest(hydrationManifest))]
    )
}

function isHydrationManifestScript(node: ChildNode): node is Element {
    return node.type === 'script'
        && node.name === 'script'
        && node.attribs.id === MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
}

function setHydrationManifestScript(element: Element, hydrationManifest: MasterCSSHydrationManifest) {
    element.attribs.type = 'application/json'
    element.attribs.id = MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
    element.childNodes = [new Text(serializeMasterCSSHydrationManifest(hydrationManifest))]
}

function isExternalHydrationManifestOption(
    hydrationManifest: RenderHydrationManifestOption | undefined
): hydrationManifest is RenderExternalHydrationManifestOption {
    return typeof hydrationManifest === 'object' && hydrationManifest?.type === 'external'
}

function getExternalHydrationManifestSource(
    option: RenderExternalHydrationManifestOption,
    hydrationManifest: MasterCSSHydrationManifest
) {
    const json = serializeMasterCSSHydrationManifest(hydrationManifest)
    return typeof option.src === 'function'
        ? option.src(json, hydrationManifest)
        : option.src
}

function findHydrationManifestScripts(
    childNodes: ChildNode[],
    matches: { element: Element, childNodes: ChildNode[], index: number }[] = []
) {
    for (let index = 0; index < childNodes.length; index++) {
        const node = childNodes[index]
        if (isHydrationManifestScript(node)) {
            matches.push({ element: node, childNodes, index })
        }
        if ('childNodes' in node) {
            findHydrationManifestScripts(node.childNodes, matches)
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

function removeHydrationManifestScripts(nodes: ChildNode[]) {
    const existingScripts = findHydrationManifestScripts(nodes)
    for (let index = existingScripts.length - 1; index >= 0; index--) {
        const script = existingScripts[index]
        script.childNodes.splice(script.index, 1)
    }
    return existingScripts.length > 0
}

function removeExternalHydrationManifest(styleElement: Element | null) {
    if (styleElement) {
        delete styleElement.attribs[MASTER_CSS_HYDRATION_MANIFEST_ATTR]
    }
}

function injectExternalHydrationManifest(
    nodes: ChildNode[],
    styleElement: Element | null,
    src: string
) {
    removeHydrationManifestScripts(nodes)
    if (styleElement) {
        styleElement.attribs[MASTER_CSS_HYDRATION_MANIFEST_ATTR] = src
    }
}

function injectHydrationManifest(
    nodes: ChildNode[],
    htmlElement: Element | null,
    headElement: Element | null,
    styleElement: Element | null,
    hydrationManifest: MasterCSSHydrationManifest
) {
    removeExternalHydrationManifest(styleElement)
    const existingScripts = findHydrationManifestScripts(nodes)
    if (existingScripts.length) {
        const [firstScript, ...duplicateScripts] = existingScripts
        setHydrationManifestScript(firstScript.element, hydrationManifest)
        for (let index = duplicateScripts.length - 1; index >= 0; index--) {
            const script = duplicateScripts[index]
            script.childNodes.splice(script.index, 1)
        }
        return
    }

    const scriptElement = createHydrationManifestScript(hydrationManifest)
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
 * @param manifest
 */
export default function render(
    html: string,
    manifest?: MasterCSSManifest,
    options: RenderOptions = {}
): RenderResult {
    const context = parseHTML(html)
    const { classes, nodes, htmlElement } = context
    let { headElement, styleElement } = context
    const externalHydrationManifestOption = isExternalHydrationManifestOption(options.hydrationManifest)
        ? options.hydrationManifest
        : undefined
    if (!classes.length && externalHydrationManifestOption) {
        removeHydrationManifestScripts(nodes)
        removeExternalHydrationManifest(styleElement)
    }
    if (!classes.length) return {
        html: externalHydrationManifestOption
            ? serialize(nodes, {
                decodeEntities: false,
                encodeEntities: false
            })
            : html,
        classes,
        nodes,
        htmlElement,
        headElement,
        styleElement
    }
    const css = createServerCSS(manifest || getDefaultManifest())
    classes.forEach(eachClass => css.ensureClassRules(eachClass))
    const hydrationManifest = options.hydrationManifest === false
        ? undefined
        : createHydrationManifest(css)
    if (!css.text) {
        if ((options.hydrationManifest === 'inject' || externalHydrationManifestOption) && styleElement) {
            removeNode(nodes, styleElement)
            styleElement = null
        }
        if (externalHydrationManifestOption) {
            removeHydrationManifestScripts(nodes)
        }
        return {
            html: serialize(nodes, {
                decodeEntities: false,
                encodeEntities: false
            }),
            css,
            classes,
            hydrationManifest,
            nodes,
            htmlElement,
            headElement,
            styleElement
        }
    }
    if (styleElement) {
        styleElement.childNodes = [new Text(css.text)]
    } else {
        styleElement = new Element('style', { id: MASTER_CSS_RUNTIME_STYLE_ID }, [new Text(css.text)])
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
    if (options.hydrationManifest === 'inject' && hydrationManifest?.rules.length) {
        injectHydrationManifest(nodes, htmlElement, headElement, styleElement, hydrationManifest)
    } else if (externalHydrationManifestOption && hydrationManifest?.rules.length) {
        injectExternalHydrationManifest(
            nodes,
            styleElement,
            getExternalHydrationManifestSource(externalHydrationManifestOption, hydrationManifest)
        )
    } else {
        removeExternalHydrationManifest(styleElement)
    }
    return {
        html: serialize(nodes, {
            decodeEntities: false,
            encodeEntities: false
        }),
        css,
        classes,
        hydrationManifest,
        nodes,
        htmlElement,
        headElement,
        styleElement
    }
}
