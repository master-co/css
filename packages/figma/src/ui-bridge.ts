import copy from 'copy-to-clipboard'
import { states } from './ui-common'
import notify from './utils/notify'

window.onmessage = (event) => {
    const { type, data } = event.data.pluginMessage
    switch (type) {
        case 'get-collection-variables':
            switch (states.currentAction) {
                case 'copy-variables':
                    const config = data
                    if (config === undefined) {
                        console.error('No variables found for the selected collection')
                        return
                    }
                    copy(JSON.stringify(config, null, states.varOutputIndent))
                    notify('Variables copied to clipboard')
                    break
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
