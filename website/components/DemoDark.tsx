import { IconMoon } from '@tabler/icons-react'

export default (props: any) =>
    <div className="dark w:1/2">
        <div className="bg:stripe dark bg:base overflow:hidden">
            <IconMoon className='abs fg:lighter font:12 right:4x top:4x' strokeWidth={1} width={24} height={24}/>
            <div className='float:left py:8x translateX(-50%)'>
                {props.children}
            </div>
        </div>
    </div>