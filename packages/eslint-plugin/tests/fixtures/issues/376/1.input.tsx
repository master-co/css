import React from 'react'

export default function Componennt() {
  const a = 'hello'
  const b = 3
  return (
    <div className={`block text-center font:italic color:#${a || "display:block"} text:1rem margin:${b}`}> </div>
  )
}