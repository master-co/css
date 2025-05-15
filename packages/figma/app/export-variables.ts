// @ts-expect-error es
import { createApp, reactive } from 'petite-vue'
import './main.scss'
import post from './utils/post'
import notify from './utils/notify'
import exportFile from './utils/export-file'
import copy from 'copy-to-clipboard'

const states = reactive({
    selectedVarCollection: null,
    selectedVarDefaultMode: null,
    selectedVarColorSpace: 'oklch',
    varOutputIndent: 4,
    currentAction: null,
    varCollections: [],
    copyVariables: () => {
        states.currentAction = 'copy-variables'
        post('get-collection-variables', { collectionId: states.selectedVarCollection.id, selectedVarDefaultMode: states.selectedVarDefaultMode, selectedVarColorSpace: states.selectedVarColorSpace })
    },
    exportVariables: () => {
        states.currentAction = 'export-variables'
        post('get-collection-variables', { collectionId: states.selectedVarCollection.id, selectedVarDefaultMode: states.selectedVarDefaultMode, selectedVarColorSpace: states.selectedVarColorSpace })
    },
    varCollectionChange: () => {
        if (states.selectedVarCollection?.modes.length === 1) {
            states.selectedVarDefaultMode = states.selectedVarCollection.modes[0]
        } else {
            states.selectedVarDefaultMode = states.selectedVarCollection?.modes.find(({ name }: any) => ['Default', 'default', 'Value', 'value', '預設', '默认'].includes(name)) || null
        }
    }
})

window.onmessage = (event) => {
    const { type, data } = event.data.pluginMessage
    switch (type) {
        case 'get-collection-variables':
            const config = JSON.stringify(data, null, states.varOutputIndent)
            const collectionName = states.selectedVarCollection.name
            switch (states.currentAction) {
                case 'copy-variables':
                    copy(config)
                    notify(`Variable collection ${collectionName} copied to clipboard`)
                    break
                case 'export-variables':
                    exportFile(config, `${collectionName}.json`)
                    notify(`Variable collection ${collectionName} exported`)
                default:
                    break
            }
            break
        case 'get-variable-collections':
            states.varCollections = data
            states.selectedVarCollection = data[0]
            states.varCollectionChange()
            break
    }
}

createApp(states).mount()

post('get-variable-collections')