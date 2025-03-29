import { IconRefresh, IconRotate, IconRotateClockwise } from '@tabler/icons-react'
import clsx from 'clsx'
import Demo from 'internal/components/Demo'

export default ({ className }: any) => {
    const iconClassName = clsx(className, 'app-icon-primary @rotate|1s|linear|infinite size:12x stroke:.5')
    return (
        <Demo>
            {className === '@direction:normal' && <IconRotateClockwise className={iconClassName} />}
            {className === '@direction:reverse' && <IconRotate className={iconClassName} />}
            {className === '@direction:alternate' && <IconRefresh className={iconClassName} />}
            {className === '@direction:alt' && <IconRefresh className={iconClassName} />}
            {className === '@direction:alternate-reverse' && <IconRefresh className={iconClassName} />}
            {className === '@direction:alt-reverse' && <IconRefresh className={iconClassName} />}
        </Demo>
    )
}