import { IconMoon } from '@tabler/icons-react'

export default (props: any) =>
  <div className="w:50% dark">
    <div className="overflow:hidden background:var(--stripe) surface:base dark">
      <IconMoon className='abs right:md top:md font:xs text:subtle' strokeWidth={1} width={24} height={24}/>
      <div className='float:left py:2xl transform:translateX(-50%)'>
        {props.children}
      </div>
    </div>
  </div>
