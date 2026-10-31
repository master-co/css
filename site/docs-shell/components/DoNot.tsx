import { IconCircleX } from '@tabler/icons-react'

export default function DoNot({ children }: any) {
  return (
    <p className="flex mt-lg">
      <span className="relative basis-auto grow(0) shrink(0) mr-xs (margin-left:-0.25rem)">
        {/* <svg className='absolute top-auto right(0) (bottom:-0.875rem) left(0)  m-auto bg-crimson-40/.3 (height:calc(100%-14px)) w(1)'></svg> */}
        <IconCircleX width="1.25em" height="1.25em" className="relative inline-flex fill-crimson-40/.15 stroke-crimson-40 (stroke-width:1.2) vertical-text-top" />
      </span>
      <span>{children}</span>
    </p>
  )
}
