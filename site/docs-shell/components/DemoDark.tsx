import { IconMoon } from '@tabler/icons-react'

export default (props: any) =>
  <div className="width:50% dark">
    <div className="overflow:hidden background:var(--stripe) surface-base dark">
      <IconMoon className='position:absolute right-md top-md font-xs fg-text-muted' strokeWidth={1} width={24} height={24}/>
      <div className='float:left py-2xl transform:translateX(-50%)'>
        {props.children}
      </div>
    </div>
  </div>
