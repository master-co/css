import { CSSRuntimeProvider } from '../src/runtime-provider'
import { useState, useEffect, useRef } from 'react'
import type { MasterCSSPlan } from '@master/css-runtime'
import defaultPlanJSON from '@master/css-preset/default-plan.json' with { type: 'json' }

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan

export default function Runtime() {
    const [plan, setPlan] = useState<MasterCSSPlan>({
        version: 2,
        utilities: [
            {
                id: '.btn',
                name: 'btn',
                type: -4,
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

    return <CSSRuntimeProvider root={root} plan={plan}>
        <button id="config-btn" className="btn" onClick={() => setPlan(defaultPlan)}></button>
        <button id="root-btn" onClick={() => setRoot(shadowRoot)}></button>
        <div id="container" ref={containerRef}></div>
    </CSSRuntimeProvider>
}
