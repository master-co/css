import Demo from 'internal/components/Demo'
import clsx from 'clsx'
import { IconUfo } from '@tabler/icons-react'

export default ({ className }: any) => {
    return (
        <Demo>
            <IconUfo className={clsx(className, 'mr:-48 size:12x stroke:.5 stroke:text-lightest')} strokeDasharray={1.5} />
            <IconUfo className={clsx(className, 'app-icon-primary @float|3s|ease-in-out|infinite size:12x stroke:.5')} />
        </Demo>
    )
}