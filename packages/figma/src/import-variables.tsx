import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './main.scss'
import notify from './utils/notify'
import post from './utils/post'
import postAndWaitForMessage from './utils/post-and-wait-for-message'
import usePluginMessage from './hooks/use-plugin-message'
import { Config } from '@master/css'

interface VariableCollection {
    id: string
    name: string
}

const DEFAULT_INPUTED_VAR_JSON_STR = `{
  "variables": { "primary": "#ff0000" },
  "modes": {
    "light": { "primary": "#ffffff" },
    "dark": { "primary": "#000000" }
  }
}`

const DEFAULT_INPUTED_VAR_COLLECTION_NAME = 'My Collection'

function ImportVariables() {
    const [varCollections, setVarCollections] = useState<VariableCollection[]>([])
    const [selectedVarColl, setSelectedVarColl] = useState<VariableCollection | null>(null)
    const [configJSONStr, setConfigJSONStr] = useState<string | null>(null)
    const [newVarCollName, setNewCollName] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    usePluginMessage<VariableCollection[]>('getVariableCollections', (data) => {
        setVarCollections(data)
        if (data.length > 0) {
            setSelectedVarColl(data[0])
        }
    })

    useEffect(() => {
        post('getVariableCollections')
    }, [])

    const importVarJSON = async () => {
        if (isProcessing) return
        setIsProcessing(true)
        try {
            let configJSON: Config
            if (configJSONStr?.trim()) {
                try {
                    configJSON = JSON.parse(configJSONStr)
                } catch (e) {
                    notify('Invalid JSON format', { error: true })
                    return
                }
            } else {
                configJSON = JSON.parse(DEFAULT_INPUTED_VAR_JSON_STR)
            }
            await postAndWaitForMessage('setCollectionVariables', {
                varCollId: selectedVarColl?.id,
                newVarCollName: newVarCollName || DEFAULT_INPUTED_VAR_COLLECTION_NAME,
                configJSON,
            })
            notify('Import succeeded')
        } catch (err: any) {
            notify(err.message || 'Import failed', { error: true })
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <section>
            <div className="panel-rows">
                <textarea
                    id="var-input-json"
                    value={configJSONStr ?? ''}
                    onChange={(e) => setConfigJSONStr(e.target.value)}
                    placeholder={DEFAULT_INPUTED_VAR_JSON_STR}
                    rows={7}
                ></textarea>

                <div className="panel-prop">
                    <label htmlFor="input-var-collections">Collection:</label>
                    <select
                        id="input-var-collections"
                        value={selectedVarColl?.id ?? ''}
                        onChange={(e) => {
                            const found = varCollections.find((v) => v.id === e.target.value)
                            setSelectedVarColl(found ?? null)
                        }}
                    >
                        <option value="">New</option>
                        {varCollections.map((varCollection) => (
                            <option key={varCollection.id} value={varCollection.id}>
                                {varCollection.name}
                            </option>
                        ))}
                    </select>
                </div>

                {!selectedVarColl && (
                    <div className="panel-prop">
                        <label htmlFor="input-var-collection-name">Collection Name:</label>
                        <input
                            id="input-var-collection-name"
                            type="text"
                            value={newVarCollName}
                            onChange={(e) => setNewCollName(e.target.value)}
                            placeholder={DEFAULT_INPUTED_VAR_COLLECTION_NAME}
                        />
                    </div>
                )}
                <button onClick={importVarJSON} disabled={isProcessing}>Import</button>
            </div>
        </section>
    )
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ImportVariables />
    </StrictMode>
)
