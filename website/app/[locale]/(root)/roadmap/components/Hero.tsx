'use client'

import { Novatrix } from 'uvcanvas'

export default function Hero() {
    return (
        // @ts-expect-error Property 'className' does not exist on type 'IntrinsicAttributes & NovatrixProps'
        <Novatrix className="abs inset:0" style={{ width: 1480, height: 352 }} />
    )

}