import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createContext, runInContext } from 'node:vm'

type Listener = (event?: unknown) => void

type PreviewOperation =
    | { type: 'css', value: string }
    | { type: 'html', value: string, cssAtRender: string }

class FakeElement {
    className = ''
    hidden = false
    nodeType = 1
    ownerDocument?: FakeDocument
    type = ''
    private attributes = new Map<string, string>()

    getAttribute(name: string) {
        return this.attributes.get(name) ?? null
    }

    setAttribute(name: string, value: string) {
        this.attributes.set(name, value)
    }
}

class FakeStyleElement extends FakeElement {
    private text = ''

    constructor(private operations: PreviewOperation[]) {
        super()
    }

    get textContent() {
        return this.text
    }

    set textContent(value: string) {
        this.text = value
        this.operations.push({ type: 'css', value })
    }
}

class FakeBodyElement extends FakeElement {
    private html = ''

    constructor(
        private document: FakeDocument,
        private operations: PreviewOperation[]
    ) {
        super()
    }

    get innerHTML() {
        return this.html
    }

    set innerHTML(value: string) {
        this.html = value
        this.operations.push({
            type: 'html',
            value,
            cssAtRender: this.document.compiledStyle?.textContent ?? ''
        })
    }
}

class FakeHeadElement extends FakeElement {
    children: FakeElement[] = []

    constructor(private document: FakeDocument) {
        super()
    }

    appendChild(element: FakeElement) {
        this.children.push(element)
        if (element instanceof FakeStyleElement) {
            this.document.compiledStyle = element
        }
        return element
    }
}

class FakeDocument {
    documentElement: FakeElement
    head: FakeHeadElement
    body: FakeBodyElement
    defaultView?: { MutationObserver: typeof FakeMutationObserver }
    compiledStyle?: FakeStyleElement
    private listeners: Record<string, Listener[]> = {}

    constructor(private operations: PreviewOperation[]) {
        this.documentElement = new FakeElement()
        this.documentElement.hidden = true
        this.documentElement.ownerDocument = this
        this.head = new FakeHeadElement(this)
        this.body = new FakeBodyElement(this, operations)
    }

    createElement(tagName: string) {
        const element = tagName === 'style'
            ? new FakeStyleElement(this.operations)
            : new FakeElement()
        element.ownerDocument = this
        return element
    }

    addEventListener(type: string, listener: Listener) {
        this.listeners[type] ??= []
        this.listeners[type].push(listener)
    }

    dispatch(type: string) {
        this.listeners[type]?.forEach((listener) => listener({ type }))
    }
}

class FakeMutationObserver {
    constructor(private callback: () => void) { }

    observe() {
        return this.callback
    }
}

function createPreviewSandbox() {
    const operations: PreviewOperation[] = []
    const document = new FakeDocument(operations)
    const parentDocument = new FakeDocument([])
    parentDocument.defaultView = { MutationObserver: FakeMutationObserver }
    parentDocument.documentElement.ownerDocument = parentDocument
    const targetOrigin = 'https://css.master.co'
    const parentMessages: { message: unknown, origin: string }[] = []
    const frameCallbacks: (() => void)[] = []
    const windowListeners: Record<string, Listener[]> = {}
    const window = {
        addEventListener(type: string, listener: Listener) {
            windowListeners[type] ??= []
            windowListeners[type].push(listener)
        }
    }
    const parent = {
        document: {
            ...parentDocument,
            location: {
                origin: targetOrigin
            }
        },
        MutationObserver: FakeMutationObserver,
        postMessage(message: unknown, origin: string) {
            parentMessages.push({ message, origin })
        }
    }

    const context = createContext({
        document,
        parent,
        window,
        MutationObserver: FakeMutationObserver,
        requestAnimationFrame(callback: () => void) {
            frameCallbacks.push(callback)
            return frameCallbacks.length
        },
        Date,
        Error
    })

    runInContext(readFileSync(new URL('../../../[locale]/play/preview.js', import.meta.url), 'utf-8'), context)

    return {
        document,
        operations,
        parentMessages,
        targetOrigin,
        dispatchDOMContentLoaded() {
            document.dispatch('DOMContentLoaded')
        },
        dispatchMessage(data: unknown) {
            windowListeners.message?.forEach((listener) => listener({
                origin: targetOrigin,
                data
            }))
        },
        flushNextFrame() {
            const callback = frameCallbacks.shift()
            assert.ok(callback, 'expected a queued animation frame')
            callback()
        }
    }
}

test('keeps the initial preview hidden until compiled CSS and HTML are applied', () => {
    const sandbox = createPreviewSandbox()
    const css = '.ready{color:red}'
    const html = '<main class="ready">Ready</main>'

    sandbox.dispatchDOMContentLoaded()

    assert.equal(sandbox.document.documentElement.hidden, true)
    assert.equal(sandbox.parentMessages.length, 1)
    assert.equal((sandbox.parentMessages[0].message as { type?: string }).type, 'previewReady')
    assert.equal(sandbox.parentMessages[0].origin, sandbox.targetOrigin)

    sandbox.dispatchMessage({
        type: 'preview:update',
        content: { css, html }
    })

    assert.equal(sandbox.document.documentElement.hidden, true)
    assert.equal(sandbox.document.compiledStyle?.textContent, css)
    assert.equal(sandbox.document.body.innerHTML, html)
    assert.deepEqual(sandbox.operations, [
        { type: 'css', value: css },
        { type: 'html', value: html, cssAtRender: css }
    ])

    sandbox.flushNextFrame()

    assert.equal(sandbox.document.documentElement.hidden, false)
})

test('ignores stale preview reveal frames', () => {
    const sandbox = createPreviewSandbox()

    sandbox.dispatchMessage({
        type: 'preview:update',
        content: {
            css: '.first{color:red}',
            html: '<main class="first">First</main>'
        }
    })
    sandbox.dispatchMessage({
        type: 'preview:update',
        content: {
            css: '.second{color:blue}',
            html: '<main class="second">Second</main>'
        }
    })

    assert.equal(sandbox.document.documentElement.hidden, true)

    sandbox.flushNextFrame()

    assert.equal(sandbox.document.documentElement.hidden, true)

    sandbox.flushNextFrame()

    assert.equal(sandbox.document.documentElement.hidden, false)
    assert.equal(sandbox.document.compiledStyle?.textContent, '.second{color:blue}')
    assert.equal(sandbox.document.body.innerHTML, '<main class="second">Second</main>')
})
