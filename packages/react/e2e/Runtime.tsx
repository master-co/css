import { CSSRuntimeProvider } from '../src/runtime-provider'
import { useState, useEffect, useRef } from 'react'
import type { Config } from '@master/css'

export default function Runtime() {
    const [config, setConfig] = useState<Config>({
        utilities: [
            {
                name: 'btn',
                type: -4,
                layer: 'components',
                rules: [
                    { selector: '&', declarations: { border: '0.125rem solid oklch(63.7% 0.237 25.331)' } }
                ]
            }
        ]
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

    return <CSSRuntimeProvider root={root} config={config}>
        <button id="config-btn" className="btn" onClick={() => setConfig({})}></button>
        <button id="root-btn" onClick={() => setRoot(shadowRoot)}></button>
        <div id="container" ref={containerRef}></div>
    </CSSRuntimeProvider>
}
