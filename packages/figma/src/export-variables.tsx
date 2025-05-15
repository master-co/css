import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './main.scss'
import notify from './utils/notify'
import exportFile from './utils/export-file'
import copy from 'copy-to-clipboard'
import post from './utils/post'
import postAndWaitForMessage from './utils/post-and-wait-for-message'
import usePluginMessage from './hooks/use-plugin-message'

interface VariableMode {
    id: string
    name: string
}

interface VariableCollection {
    id: string
    name: string
    modes: VariableMode[]
}

function ExportVariables() {
    const [varCollections, setVarCollections] = useState<VariableCollection[]>([])
    const [selectedVarCollection, setSelectedVarCollection] = useState<VariableCollection | null>(null)
    const [selectedVarDefaultMode, setSelectedVarDefaultMode] = useState<VariableMode | null>(null)
    const [selectedVarColorSpace, setSelectedVarColorSpace] = useState('oklch')
    const [varOutputIndent, setVarOutputIndent] = useState(4)
    const [isProcessing, setIsProcessing] = useState(false)

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

    const copyVariables = async () => {
        if (!selectedVarCollection || isProcessing) return
        setIsProcessing(true)
        try {
            const data = await postAndWaitForMessage<any>('get-collection-variables', {
                collectionId: selectedVarCollection.id,
                selectedVarDefaultMode,
                selectedVarColorSpace,
            })

            const json = JSON.stringify(data, null, varOutputIndent)
            copy(json)
            notify(`Variable collection ${selectedVarCollection.name} copied to clipboard`)
        } catch (err: any) {
            notify(err.message, 'error')
        } finally {
            setIsProcessing(false)
        }
    }

    const exportVariables = async () => {
        if (!selectedVarCollection || isProcessing) return
        setIsProcessing(true)
        try {
            const data = await postAndWaitForMessage<any>('get-collection-variables', {
                collectionId: selectedVarCollection.id,
                selectedVarDefaultMode,
                selectedVarColorSpace,
            })

            const json = JSON.stringify(data, null, varOutputIndent)
            exportFile(json, `${selectedVarCollection.name}.json`)
            notify(`Variable collection ${selectedVarCollection.name} exported`)
        } catch (err: any) {
            notify(err.message, 'error')
        } finally {
            setIsProcessing(false)
        }
    }

    usePluginMessage<VariableCollection[]>('get-variable-collections', (data) => {
        setVarCollections(data)
        handleVarCollectionChange(data[0] || null)
    })

    useEffect(() => {
        post('get-variable-collections')
    }, [])

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

                <button onClick={copyVariables} disabled={isProcessing}>
                    {isProcessing ? 'Copying...' : 'Copy as JSON'}
                </button>
                <button onClick={exportVariables} disabled={isProcessing}>
                    {isProcessing ? 'Exporting...' : 'Export as JSON'}
                </button>
            </div>
        </section>
    )
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ExportVariables />
    </StrictMode>
)
