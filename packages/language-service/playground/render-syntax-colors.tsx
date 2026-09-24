import React from 'react'

export default () => (
  <>
    <div className='bg-blue fg:#fff fg:rgb(0,0,0) fg:rgb(10,50,30)'></div>
    <div className='bg-blue-50/.5 b:1px|solid|var(--color-blue-30)'></div>
    <div className='shadow:1px|1px|2px|oklch(0%|0|none),2px|2px|3px|oklch(100%|0|none)'></div>
    <div className='background-image:linear-gradient(oklch(0%|0|none),oklch(100%|0|none))'></div>
    <div className='background-image:radial-gradient(oklch(0%|0|none),oklch(100%|0|none))'></div>
  </>
)
