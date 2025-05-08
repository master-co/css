import copy from 'copy-to-clipboard'
import { states } from './ui-common'
import notify from './utils/notify'
import exportFile from './utils/export-file'

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
            break
    }
}
