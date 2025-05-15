import getCollectionVariables from './utils/get-collection-variables'
import getVariableCollections from './utils/get-variable-collections'
import setCollectionVariables from './utils/set-collection-variables'

const uiOptions: Record<string, ShowUIOptions> = {
    'export-variables': { width: 280, height: 245 },
    'import-variables': { width: 280, height: 266 }
}

figma.showUI(__uiFiles__[figma.command], {
    themeColors: true,
    ...uiOptions[figma.command],
})

figma.ui.onmessage = async ({ type, data }) => {
    if (data.collectionId) {
        const collection = await figma.variables.getLocalVariableCollectionsAsync
        if (!collection) {
            figma.notify('Variable collection not found')
            figma.ui.postMessage({ type: 'get-variable-collections', data: await getVariableCollections() }, { origin: '*' })
            return
        }
    }
    switch (type) {
        case 'get-collection-variables':
            figma.ui.postMessage({ type, data: await getCollectionVariables(data.collectionId, { defaultMode: data.selectedVarDefaultMode, colorSpace: data.selectedVarColorSpace }) }, { origin: '*' })
            return
        case 'get-variable-collections':
            figma.ui.postMessage({ type, data: await getVariableCollections() }, { origin: '*' })
            return
        case 'set-collection-variables':
            if (!data.inputedVarJSON.variables && !data.inputedVarJSON.modes) {
                figma.notify('No variables or modes found in config', { error: true })
                return
            }
            let collection: VariableCollection | null | undefined
            if (data.collectionId) {
                collection = await figma.variables.getVariableCollectionByIdAsync(data.collectionId)
            } else {
                const collections = await figma.variables.getLocalVariableCollectionsAsync()
                collection = collections.find(c => c.name === data.inputedVarCollectionName)
                if (!collection) {
                    collection = figma.variables.createVariableCollection(data.inputedVarCollectionName)
                    figma.ui.postMessage({ type: 'get-variable-collections', data: await getVariableCollections() }, { origin: '*' })
                }
            }
            if (!collection) {
                figma.notify('Failed to create variable collection')
                return
            }
            figma.ui.postMessage({ type, data: await setCollectionVariables(data.inputedVarJSON, collection) }, { origin: '*' })
            return
        case 'notify':
            figma.notify(data.message, { ...data.options, timeout: data?.options?.timeout === undefined ? 5000 : data.options.timeout })
    }
}
