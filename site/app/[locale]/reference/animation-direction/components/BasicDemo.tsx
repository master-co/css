import { IconRefresh, IconRotate, IconRotateClockwise } from '@tabler/icons-react'
import clsx from 'clsx'
import { Demo } from '~/site/components/demo'

export default ({ className }: any) => {
  const iconClassName = clsx(className, 'height:3rem width:3rem animation:rotate|1s|linear|infinite stroke-width:.5 app-icon-primary')
  return (
    <Demo className="display:flex flex-wrap:wrap align-items:center justify-content:center">
      {className === 'animation-direction:normal' && <IconRotateClockwise className={iconClassName} />}
      {className === 'animation-direction:reverse' && <IconRotate className={iconClassName} />}
      {className === 'animation-direction:alternate' && <IconRefresh className={iconClassName} />}
      {className === 'animation-direction:alternate-reverse' && <IconRefresh className={iconClassName} />}
    </Demo>
  )
}