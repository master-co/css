/* eslint-disable */
const targetOrigin = parent.document.location.origin
let htmlContent = ''

const compiledStyle = document.createElement('style')
compiledStyle.type = 'text/css'
compiledStyle.setAttribute('data-master-play-compiled', '')
document.head.appendChild(compiledStyle)

const syncRoot = () => {
    document.documentElement.className = parent.document.documentElement.className.replace('overflow-x:hidden', '')
    document.documentElement.setAttribute('style', parent.document.documentElement.getAttribute('style') || '')
}

const renderHTML = (content) => {
    htmlContent = content
    document.body.innerHTML = htmlContent
}

document.addEventListener('DOMContentLoaded', () => {
    syncRoot()
    parent.postMessage({ type: 'previewReady' }, targetOrigin)
})

const observer = new MutationObserver(syncRoot)

observer.observe(parent.document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style']
})

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
