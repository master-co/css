import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './main.scss'
import post from './utils/post'
import notify from './utils/notify'
import exportFile from './utils/export-file'
import copy from 'copy-to-clipboard'

interface VariableMode {
    id: string
    name: string
}

interface VariableCollection {
    id: string
    name: string
    modes: VariableMode[]
}

type PluginMessage =
    | { type: 'get-variable-collections'; data: VariableCollection[] }
    | { type: 'get-collection-variables'; data: any }

function ExportVariables() {
    const [varCollections, setVarCollections] = useState<VariableCollection[]>([])
    const [selectedVarCollection, setSelectedVarCollection] = useState<VariableCollection | null>(null)
    const [selectedVarDefaultMode, setSelectedVarDefaultMode] = useState<VariableMode | null>(null)
    const [selectedVarColorSpace, setSelectedVarColorSpace] = useState('oklch')
    const [varOutputIndent, setVarOutputIndent] = useState(4)
    const [currentAction, setCurrentAction] = useState<'copy-variables' | 'export-variables' | null>(null)

    const handleVarCollectionChange = (collection: VariableCollection | null) => {
        setSelectedVarCollection(collection)
        if (!collection) {
            setSelectedVarDefaultMode(null)
            return
        }

        if (collection.modes.length === 1) {
            setSelectedVarDefaultMode(collection.modes[0])
        } else {
            const defaultMode =
                collection.modes.find(({ name }) =>
                    ['Default', 'default', 'Value', 'value', '預設', '默认'].includes(name)
                ) || null
            setSelectedVarDefaultMode(defaultMode)
        }
    }

    const requestCollectionVariables = (action: 'copy-variables' | 'export-variables') => {
        if (!selectedVarCollection) return
        setCurrentAction(action)
        post('get-collection-variables', {
            collectionId: selectedVarCollection.id,
            selectedVarDefaultMode,
            selectedVarColorSpace,
        })
    }

    useEffect(() => {
        const handler = (event: MessageEvent<{ pluginMessage: PluginMessage }>) => {
            const { type, data } = event.data.pluginMessage

            if (type === 'get-variable-collections') {
                setVarCollections(data)
                handleVarCollectionChange(data[0] || null)
            }

            if (type === 'get-collection-variables') {
                const json = JSON.stringify(data, null, varOutputIndent)
                const collectionName = selectedVarCollection?.name || 'collection'

                if (currentAction === 'copy-variables') {
                    copy(json)
                    notify(`Variable collection ${collectionName} copied to clipboard`)
                } else if (currentAction === 'export-variables') {
                    exportFile(json, `${collectionName}.json`)
                    notify(`Variable collection ${collectionName} exported`)
                }

                setCurrentAction(null)
            }
        }

        window.addEventListener('message', handler)
        post('get-variable-collections')

        return () => window.removeEventListener('message', handler)
    }, [selectedVarCollection, selectedVarDefaultMode, selectedVarColorSpace, varOutputIndent, currentAction])

    return (
        <section>
            <div className="panel-rows">
                <div className="panel-prop">
                    <label htmlFor="var-collections">Collection:</label>
                    <select
                        id="var-collections"
                        value={selectedVarCollection?.id || ''}
                        onChange={(e) => {
                            const collection = varCollections.find((v) => v.id === e.target.value) || null
                            handleVarCollectionChange(collection)
                        }}
                    >
                        {varCollections.map((collection) => (
                            <option key={collection.id} value={collection.id}>
                                {collection.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="panel-prop">
                    <label htmlFor="var-collection-default-mode">Default Mode:</label>
                    <select
                        id="var-collection-default-mode"
                        value={selectedVarDefaultMode?.id || ''}
                        onChange={(e) => {
                            const mode = selectedVarCollection?.modes.find((m) => m.id === e.target.value) || null
                            setSelectedVarDefaultMode(mode)
                        }}
                    >
                        <option value="">None</option>
                        {selectedVarCollection?.modes.map((mode) => (
                            <option key={mode.id} value={mode.id}>
                                {mode.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="panel-prop">
                    <label htmlFor="var-collection-color-space">Color Space:</label>
                    <select
                        id="var-collection-color-space"
                        value={selectedVarColorSpace}
                        onChange={(e) => setSelectedVarColorSpace(e.target.value)}
                    >
                        {['hex', 'rgb', 'hsl', 'lab', 'oklab', 'oklch'].map((space) => (
                            <option key={space} value={space}>
                                {space.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="panel-prop">
                    <label htmlFor="var-output-indent">Indent:</label>
                    <input
                        id="var-output-indent"
                        type="number"
                        min={0}
                        max={8}
                        value={varOutputIndent}
                        onChange={(e) => setVarOutputIndent(parseInt(e.target.value, 10))}
                    />
                </div>

                <button onClick={() => requestCollectionVariables('copy-variables')}>Copy as JSON</button>
                <button onClick={() => requestCollectionVariables('export-variables')}>Export as JSON</button>
            </div>
        </section>
    )
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ExportVariables />
    </StrictMode>,
)
