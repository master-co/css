import { IconRefresh, IconRotate, IconRotateClockwise } from '@tabler/icons-react'
import clsx from 'clsx'
import Demo from 'internal/components/Demo'

export default ({ className }: any) => {
    const iconClassName = clsx(className, 'app-icon-primary animation:rotate|1s|linear|infinite size:12x stroke:.5')
    return (
        <Demo>
            {className === 'animation-direction:normal' && <IconRotateClockwise className={iconClassName} />}
            {className === 'animation-direction:reverse' && <IconRotate className={iconClassName} />}
            {className === 'animation-direction:alternate' && <IconRefresh className={iconClassName} />}
            {className === 'animation-direction:alternate-reverse' && <IconRefresh className={iconClassName} />}
        </Demo>
    )
}