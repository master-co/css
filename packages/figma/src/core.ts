// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

import getCollectionVariables from './get-collection-variables'
import getVariableCollections from './get-variable-collections'

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { themeColors: true })

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = async ({ type, data }) => {
    switch (type) {
        case 'get-collection-variables':
            figma.ui.postMessage({ type, data: await getCollectionVariables(data.id) }, { origin: '*' })
            return
        case 'get-variable-collections':
            figma.ui.postMessage({ type, data: await getVariableCollections() }, { origin: '*' })
            return
    }
}

copyText('Hello world')

async function copyText(text: string) {
    try {
        // 嘗試使用 Clipboard API（大部分瀏覽器支援，但 Figma sandbox 不支援）
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(text)
            return true
        }
    } catch (err) {
        console.warn('Clipboard API failed:', err)
    }

    // fallback 傳統方式（Figma plugin 中唯一可靠方式）
    try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed' // 避免跳動
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()

        const success = document.execCommand('copy')
        document.body.removeChild(textarea)

        return success
    } catch (err) {
        console.error('Fallback copy failed:', err)
        return false
    }
}