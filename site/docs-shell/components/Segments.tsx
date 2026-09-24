'use client'

import { useState } from 'react'
import clsx from 'clsx'

export default function Segments({ children: segments }: any) {
  const [activeSegment, setActiveSegment] = useState(segments[0].name)
  return (
    <>
      {/* 5px = 4px + 1px outline */}
      <div className='w:fit mb:sm segments'>
        {segments.map((segment: any) => {
          return (
            <button key={segment.name}
              onClick={() => setActiveSegment(segment.name)}
              className={clsx('segment', { active: activeSegment === segment.name })}>
              {segment.name}
            </button>
          )
        })}
      </div>
      {segments.map((segment: any) =>
        activeSegment === segment.name && <div key={segment.name} className='contents'>
          {segment.content}
        </div>
      )}
    </>
  )
}
