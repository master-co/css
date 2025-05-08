import getCollectionVariables from './utils/get-collection-variables'
import getVariableCollections from './utils/get-variable-collections'

figma.showUI(__html__, { themeColors: true, width: 240, height: 182 })

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