import getCollectionVariables from './features/getCollectionVariables'
import setCollectionVariables from './features/setCollectionVariables'
import getVariableCollections from './features/getVariableCollections'

const uiOptions: Record<string, ShowUIOptions> = {
    'export-variables': { width: 280, height: 216, title: 'Export Variables - Master CSS' },
    'import-variables': { width: 280, height: 237, title: 'Import Variables - Master CSS' },
}

figma.showUI(__uiFiles__[figma.command], {
    themeColors: true,
    ...uiOptions[figma.command],
})

const features = {
    getCollectionVariables,
    setCollectionVariables,
    getVariableCollections,
}

figma.ui.onmessage = async ({ type, data }) => {
    if (data.varCollId) {
        const collections = await figma.variables.getLocalVariableCollectionsAsync()
        const collection = collections.find(c => c.id === data.varCollId)
        if (!collection) {
            figma.notify('Variable collection not found')
            figma.ui.postMessage({ type: 'getVariableCollections', data: await getVariableCollections() }, { origin: '*' })
            return
        }
    }
    if (type in features) {
        const feature = features[type as keyof typeof features]
        figma.ui.postMessage({ type, data: await feature(data) }, { origin: '*' })
    } else {
        switch (type) {
            case 'notify':
                figma.notify(data.message, { ...data.options, timeout: data?.options?.timeout === undefined ? 5000 : data.options.timeout })
        }
    }
}
