import { IconRefresh, IconRotate, IconRotateClockwise } from '@tabler/icons-react'
import clsx from 'clsx'
import { Demo } from '~/site/components/demo'

export default ({ className }: any) => {
  const iconClassName = clsx(className, 'app-icon-primary size:12x animation:rotate|1s|linear|infinite stroke:.5')
  return (
    <Demo className="flex flex-wrap items-center justify-center">
      {className === 'animation-direction:normal' && <IconRotateClockwise className={iconClassName} />}
      {className === 'animation-direction:reverse' && <IconRotate className={iconClassName} />}
      {className === 'animation-direction:alternate' && <IconRefresh className={iconClassName} />}
      {className === 'animation-direction:alternate-reverse' && <IconRefresh className={iconClassName} />}
    </Demo>
  )
}