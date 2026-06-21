import { CSSRuntimeProvider } from '../src/runtime-provider'
import { useState, useEffect, useRef } from 'react'
import type { MasterCSSManifest } from '@master/css-runtime'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import UtilityType from 'shared/utility-type'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

export default function Runtime() {
    const [manifest, setPlan] = useState<MasterCSSManifest>({
        version: 1,
        utilities: [
            {
                id: '.btn',
                name: 'btn',
                type: UtilityType.Semantic,
                order: 0,
                layer: 'components',
                emit: {
                    type: 'static',
                    rules: [
                        { selector: '&', declarations: { border: '0.125rem solid oklch(63.7% 0.237 25.331)' } }
                    ]
                },
                matchers: [{ type: 'static', name: 'btn' }]
            }
        ],
        utilityBuckets: {
            arbitrary: [0]
        }
    })
    const [root, setRoot] = useState<ShadowRoot>()
    const containerRef = useRef<HTMLDivElement>(null)
    const [shadowRoot, setShadowRoot] = useState<ShadowRoot>()

    useEffect(() => {
        if (containerRef.current) {
            const newShadowRoot = containerRef.current.attachShadow({ mode: 'open' })

            const shadowContent = document.createElement('div')
            shadowContent.className = 'f:1000'
            newShadowRoot.appendChild(shadowContent)

            setShadowRoot(newShadowRoot)
        }
    }, [containerRef])

    return <CSSRuntimeProvider root={root} manifest={manifest}>
        <button id="config-btn" className="btn" onClick={() => setPlan(defaultManifest)}></button>
        <button id="root-btn" onClick={() => setRoot(shadowRoot)}></button>
        <div id="container" ref={containerRef}></div>
    </CSSRuntimeProvider>
}
