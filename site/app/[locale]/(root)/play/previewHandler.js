/* eslint-disable */
const targetOrigin = parent.document.location.origin
let prevCssText = ''
let prevHtmlContent = ''

const updateCssText = (force) => {
    const sheet = document.querySelector('style[id="master"]')?.sheet
    if (sheet) {
        const cssText = Object.values(sheet.cssRules).map(x => x.cssText).join('\n')
        if (prevCssText !== cssText || force) {
            prevCssText = cssText
            parent.postMessage(
                {
                    type: 'cssUpdate',
                    content: cssText
                },
                targetOrigin
            )
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.className = parent.document.documentElement.className.replace('overflow-x:hidden', '')
    document.documentElement.setAttribute('style', parent.document.documentElement.getAttribute('style'))
    updateCssText()
})

const observer = new MutationObserver((records) => {
    records.forEach(({ attributeName }) => {
        switch (attributeName) {
            case 'class':
                /* 手動移除可能包含 Master CSS 的類名來避免 Generated CSS 包含 */
                document.documentElement.setAttribute('class',
                    parent.document.documentElement.getAttribute(attributeName)
                        .replace('overflow-x:hidden', '')
                )
                break
            case 'style':
                /* 手動移除可能包含 Master CSS 的類名來避免 Generated CSS 包含 */
                document.documentElement.setAttribute('style', parent.document.documentElement.getAttribute(attributeName))
                break
        }
    })
})

observer.observe(parent.document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style']
})

window.addEventListener('message', function (event) {
    const { type, language, content } = event.data
    if (event.origin !== targetOrigin) { return }
    switch (type) {
        case 'editorReady':
            updateCssText(true)
            break
        default:
            switch (language) {
                case 'html':
                    prevHtmlContent = content
                    this.document.body.innerHTML = content
                    break
                case 'javascript':
                    if (!prevHtmlContent) {
                        prevHtmlContent = this.document.body.innerHTML
                    } else {
                        this.document.body.innerHTML = prevHtmlContent
                    }
                    break
            }
            setTimeout(updateCssText, 0)
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
