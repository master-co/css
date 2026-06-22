const targetOrigin = parent.document.location.origin
let htmlContent = ''
const rootObservers = []

const compiledStyle = document.createElement('style')
compiledStyle.type = 'text/css'
compiledStyle.setAttribute('data-master-play-compiled', '')
document.head.appendChild(compiledStyle)

const syncRoot = () => {
    document.documentElement.className = parent.document.documentElement.className.replace('overflow-x:hidden', '')
    document.documentElement.setAttribute('style', parent.document.documentElement.getAttribute('style') || '')
}

const observeRoot = () => {
    try {
        const parentRoot = parent.document.documentElement
        if (!parentRoot?.nodeType) return

        const ParentMutationObserver = parentRoot.ownerDocument?.defaultView?.MutationObserver || parent.MutationObserver || MutationObserver
        const observer = new ParentMutationObserver(syncRoot)
        observer.observe(parentRoot, {
            attributes: true,
            attributeFilter: ['class', 'style']
        })
        rootObservers.push(observer)
    } catch {
        // Theme syncing is best-effort; preview updates should still boot.
    }
}

const renderHTML = (content) => {
    htmlContent = content
    document.body.innerHTML = htmlContent
}

document.addEventListener('DOMContentLoaded', () => {
    syncRoot()
    parent.postMessage({ type: 'previewReady' }, targetOrigin)
})

observeRoot()

window.addEventListener('message', function (event) {
    if (event.origin !== targetOrigin) { return }
    const { type, content, theme } = event.data
    switch (type) {
        case 'preview:update':
            if (typeof content?.html === 'string') {
                renderHTML(content.html)
            }
            if (typeof content?.css === 'string') {
                compiledStyle.textContent = content.css
            }
            break
        case 'preview:theme':
            syncRoot()
            if (theme) {
                document.documentElement.dataset.theme = theme
            }
            break
    }
})

window.addEventListener('error', function (event) {
    const errorEvent = {
        type: 'error',
        lineno: event.lineno,
        message: event.message,
        filename: event.filename,
        datetime: new Date()
    }
    if (document.readyState !== 'complete') {
        parent.__SANDBOX_INITIAL_ERROR_EVENT = errorEvent
    } else {
        parent.postMessage(errorEvent, targetOrigin)
    }
})
