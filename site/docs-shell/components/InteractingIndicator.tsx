import { IconHandClick, IconHandMove, IconTestPipe, IconForms, IconWand, IconResize } from '@tabler/icons-react'
import clsx from 'clsx'

export default function InteractingIndicator({ children, icon }: any) {
  const iconClass = 'app-icon flex:0|0|auto mr:2x stroke:1 vertical-align:middle'
  return (
    <p className="pl:2.2em text:md! font-weight:460 text-indent:-2.2em text:strong">
      {icon === 'wand' && <IconWand width="1.25em" height="1.25em" className={clsx(iconClass, 'stroke:accent>:is(:nth-child(3),:nth-child(4))')} />}
      {icon === 'hover' && <IconHandMove width="1.25em" height="1.25em" className={iconClass} />}
      {icon === 'click' && <IconHandClick width="1.25em" height="1.25em" className={clsx(iconClass, 'stroke:accent>:is(:nth-child(5),:nth-child(6),:nth-child(7),:nth-child(8))')} />}
      {icon === 'type' && <IconForms width="1.25em" height="1.25em" className={iconClass} />}
      {icon === 'observe' && <IconTestPipe width="1.25em" height="1.25em" className={iconClass} />}
      {icon === 'resize' && <IconResize width="1.25em" height="1.25em" className={iconClass} />}
      {icon === 'test' && <IconTestPipe width="1.25em" height="1.25em" className={iconClass} />}
      {children}
    </p>
  )
}
