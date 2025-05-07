// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

import getCollectionVariables from './utils/get-collection-variables'
import getVariableCollections from './utils/get-variable-collections'

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { themeColors: true, width: 240 })
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
        case 'notify':
            figma.notify(data.message, data.options)
    }
}