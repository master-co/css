import React from 'react'

export default function Componennt() {
    const a = 'hello'
    const b = 3
    return (
        <div className={`block text:center font:italic fg:#${a || 'block'} text:16 m:${b}`}> </div>
    )
}